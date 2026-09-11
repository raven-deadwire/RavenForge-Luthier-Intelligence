from pathlib import Path

INDEX = Path("index.html")
text = INDEX.read_bytes().decode("utf-8")
newline = "\r\n" if "\r\n" in text else "\n"

sheet_line = "        const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS_PHt3LmAsjEbH_9XCiD18E8XFgY2gWb0QDQhghJmM0V9eZDCz1CcWUIJA5h_abKecwLEn_XIEzlsH/pub?output=csv';"
index_line = "        const RESEARCH_INDEX_URL = 'research/research-index.json';"

# The legacy Sheet has been fully migrated. Remove its runtime dependency.
text = text.replace(sheet_line + newline, "", 1)
if index_line not in text:
    raise SystemExit("Could not find RESEARCH_INDEX_URL declaration")

start_marker = "        function normalizeResearchArticle(article) {"
end_marker = "            function switchLanguage(lang) {"
start = text.find(start_marker)
end = text.find(end_marker, start)

if start < 0 or end < 0:
    raise SystemExit("Could not locate GitHub research loader boundaries")

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

        async function loadResearchData() {
            try {
                const response = await fetch(RESEARCH_INDEX_URL, { cache: 'no-store' });
                if (!response.ok) throw new Error(`Research index HTTP ${response.status}`);

                const payload = await response.json();
                const articles = Array.isArray(payload) ? payload : (payload.articles || []);
                if (!Array.isArray(articles)) throw new Error('Invalid research-index.json format');

                researchArticles = articles.map(normalizeResearchArticle);
                isResearchDataLoaded = true;
                renderResearch();
            } catch (error) {
                console.error('Failed to load GitHub research data:', error);
                document.getElementById('research-grid').innerHTML = '<p class="text-red-500 col-span-full text-center font-semibold">Failed to load research data. Please try again later.</p>';
            }
        }

'''.replace("\n", newline)

text = text[:start] + replacement + text[end:]
INDEX.write_bytes(text.encode("utf-8"))
print("Research loader finalized: GitHub metadata only.")
