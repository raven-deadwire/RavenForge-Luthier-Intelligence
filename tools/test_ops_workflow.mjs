// Real collector/CLI and shell integration tests. APIs are mocked and git
// remotes are local temporary directories; no credentials or network needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, chmod, access, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as climate from './ops_climate.mjs';
import * as trends from './ops_search_trends.mjs';
import { ApiError, runCli } from './ops_reporting.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const marker = 'fake-test-key+/%=DO_NOT_LOG';
const now = Date.parse('2026-11-08T03:00:00Z');
const credentials = { DATA_GO_KR_API_KEY: marker, NAVER_API_HUB_CLIENT_ID: 'fake-id', NAVER_API_HUB_CLIENT_SECRET: marker };
const response = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => typeof value === 'string' ? value : JSON.stringify(value) });
const asos = (items = []) => response({ response: { header: { resultCode: '00' }, body: { totalCount: items.length, items: { item: items } } } });
const item = { tm: '2026-11-07', avgTa: '12', avgRhm: '50' };
const absent = async file => { await assert.rejects(access(file), { code: 'ENOENT' }); };

async function sandbox() {
  const root = await mkdtemp(path.join(tmpdir(), 'rf-ops-workflow-'));
  await mkdir(path.join(root, 'ops'), { recursive: true });
  await cp(path.join(ROOT, 'ops/config'), path.join(root, 'ops/config'), { recursive: true });
  return root;
}

async function capture(root, name, action) {
  const env = { GITHUB_OUTPUT: path.join(root, `${name}-output`), GITHUB_STEP_SUMMARY: path.join(root, `${name}-summary`) };
  const logs = [];
  const exitCode = await runCli(name, action, { env, log: line => logs.push(line) });
  return { exitCode, text: [...logs, await readFile(env.GITHUB_OUTPUT, 'utf8'), await readFile(env.GITHUB_STEP_SUMMARY, 'utf8')].join('\n') };
}

for (const [name, collector] of [['climate', climate], ['trends', trends]]) {
  test(`${name}: missing credentials are reported without a request or data directory`, async () => {
    const root = await sandbox();
    const result = await capture(root, name, () => collector.run({ root, env: {}, fetchImpl: () => assert.fail('network called') }));
    assert.equal(result.exitCode, 0);
    assert.match(result.text, /SKIPPED_MISSING_SECRET/);
    assert.match(result.text, /changed=false/);
    await absent(path.join(root, 'ops/data'));
  });

  test(`${name}: transport and body-read errors cannot echo encoded keys`, async () => {
    for (const bodyFailure of [false, true]) {
      const root = await sandbox();
      const fail = () => { throw new Error(`failed https://example.invalid?serviceKey=${encodeURIComponent(marker)} ${marker}`); };
      const result = await capture(root, name, () => collector.run({ root, env: credentials, now,
        fetchImpl: bodyFailure ? async () => ({ ok: true, status: 200, text: fail }) : fail }));
      assert.equal(result.exitCode, 1);
      assert.match(result.text, /API_ERROR/);
      assert.match(result.text, /NETWORK_ERROR/);
      assert.ok(!result.text.includes(marker) && !result.text.includes(encodeURIComponent(marker)));
      await absent(path.join(root, 'ops/data'));
    }
  });
}

test('ASOS HTTP-200 XML and JSON errors expose only allowlisted codes', async () => {
  for (const payload of [
    `<OpenAPI_ServiceResponse><returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg><key>${marker}</key></OpenAPI_ServiceResponse>`,
    { response: { header: { resultCode: '30', resultMsg: marker } } },
    { response: { header: { resultCode: marker, resultMsg: marker } } },
    `<html>${marker}</html>`
  ]) {
    const root = await sandbox();
    const result = await capture(root, 'climate', () => climate.run({ root, env: credentials, now, fetchImpl: async () => response(payload) }));
    assert.equal(result.exitCode, 1);
    assert.match(result.text, /API_ERROR HTTP=200/);
    assert.ok(!result.text.includes(marker));
    await absent(path.join(root, 'ops/data'));
  }
});

