#!/usr/bin/env python3
"""Report whether GitHub Pages already serves the checked-out homepage quote code.

Usage: python3 tools/check_pages_freshness.py LIVE_ROOT

Compares every tracked file the homepage quote QA depends on with the bytes
Pages serves. Prints a GitHub Actions notice and writes `current=true|false`
to $GITHUB_OUTPUT. A lagging deploy is not a failure: the caller decides.
"""
import concurrent.futures, os, pathlib, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

PATHSPECS = ['index.html', 'ko.html', 'de.html', 'configurator.html', 'assets/configurator*']


def fetch(root, name):
    # Cache-busting query so a stale CDN copy is not mistaken for the deploy.
    url = root + urllib.parse.quote(name, safe='/') + f'?freshness={int(time.time())}'
    request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def main():
    root = sys.argv[1].rstrip('/') + '/'
    sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    paths = subprocess.check_output(['git', 'ls-files', '--', *PATHSPECS], text=True).splitlines()
    assert 'index.html' in paths and 'configurator.html' in paths, paths
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        live = dict(zip(paths, pool.map(lambda name: fetch(root, name), paths)))
    stale = [name for name in paths if live[name] != pathlib.Path(name).read_bytes()]
    current = not stale
    if current:
        print(f'::notice title=Pages is current::{len(paths)} homepage quote files on {root} match {sha[:12]}')
    else:
        shown = ', '.join(stale[:10]) + (f' (+{len(stale) - 10} more)' if len(stale) > 10 else '')
        print(f'::notice title=Pages deploy pending::{len(stale)}/{len(paths)} homepage quote files on {root} '
              f'differ from {sha[:12]}: {shown}')
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as handle:
            handle.write(f'### Pages freshness against `{sha[:12]}`\n\n')
            handle.write('All homepage quote files match.\n' if current else
                         'Deployed site is behind; differing files:\n\n' + ''.join(f'- `{name}`\n' for name in stale))
    output = os.environ.get('GITHUB_OUTPUT')
    if output:
        with open(output, 'a') as handle:
            handle.write(f'current={str(current).lower()}\n')


if __name__ == '__main__':
    main()
