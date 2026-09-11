from pathlib import Path

INDEX = Path("index.html")
text = INDEX.read_bytes().decode("utf-8")
newline = "\r\n" if "\r\n" in text else "\n"

sheet_line = "        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_PHt3LmAsjEbH_9XCiD18E8XFgY2gWb0QDQhghJmM0V9eZDCz1CcWUIJA5h_abKecwLEn_XIEzlsH/pub?output=csv';"
index_line = "        const RESEARCH_INDEX_URL = 'research/research-index.json';"

if index_line not in text:
    if sheet_line not in text:
        raise SystemExit("Could not find SHEET_CSV_URL declaration")
    text = text.replace(sheet_line, sheet_line + newline + index_line, 1)

start_marker = "        async function loadResearchData() {"
end_marker = "            function switchLanguage(lang) {"
start = text.find(start_marker)
end = text.find(end_marker, start)

if start < 0 or end < 0:
    raise SystemExit("Could not locate research loader boundaries")

replacement = r'''        function normalizeResearchArticle(article) {
            if (!article || typeof article !== 'object') return {};

            const normalized = {};
            Object.entries(article).forEach(([key, value]) => {
                if (value === null || value === undefined || typeof value === 'object') return;
                normalized[key.toUpperCase()] = String(value).trim();
            });

            normalized.ID = String(article.id || article.ID || article.code || article.CODE || normalized.ID || normalized.CODE || '').trim();
            normalized.DATE = String(article.date || article.DATE || normalized.DATE || '').trim();
            normalized.CATEGORY = String(article.category || article.CATEGORY || normalized.CATEGORY || '').trim();

            ['ko', 'en', 'de'].forEach(lang => {
                const localized = article[lang];
                if (!localized || typeof localized !== 'object') return;
                const suffix = lang.toUpperCase();
                if (localized.title) normalized[`TITLE_${suffix}`] = String(localized.title).trim();
                if (localized.excerpt) normalized[`EXCERPT_${suffix}`] = String(localized.excerpt).trim();
                if (localized.link) normalized[`LINK_${suffix}`] = String(localized.link).trim();
            });

            return normalized;
        }

        function parseResearchSheet(csvText) {
            const rows = parseCSV(csvText);
            if (!rows.length) return [];

            const headers = rows[0].map(h => h.trim().replace(/^\uFEFF/, '').toUpperCase());
            return rows.slice(1).filter(row => row.length > 1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] ? row[index].trim() : '';
                });
                return normalizeResearchArticle(obj);
            });
        }

        function getResearchArticleKey(article, fallbackIndex = 0) {
            const date = (article.DATE || '').trim().toLowerCase();
            const title = (article.TITLE_KR || article.TITLE_EN || article.TITLE_DE || article.TITLE || '').trim().toLowerCase();
            if (date && title) return `title:${date}:${title}`;

            const id = (article.ID || article.CODE || article.SLUG || '').trim().toLowerCase();
            if (id) return `id:${id}`;

            const link = (article.LINK_KR || article.LINK_EN || article.LINK_DE || article.LINK || '').trim().toLowerCase();
            if (link) return `link:${link}`;

            return `fallback:${fallbackIndex}:${JSON.stringify(article)}`;
        }

        async function loadResearchData() {
            const sheetPromise = fetch(SHEET_CSV_URL, { cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error(`Google Sheet HTTP ${response.status}`);
                    return response.text();
                })
                .then(parseResearchSheet);

            const githubPromise = fetch(RESEARCH_INDEX_URL, { cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error(`Research index HTTP ${response.status}`);
                    return response.json();
                })
                .then(payload => {
                    const articles = Array.isArray(payload) ? payload : (payload.articles || []);
                    if (!Array.isArray(articles)) throw new Error('Invalid research-index.json format');
                    return articles.map(normalizeResearchArticle);
                });

            try {
                const [sheetResult, githubResult] = await Promise.allSettled([sheetPromise, githubPromise]);
                const sheetArticles = sheetResult.status === 'fulfilled' ? sheetResult.value : [];
                const githubArticles = githubResult.status === 'fulfilled' ? githubResult.value : [];

                if (sheetResult.status === 'rejected') console.warn('Legacy research sheet unavailable:', sheetResult.reason);
                if (githubResult.status === 'rejected') console.warn('GitHub research index unavailable:', githubResult.reason);

                if (!sheetArticles.length && !githubArticles.length) {
                    throw new Error('No research data source could be loaded.');
                }

                const merged = new Map();
                sheetArticles.forEach((article, index) => {
                    merged.set(getResearchArticleKey(article, index), article);
                });
                githubArticles.forEach((article, index) => {
                    // GitHub-native metadata intentionally overrides a matching legacy Sheet entry.
                    merged.set(getResearchArticleKey(article, sheetArticles.length + index), article);
                });

                researchArticles = Array.from(merged.values());
                isResearchDataLoaded = true;
                renderResearch();
            } catch (error) {
                console.error('Failed to load research data:', error);
                document.getElementById('research-grid').innerHTML = '<p class="text-red-500 col-span-full text-center font-semibold">Failed to load data. Please check your connection or try again later.</p>';
            }
        }

'''.replace("\n", newline)

text = text[:start] + replacement + text[end:]
INDEX.write_bytes(text.encode("utf-8"))
print("Research loader migration applied successfully.")