test('API HUB Gateway errors preserve data and never echo error bodies', async () => {
  for (const status of [300, 400, 401, 403, 429, 500]) {
    const root = await sandbox();
    await mkdir(path.join(root, 'ops/data'));
    const file = path.join(root, 'ops/data/search-trends.json');
    await writeFile(file, 'previous-series\n');
    const result = await capture(root, 'trends', () => trends.run({ root, env: credentials, now,
      fetchImpl: async () => response({ error: { errorCode: status === 401 ? '200' : String(status), message: marker, details: encodeURIComponent(marker) } }, status) }));
    assert.equal(result.exitCode, 1);
    assert.match(result.text, new RegExp(`API_ERROR HTTP=${status} code=${status === 401 ? '200' : status}`));
    assert.ok(!result.text.includes(marker) && !result.text.includes(encodeURIComponent(marker)));
    assert.equal(await readFile(file, 'utf8'), 'previous-series\n');
  }
});

test('API HUB unknown codes, validation errors and non-JSON bodies remain private', async () => {
  for (const payload of [
    { error: { errorCode: marker, message: marker, details: encodeURIComponent(marker) } },
    { errorCode: marker, errorMessage: marker },
    { errMsg: marker, errId: encodeURIComponent(marker), body: JSON.stringify(credentials) },
    `<html>${marker} ${encodeURIComponent(marker)}</html>`
  ]) {
    const root = await sandbox();
    await mkdir(path.join(root, 'ops/data'));
    const file = path.join(root, 'ops/data/search-trends.json');
    await writeFile(file, 'previous-series\n');
    const result = await capture(root, 'trends', () => trends.run({ root, env: credentials, now,
      fetchImpl: async () => response(payload, 400) }));
    assert.equal(result.exitCode, 1);
    assert.match(result.text, /API_ERROR HTTP=400 code=UNKNOWN/);
    assert.ok(!result.text.includes(marker) && !result.text.includes(encodeURIComponent(marker)));
    assert.equal(await readFile(file, 'utf8'), 'previous-series\n');
  }
});

test('API HUB error-shaped HTTP 200 is invalid, not a successful empty collection', async () => {
  const root = await sandbox();
  const result = await capture(root, 'trends', () => trends.run({ root, env: credentials, now,
    fetchImpl: async () => response({ errMsg: marker, errId: marker, body: marker }) }));
  assert.equal(result.exitCode, 1);
  assert.match(result.text, /API_ERROR HTTP=200 code=INVALID_RESPONSE/);
  assert.ok(!result.text.includes(marker));
  await absent(path.join(root, 'ops/data'));
});

test('API HUB uses only the new credential pair and rejects redirect transport failures', async () => {
  const root = await sandbox();
  let calls = 0;
  const result = await capture(root, 'trends', () => trends.run({ root, now,
    env: { ...credentials, NAVER_CLIENT_ID: 'legacy-id', NAVER_CLIENT_SECRET: 'legacy-secret' },
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers['X-NCP-APIGW-API-KEY-ID'], credentials.NAVER_API_HUB_CLIENT_ID);
      assert.equal(options.headers['X-NCP-APIGW-API-KEY'], marker);
      assert.ok(!JSON.stringify(options).includes('legacy-'));
      throw new TypeError(`redirect to https://example.invalid/${encodeURIComponent(marker)}`);
    }
  }));
  assert.equal(calls, 1);
  assert.equal(result.exitCode, 1);
  assert.match(result.text, /API_ERROR HTTP=none code=NETWORK_ERROR/);
  assert.ok(!result.text.includes(marker) && !result.text.includes(encodeURIComponent(marker)));
  await absent(path.join(root, 'ops/data'));
});

test('API HUB actual CLI reports Gateway errors without exposing credentials', async t => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'tools'));
  for (const name of ['ops_search_trends.mjs', 'ops_reporting.mjs']) {
    await cp(path.join(ROOT, 'tools', name), path.join(root, 'tools', name));
  }
  const preload = path.join(root, 'mock-fetch.mjs');
  await writeFile(preload, `globalThis.fetch = async () => ({ ok: false, status: 401,
    text: async () => JSON.stringify({ error: { errorCode: '200', message: process.env.NAVER_API_HUB_CLIENT_SECRET } }) });`);
  const summary = path.join(root, 'summary');
  const output = path.join(root, 'output');
  const result = spawnSync(process.execPath, ['--import', preload, path.join(root, 'tools/ops_search_trends.mjs')], {
    encoding: 'utf8', env: { PATH: process.env.PATH, ...credentials, GITHUB_STEP_SUMMARY: summary, GITHUB_OUTPUT: output }
  });
  assert.equal(result.status, 1);
  assert.equal(result.stderr, '');
  const text = result.stdout + await readFile(summary, 'utf8') + await readFile(output, 'utf8');
  assert.match(text, /API_ERROR HTTP=401 code=200/);
  assert.match(text, /changed=false/);
  assert.ok(!text.includes(marker));
  await absent(path.join(root, 'ops/data'));
});

test('API HUB workflow and setup instructions agree on the new secret names', async () => {
  const workflow = await readFile(path.join(ROOT, '.github/workflows/ops-data.yml'), 'utf8');
  const notice = await readFile(path.join(ROOT, 'ops/ops.js'), 'utf8');
  const readme = await readFile(path.join(ROOT, 'README.md'), 'utf8');
  for (const name of ['NAVER_API_HUB_CLIENT_ID', 'NAVER_API_HUB_CLIENT_SECRET']) {
    assert.ok(workflow.includes(`${name}: \u0024{{ secrets.${name} }}`));
    assert.ok(notice.includes(name));
    assert.ok(readme.includes(name));
  }
  assert.doesNotMatch(workflow, /secrets\.NAVER_CLIENT_/);
  assert.doesNotMatch(notice, /NAVER_CLIENT_|네이버 개발자센터에서/);
  assert.match(notice, /구 개발자센터 키 사용 불가/);
  assert.match(readme, /Existing NAVER Developers\nCenter credentials cannot be used/);
});

test('empty ASOS and DataLab responses preserve existing data and report NO_DATA', async () => {
  const root = await sandbox();
  const first = await climate.run({ root, env: credentials, now, fetchImpl: async () => asos([item]) });
  const before = await readFile(first.file, 'utf8');
  for (const payload of [asos(), response({ response: { header: { resultCode: '03' } } })]) {
    const result = await capture(root, 'climate', () => climate.run({ root, env: credentials, now, fetchImpl: async () => payload }));
    assert.equal(result.exitCode, 0);
    assert.match(result.text, /NO_DATA/);
    assert.equal(await readFile(first.file, 'utf8'), before);
  }
  const file = path.join(root, 'ops/data/search-trends.json');
  await writeFile(file, 'previous-trends');
  const result = await capture(root, 'trends', () => trends.run({ root, env: credentials, now, fetchImpl: async () => response({ results: [] }) }));
  assert.equal(result.exitCode, 0);
  assert.match(result.text, /NO_DATA/);
  assert.equal(await readFile(file, 'utf8'), 'previous-trends');
});

test('first empty response does not create a public empty dataset', async () => {
  const root = await sandbox();
  const result = await climate.run({ root, env: credentials, now, fetchImpl: async () => asos() });
  assert.equal(result.status, 'NO_DATA');
  assert.equal(result.changed, false);
  await absent(path.join(root, 'ops/data'));
});

test('DataLab accepts numeric-string ratios and reports a successful collection', async () => {
  const root = await sandbox();
  const config = JSON.parse(await readFile(path.join(root, 'ops/config/search-trends.json'), 'utf8'));
  const result = await trends.run({ root, env: credentials, now, fetchImpl: async () => response({
    startDate: '2023-01-01', endDate: '2026-11-08', timeUnit: 'week',
    results: config.groups.map(group => ({ title: group.name, keywords: group.keywords, data: [{ period: '2026-11-02', ratio: '12.3456' }] }))
  }) });
  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.count, 5);
  assert.equal(result.latest, '2026-11-02');
  assert.equal(result.output.groups[0].points[0].ratio, 12.35);
});

test('DataLab malformed series fails without replacing previous data; empty groups are NO_DATA', async () => {
  const root = await sandbox();
  await mkdir(path.join(root, 'ops/data'));
  const file = path.join(root, 'ops/data/search-trends.json');
  await writeFile(file, 'previous');
  for (const results of [[null], [{}], Array.from({ length: 5 }, () => ({ data: [{ period: marker, ratio: 1 }] }))]) {
    const result = await capture(root, 'trends', () => trends.run({ root, env: credentials, now, fetchImpl: async () => response({
      startDate: '2023-01-01', endDate: '2026-11-08', timeUnit: 'week', results
    }) }));
    assert.equal(result.exitCode, 1);
    assert.match(result.text, /API_ERROR.*INVALID_RESPONSE/);
    assert.ok(!result.text.includes(marker));
    assert.equal(await readFile(file, 'utf8'), 'previous');
  }
  const result = await trends.run({ root, env: credentials, now, fetchImpl: async () => response({ results: Array.from({ length: 5 }, () => ({ data: [] })) }) });
  assert.equal(result.status, 'NO_DATA');
  assert.equal(await readFile(file, 'utf8'), 'previous');
});

test('ASOS later-page error does not write a partial backfill', async () => {
  const root = await sandbox();
  const first = await climate.run({ root, env: credentials, now, fetchImpl: async () => asos([item]) });
  const before = await readFile(first.file, 'utf8');
  let calls = 0;
  await assert.rejects(climate.run({ root, env: credentials, now, fetchImpl: async () => {
    calls += 1;
    return calls === 1
      ? response({ response: { header: { resultCode: '00' }, body: { totalCount: 1000, items: { item: [item] } } } })
      : response({ response: { header: { resultCode: '30', resultMsg: marker } } });
  } }), ApiError);
  assert.equal(calls, 2);
  assert.equal(await readFile(first.file, 'utf8'), before);
});

test('successful unchanged fetch still reports SUCCESS, counts and latest date', async () => {
  const root = await sandbox();
  const run = () => climate.run({ root, env: credentials, now, fetchImpl: async (_url, options) => {
    assert.equal(options.redirect, 'error');
    return asos([item]);
  } });
  await run();
  const result = await capture(root, 'climate', run);
  assert.equal(result.exitCode, 0);
  assert.match(result.text, /SUCCESS fetched=1 latest=2026-11-07 changed=false/);
});

test('local exceptions and malicious provider metrics are not copied to summaries', async () => {
  const root = await sandbox();
  const error = await capture(root, 'climate', () => { throw new Error(marker); });
  assert.equal(error.exitCode, 1);
  assert.match(error.text, /COLLECTOR_ERROR/);
  assert.ok(!error.text.includes(marker));
  const result = await capture(root, 'trends', () => ({ status: 'SUCCESS', changed: false, latest: marker, count: marker }));
  assert.match(result.text, /fetched=0 latest=none/);
  assert.ok(!result.text.includes(marker));
});

test('actual CLI emits missing-secret summary and exits zero; bad arguments fail safely', async () => {
  const root = await sandbox();
  for (const script of ['ops_climate.mjs', 'ops_search_trends.mjs']) {
    const result = spawnSync(process.execPath, [path.join(ROOT, 'tools', script)], { encoding: 'utf8', env: {
      PATH: process.env.PATH, GITHUB_STEP_SUMMARY: path.join(root, 'summary'), GITHUB_OUTPUT: path.join(root, 'output')
    } });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /SKIPPED_MISSING_SECRET/);
    assert.equal(result.stderr, '');
  }
  const result = spawnSync(process.execPath, [path.join(ROOT, 'tools/ops_climate.mjs'), '--since', marker], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /COLLECTOR_ERROR/);
  assert.ok(!result.stdout.includes(marker) && !result.stderr.includes(marker));
});

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function gitSandbox() {
  const root = await mkdtemp(path.join(tmpdir(), 'rf-ops-git-'));
  const remote = path.join(root, 'remote.git');
  const repo = path.join(root, 'repo');
  git(root, 'init', '--bare', '--initial-branch=main', remote);
  git(root, 'clone', remote, repo);
  git(repo, 'config', 'user.name', 'Ops Test');
  git(repo, 'config', 'user.email', 'ops-test@example.invalid');
  await writeFile(path.join(repo, 'README'), 'fixture');
  git(repo, 'add', 'README');
  git(repo, 'commit', '-m', 'fixture');
  git(repo, 'push', 'origin', 'main');
  const env = { ...process.env, GITHUB_REF_NAME: 'main', GITHUB_OUTPUT: path.join(root, 'output'), GITHUB_STEP_SUMMARY: path.join(root, 'summary') };
  return { root, remote, repo, env };
}

async function commitData(fixture) {
  const result = spawnSync('bash', [path.join(ROOT, 'tools/ops_commit_data.sh')], { cwd: fixture.repo, env: fixture.env, encoding: 'utf8' });
  return { ...result, output: await readFile(fixture.env.GITHUB_OUTPUT, 'utf8'), summary: await readFile(fixture.env.GITHUB_STEP_SUMMARY, 'utf8') };
}

test('commit step: missing directory and unchanged data exit zero without pushing', async () => {
  const f = await gitSandbox();
  const head = git(f.remote, 'rev-parse', 'main');
  let result = await commitData(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.output, /pushed=false/);
  assert.ok(!result.output.includes('pushed=true'));
  await mkdir(path.join(f.repo, 'ops/data'), { recursive: true });
  result = await commitData(f);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(f.remote, 'rev-parse', 'main'), head);
});

test('commit step: new data pushes once, identical rerun does not push', async () => {
  const f = await gitSandbox();
  const before = git(f.remote, 'rev-parse', 'main');
  await mkdir(path.join(f.repo, 'ops/data'), { recursive: true });
  await writeFile(path.join(f.repo, 'ops/data/climate-108.json'), '{"days":[]}\n');
  let result = await commitData(f);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.output, /pushed=true/);
  const after = git(f.remote, 'rev-parse', 'main');
  assert.notEqual(after, before);
  assert.equal(git(f.remote, 'show', 'main:ops/data/climate-108.json'), '{"days":[]}');
  await writeFile(f.env.GITHUB_OUTPUT, '');
  result = await commitData(f);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!result.output.includes('pushed=true'));
  assert.equal(git(f.remote, 'rev-parse', 'main'), after);
});

test('commit step: rejected push never enables the Pages job', async () => {
  const f = await gitSandbox();
  const head = git(f.remote, 'rev-parse', 'main');
  const hook = path.join(f.remote, 'hooks/pre-receive');
  await writeFile(hook, '#!/bin/sh\nexit 1\n');
  await chmod(hook, 0o755);
  const bin = path.join(f.root, 'bin');
  await mkdir(bin);
  await writeFile(path.join(bin, 'sleep'), '#!/bin/sh\nexit 0\n');
  await chmod(path.join(bin, 'sleep'), 0o755);
  f.env.PATH = `${bin}:${process.env.PATH}`;
  await mkdir(path.join(f.repo, 'ops/data'), { recursive: true });
  await writeFile(path.join(f.repo, 'ops/data/search-trends.json'), '{}\n');
  const result = await commitData(f);
  assert.equal(result.status, 1);
  assert.ok(!result.output.includes('pushed=true'));
  assert.match(result.summary, /COMMIT_OR_PUSH_ERROR/);
  assert.equal(git(f.remote, 'rev-parse', 'main'), head);
});

test('commit step: non-main collection cannot publish data', async () => {
  const f = await gitSandbox();
  f.env.GITHUB_REF_NAME = 'review-only';
  const result = await commitData(f);
  assert.equal(result.status, 1);
  assert.match(result.summary, /BLOCKED_NON_MAIN/);
  assert.ok(!result.output.includes('pushed=true'));
});

test('workflow keeps PRs test-only and isolates Pages permission behind successful push', async () => {
  const workflow = await readFile(path.join(ROOT, '.github/workflows/ops-data.yml'), 'utf8');
  const collect = workflow.split('\n  collect:\n')[1].split('\n  publish:\n')[0];
  const publish = workflow.split('\n  publish:\n')[1];
  assert.match(collect, /if: github.event_name != 'pull_request' && github.ref == 'refs\/heads\/main'/);
  assert.match(collect, /pushed: \$\{\{ steps\.commit\.outputs\.pushed \}\}/);
  assert.ok(!collect.includes('pages: write'));
  assert.ok(!collect.includes('continue-on-error'));
  assert.match(publish, /needs: collect\n    if: needs.collect.outputs.pushed == 'true'/);
  assert.match(publish, /permissions:\n      pages: write/);
  assert.ok(!publish.includes('contents: write'));
  assert.ok(!publish.includes('secrets.'));
});

test('actual Pages request shell reports queued vs failure and suppresses raw error output', async () => {
  const workflow = await readFile(path.join(ROOT, '.github/workflows/ops-data.yml'), 'utf8');
  const script = workflow.split('\n  publish:\n')[1].split('        run: |\n')[1].split('\n').map(line => line.slice(10)).join('\n');
  for (const failure of [false, true]) {
    const root = await mkdtemp(path.join(tmpdir(), 'rf-ops-pages-'));
    const bin = path.join(root, 'bin');
    await mkdir(bin);
    await writeFile(path.join(bin, 'gh'), `#!/bin/sh\nprintf '%s\\n' "$@" > "$REQUEST_ARGS"\necho '${marker}' >&2\nexit ${failure ? 1 : 0}\n`);
    await chmod(path.join(bin, 'gh'), 0o755);
    const summary = path.join(root, 'summary');
    const args = path.join(root, 'args');
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], { encoding: 'utf8', env: {
      PATH: `${bin}:${process.env.PATH}`, GITHUB_REPOSITORY: 'example/repo', GITHUB_STEP_SUMMARY: summary, REQUEST_ARGS: args, GH_TOKEN: marker
    } });
    assert.equal(result.status, failure ? 1 : 0, result.stderr);
    const content = await readFile(summary, 'utf8');
    assert.match(content, failure ? /PAGES_BUILD_REQUEST_FAILED/ : /PAGES_BUILD_REQUESTED \(deployment not yet verified\)/);
    assert.equal(await readFile(args, 'utf8'), 'api\n--method\nPOST\nrepos/example/repo/pages/builds\n--silent\n');
    assert.ok(!(result.stdout + result.stderr + content).includes(marker));
  }
});

// PR #92 review gaps only. Run with --test-name-pattern='^review92:'.
test('review92: null points become INVALID_RESPONSE, not TypeError, preserving bytes', async t => {
  const root = await sandbox();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'ops/data'));
  const file = path.join(root, 'ops/data/search-trends.json');
  const previous = '{"previous":"series"}\n';
  await writeFile(file, previous);
  const config = JSON.parse(await readFile(path.join(root, 'ops/config/search-trends.json'), 'utf8'));
  const valid = { period: '2026-11-02', ratio: 12 };
  for (const points of [[null], [valid, null]]) {
    const results = config.groups.map(group => ({ title: group.name, keywords: group.keywords, data: [valid] }));
    results.at(-1).data = points; // Correct metadata/count; reach the inner point validator.
    const result = await capture(root, 'trends', async () => {
      try {
        await trends.run({ root, env: credentials, now, fetchImpl: async () => response({
          startDate: '2023-01-01', endDate: '2026-11-08', timeUnit: 'week', results
        }) });
      } catch (error) {
        assert.ok(error instanceof ApiError);
        assert.equal(error.code, 'INVALID_RESPONSE');
        assert.equal(error.httpStatus, 200);
        throw error;
      }
    });
    assert.equal(result.exitCode, 1);
    assert.match(result.text, /API_ERROR HTTP=200 code=INVALID_RESPONSE/);
    assert.ok(!result.text.includes('COLLECTOR_ERROR'));
    assert.equal(await readFile(file, 'utf8'), previous);
  }
});

const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;
const realGit = spawnSync('bash', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
const reviewData = 'ops/data/search-trends.json';
const collected = '{"value":"collected"}\n';
async function retryFixture(t, { conflict = false, clearConflict = false, pullFailure = false, pushFailure = false, abortFailure = false } = {}) {
  const f = await gitSandbox();
  t.after(() => rm(f.root, { recursive: true, force: true }));
  await mkdir(path.join(f.repo, 'ops/data'), { recursive: true });
  await writeFile(path.join(f.repo, reviewData), '{"value":"base"}\n');
  git(f.repo, 'add', reviewData);
  git(f.repo, 'commit', '-m', 'seed data');
  git(f.repo, 'push', 'origin', 'main');
  f.peer = path.join(f.root, 'peer');
  git(f.root, 'clone', f.remote, f.peer);
  git(f.peer, 'config', 'user.name', 'Concurrent Writer');
  git(f.peer, 'config', 'user.email', 'peer@example.invalid');
  await writeFile(path.join(f.peer, conflict ? reviewData : 'README'), conflict ? '{"value":"remote"}\n' : 'concurrent documentation\n');
  git(f.peer, 'add', '.');
  git(f.peer, 'commit', '-m', 'concurrent update');
  git(f.peer, 'push', 'origin', 'main');
  f.remoteBefore = git(f.remote, 'rev-parse', 'main');
  await writeFile(path.join(f.repo, reviewData), collected);
  const bin = path.join(f.root, 'bin');
  await mkdir(bin);
  f.calls = path.join(f.root, 'calls');
  f.snapshots = path.join(f.root, 'retry-state');
  // Only failure injection/command tracing is mocked. Fetch, conflicts,
  // rebase, abort, commits and pushes execute real Git against a local remote.
  await writeFile(path.join(bin, 'git'), `#!/usr/bin/env bash
set -eu
if [[ "$1" == pull ]]; then
  echo pull >> ${shellQuote(f.calls)}
  if [[ ${pullFailure ? '1' : '0'} == 1 && ! -f ${shellQuote(path.join(f.root, 'pull-failed'))} ]]; then
    touch ${shellQuote(path.join(f.root, 'pull-failed'))}
    echo 'Injected transient transport failure' >&2
    exit 128
  fi
fi
if [[ "$1" == push ]]; then echo push >> ${shellQuote(f.calls)}; fi
if [[ "$1" == rebase ]] && [[ "$2" == --abort ]]; then
  echo abort >> ${shellQuote(f.calls)}
  ${abortFailure ? 'exit 66' : ':'}
fi
exec ${shellQuote(realGit)} "$@"
`);
  await chmod(path.join(bin, 'git'), 0o755);
  await writeFile(path.join(bin, 'sleep'), `#!/usr/bin/env bash
set -eu
if [[ -d "$(${shellQuote(realGit)} rev-parse --git-path rebase-merge)" || -d "$(${shellQuote(realGit)} rev-parse --git-path rebase-apply)" ]]; then
  echo dirty >> ${shellQuote(f.snapshots)}
else
  echo clean >> ${shellQuote(f.snapshots)}
fi
${clearConflict ? `if [[ ! -f ${shellQuote(path.join(f.root, 'reverted'))} ]]; then
  ${shellQuote(realGit)} -C ${shellQuote(f.peer)} revert --no-edit HEAD
  ${shellQuote(realGit)} -C ${shellQuote(f.peer)} push origin main
  touch ${shellQuote(path.join(f.root, 'reverted'))}
fi` : ':'}
`);
  await chmod(path.join(bin, 'sleep'), 0o755);
  if (pushFailure) {
    const hook = path.join(f.remote, 'hooks/pre-receive');
    await writeFile(hook, '#!/bin/sh\nif [ ! -f rejected-once ]; then touch rejected-once; exit 1; fi\n');
    await chmod(hook, 0o755);
  }
  f.env.PATH = `${bin}:${process.env.PATH}`;
  return f;
}
async function retryEvidence(f, r) {
  const calls = (await readFile(f.calls, 'utf8')).trim().split('\n');
  const retries = await readFile(f.snapshots, 'utf8').catch(() => '');
  const active = await Promise.all(['rebase-merge', 'rebase-apply'].map(async dir => {
    try { await access(path.join(f.repo, git(f.repo, 'rev-parse', '--git-path', dir))); return true; } catch { return false; }
  }));
  const info = {
    exit: r.status, calls, retries: retries.trim(), active: active.some(Boolean),
    branch: git(f.repo, 'rev-parse', '--abbrev-ref', 'HEAD'),
    unmerged: git(f.repo, 'ls-files', '-u'), output: r.output.trim(), summary: r.summary.trim(),
    conflictCount: (r.stdout.match(/CONFLICT/g) || []).length
  };
  // Diagnostic summaries are retained even when a baseline assertion fails.
  console.log('review92 evidence', JSON.stringify(info));
  return info;
}

test('review92: persistent conflict cleans each retry and final exit without losing data', async t => {
  const f = await retryFixture(t, { conflict: true });
  const r = await commitData(f);
  const e = await retryEvidence(f, r);
  assert.equal(r.status, 1);
  assert.equal(e.conflictCount, 3);
  assert.deepEqual(e.calls, ['pull', 'abort', 'pull', 'abort', 'pull', 'abort']);
  assert.equal(e.retries, 'clean\nclean');
  assert.equal(e.active, false);
  assert.equal(e.branch, 'main');
  assert.equal(e.unmerged, '');
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  assert.equal(await readFile(path.join(f.repo, reviewData), 'utf8'), collected);
  assert.equal(git(f.repo, 'show', `HEAD:${reviewData}`), collected.trim());
  assert.equal(git(f.remote, 'rev-parse', 'main'), f.remoteBefore);
  assert.equal(r.output, 'pushed=false\n');
  assert.match(r.summary, /COMMIT_OR_PUSH_ERROR/);
});

test('review92: conflict removed upstream permits second attempt to publish', async t => {
  const f = await retryFixture(t, { conflict: true, clearConflict: true });
  const r = await commitData(f);
  const e = await retryEvidence(f, r);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(e.conflictCount, 1);
  assert.deepEqual(e.calls, ['pull', 'abort', 'pull', 'push']);
  assert.equal(e.retries, 'clean');
  assert.equal(e.active, false);
  assert.equal(e.unmerged, '');
  assert.equal(e.branch, 'main');
  assert.equal(git(f.remote, 'show', `main:${reviewData}`), collected.trim());
  assert.equal(git(f.remote, 'rev-parse', 'main'), git(f.repo, 'rev-parse', 'HEAD'));
  assert.equal(r.output, 'pushed=false\npushed=true\n');
});

test('review92: transient pull failure retries without aborting a nonexistent rebase', async t => {
  const f = await retryFixture(t, { pullFailure: true });
  const r = await commitData(f);
  const e = await retryEvidence(f, r);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(e.calls, ['pull', 'pull', 'push']);
  assert.equal(e.active, false);
  assert.equal(git(f.remote, 'show', 'main:README'), 'concurrent documentation');
  assert.equal(git(f.remote, 'show', `main:${reviewData}`), collected.trim());
  assert.equal(r.output, 'pushed=false\npushed=true\n');
});

test('review92: one rejected push preserves a completed rebase for the retry', async t => {
  const f = await retryFixture(t, { pushFailure: true });
  const r = await commitData(f);
  const e = await retryEvidence(f, r);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(e.calls, ['pull', 'push', 'pull', 'push']);
  assert.equal(e.active, false);
  assert.equal(e.unmerged, '');
  assert.equal(git(f.remote, 'show', 'main:README'), 'concurrent documentation');
  assert.equal(git(f.remote, 'show', `main:${reviewData}`), collected.trim());
  assert.equal(r.output, 'pushed=false\npushed=true\n');
});

test('review92: abort failure stops immediately and never enables publishing', async t => {
  const f = await retryFixture(t, { conflict: true, abortFailure: true });
  const r = await commitData(f);
  const e = await retryEvidence(f, r);
  assert.equal(r.status, 1);
  assert.deepEqual(e.calls, ['pull', 'abort']);
  assert.equal(e.retries, '');
  assert.equal(e.active, true); // Recovery failed: do not claim a clean workspace.
  assert.equal(git(f.remote, 'rev-parse', 'main'), f.remoteBefore);
  assert.equal(r.output, 'pushed=false\n');
  assert.match(r.summary, /REBASE_ABORT_ERROR/);
});
