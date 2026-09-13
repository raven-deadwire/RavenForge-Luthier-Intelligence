(() => {
  'use strict';

  const root = document.documentElement;
  const copy = {
    en: { contact: 'Contact', updated: 'Last Updated' },
    de: { contact: 'Kontakt', updated: 'Zuletzt aktualisiert' },
    ko: { contact: '연락', updated: '마지막 업데이트' }
  };

  // Moon Guitar / Chanho Moon — research data layered over the legacy inline dataset.
  // This runs before DOMContentLoaded, so the existing Analysis / Explorer / Quest
  // renderers pick up the added region, methodology theme and luthier data normally.
  function installMoonGuitarResearch() {
    if (typeof translations !== 'object' || !translations) return;

    const key = 'Moon Guitar — Chanho Moon';

    function orderedRegions(lang, asiaLabel) {
      const current = translations[lang].filterRegions || {};
      return {
        all: current.all || (lang === 'ko' ? '전체' : lang === 'de' ? 'Alle' : 'All'),
        europe: current.europe || (lang === 'ko' ? '유럽' : lang === 'de' ? 'Europa' : 'Europe'),
        usa: current.usa || (lang === 'ko' ? '미국' : 'USA'),
        asia: asiaLabel,
        other: current.other || (lang === 'ko' ? '기타' : lang === 'de' ? 'Andere' : 'Other')
      };
    }

    translations.en.filterRegions = orderedRegions('en', 'Asia');
    translations.de.filterRegions = orderedRegions('de', 'Asien');
    translations.ko.filterRegions = orderedRegions('ko', '아시아');

    translations.en.filterThemes.Methodology = 'Research & Methodology';
    translations.de.filterThemes.Methodology = 'Forschung & Methodik';
    translations.ko.filterThemes.Methodology = '연구 & 방법론';

    // Keep the Quest introduction count-agnostic so future roadmap additions do not make it stale.
    translations.en.questsDesc = "The strategic initiatives below form the long-term roadmap for my vision, 'RavenForge'. Their roots are connected to the philosophies and technologies of the luthiers I have studied, while the roadmap translates those lessons into testable directions for my own craft. Through this analytical and forward-looking approach, I aim to grow as a maker and contribute to the field of lutherie.";
    translations.de.questsDesc = "Die folgenden strategischen Initiativen bilden die langfristige Roadmap für meine Vision 'RavenForge'. Ihre Wurzeln liegen in den Philosophien und Technologien der Gitarrenbauer, die ich studiert habe; die Roadmap übersetzt diese Erkenntnisse zugleich in überprüfbare Richtungen für mein eigenes Handwerk. Durch diesen analytischen und vorausschauenden Ansatz möchte ich als Instrumentenbauer wachsen und zum Gitarrenbau beitragen.";
    translations.ko.questsDesc = "아래의 전략 과제들은 RavenForge를 위한 장기 로드맵입니다. 그 뿌리는 제가 연구해 온 제작가들의 철학과 기술에 닿아 있으며, 동시에 그 배움을 제 작업에서 검증 가능한 개발 방향으로 전환합니다. 이러한 분석적이고 미래지향적인 접근을 통해 제작자로서 성장하고 악기 제작의 세계에 기여하고자 합니다.";

    const entries = {
      en: {
        name: key,
        country: 'South Korea',
        region: 'asia',
        tags: ['Methodology', 'Wood', 'Structure', 'Customization', 'Aesthetics'],
        summary: "Moon Guitar treats handcraft not as an end in itself, but as a way to create an instrument that has a reason to exist. Chanho Moon's practice centers on controlled comparison, accumulated material data, and the pursuit of an individual sound and narrative that cannot simply be purchased from an existing brand.",
        details: `<p><strong>Chanho Moon's central position is that 'handmade' alone is not a sufficient value proposition.</strong> If a player merely wants the sound of an established brand, he argues that imitating it with a custom build has little meaning. A custom instrument should instead offer a sound, response and identity that are not already available off the shelf.</p><p>His working method is distinctly empirical. Moon has described building two instruments from the same wood under the same conditions while changing their internal mechanisms so the result could be compared and recorded as data. He continues to treat repeated builds as an accumulating research process rather than relying on intuition alone.</p><p>That attitude extends to wood selection. Even within the same species, origin, position within the tree, density, stiffness and elasticity can differ. For Moon, the maker therefore has to build a personal body of material data instead of assuming that a species name predicts a fixed tonal result.</p><p>Finally, he frames the custom guitar as an instrument with a <strong>theme and its own story</strong>. The aim is not mass-market consensus but a meaningful, singular voice — what he has described as a sound for the few who genuinely want it.</p><p><strong>RavenForge relevance:</strong> Moon Guitar provides a practical methodological foundation for RavenForge: isolate variables, compare prototypes, record material behavior, and let differentiation emerge from verified function and musical intent rather than ornament or specification count alone. This directly complements RavenForge's principle of <em>Form follows narrative</em>.</p><p class="text-sm text-slate-500 mt-4">Research basis: interviews with Chanho Moon published by the Kyongnam Shinmun (2017) and regional press coverage of his material-data approach (2026).</p>`
      },
      de: {
        name: key,
        country: 'Südkorea',
        region: 'asia',
        tags: ['Methodology', 'Wood', 'Structure', 'Customization', 'Aesthetics'],
        summary: "Bei Moon Guitar ist Handarbeit kein Selbstzweck, sondern ein Mittel, ein Instrument mit eigener Existenzberechtigung zu schaffen. Chanho Moons Arbeitsweise verbindet kontrollierte Vergleiche, angesammelte Materialdaten und die Suche nach einem individuellen Klang und einer Erzählung, die sich nicht einfach bei einer bestehenden Marke kaufen lassen.",
        details: `<p><strong>Für Chanho Moon ist „handgemacht“ allein noch kein ausreichender Wert.</strong> Wenn ein Spieler lediglich den Klang einer etablierten Marke sucht, sieht er wenig Sinn darin, diesen Klang durch einen Custom-Bau zu imitieren. Ein individuelles Instrument sollte vielmehr Klang, Ansprache und Identität bieten, die nicht bereits von der Stange erhältlich sind.</p><p>Seine Arbeitsweise ist deutlich empirisch geprägt. Moon beschrieb den parallelen Bau zweier Instrumente aus demselben Holz und unter denselben Bedingungen, wobei nur die innere Mechanik verändert wurde. So konnten die Ergebnisse direkt verglichen und als Daten festgehalten werden. Wiederholte Builds versteht er damit als fortlaufenden Forschungsprozess und nicht nur als Anwendung handwerklicher Intuition.</p><p>Diese Haltung gilt ebenso für Holz. Selbst innerhalb derselben Holzart unterscheiden sich Herkunft, Position im Stamm, Dichte, Steifigkeit und Elastizität. Der Instrumentenbauer muss deshalb eigene Materialdaten aufbauen, anstatt aus dem Namen einer Holzart automatisch einen festen Klang abzuleiten.</p><p>Schließlich versteht Moon die Custom-Gitarre als Instrument mit einem <strong>Thema und einer eigenen Geschichte</strong>. Ziel ist nicht der größtmögliche Marktkonsens, sondern eine sinnvolle, unverwechselbare Stimme für diejenigen, die genau diesen Klang suchen.</p><p><strong>Bedeutung für RavenForge:</strong> Moon Guitar liefert eine praktische methodische Grundlage: Variablen isolieren, Prototypen vergleichen, Materialverhalten dokumentieren und Differenzierung aus überprüfter Funktion und musikalischer Absicht entwickeln — nicht aus Dekoration oder bloßer Spezifikationsfülle. Das ergänzt unmittelbar das RavenForge-Prinzip <em>Form follows narrative</em>.</p><p class="text-sm text-slate-500 mt-4">Recherchegrundlage: Interviews mit Chanho Moon in der Kyongnam Shinmun (2017) sowie regionale Berichterstattung zu seinem materialbezogenen Datenansatz (2026).</p>`
      },
      ko: {
        name: key,
        country: '대한민국',
        region: 'asia',
        tags: ['Methodology', 'Wood', 'Structure', 'Customization', 'Aesthetics'],
        summary: '문기타의 제작 철학에서 핸드메이드는 그 자체가 목적이 아니다. 문찬호는 통제된 비교, 축적된 재료 데이터, 그리고 기존 브랜드에서 그대로 살 수 없는 개별적인 소리와 서사를 통해 커스텀 악기의 존재 이유를 만든다.',
        details: `<p><strong>문찬호의 핵심 관점에서 ‘손으로 만들었다’는 사실만으로는 커스텀 악기의 가치가 성립하지 않는다.</strong> 이미 존재하는 유명 브랜드의 소리를 원한다면 그것을 흉내 내기보다 해당 악기를 선택하는 편이 낫고, 커스텀 제작은 시중에서 찾을 수 없는 소리와 반응, 정체성을 제시해야 한다는 입장이다.</p><p>제작 방법론은 매우 경험적이다. 같은 목재와 같은 조건을 두고 내부 메커니즘만 다르게 한 두 대의 악기를 동시에 제작해 결과를 직접 비교하고, 이를 다음 제작을 위한 데이터로 축적해 왔다. 반복 제작을 단순한 숙련의 반복이 아니라 <strong>가설-비교-관찰-축적</strong>의 과정으로 다루는 셈이다.</p><p>목재 역시 수종의 이름만으로 고정된 음향 특성을 부여하지 않는다. 같은 수종이라도 산지, 나무의 상·하부 위치, 밀도, 강도, 탄성이 달라질 수 있으므로 제작자가 실제 결과를 통해 자신만의 재료 데이터를 축적해야 한다고 본다.</p><p>최종적으로 그가 지향하는 커스텀 기타는 <strong>주제와 고유한 이야기를 가진 악기</strong>다. 대중적으로 이미 합의된 소리를 복제하는 대신, 아직 시장에 없는 소리와 그것을 원하는 소수의 연주자를 위해 하나의 의미 있는 악기를 만드는 것이 목표다.</p><p><strong>RavenForge에서의 의미:</strong> 문기타에서 이어받을 핵심은 특정 형상이나 제작법의 모방이 아니라 제작을 검증 가능한 연구 과정으로 다루는 태도다. 변수를 분리하고, 프로토타입을 비교하고, 목재와 구조의 실제 거동을 기록하며, 장식이나 사양의 개수가 아니라 기능과 음악적 의도에서 차별화를 도출한다. 이는 RavenForge의 <em>Form follows narrative</em> 원칙과 직접 연결된다.</p><p class="text-sm text-slate-500 mt-4">연구 근거: 경남신문 문찬호 인터뷰(2017), 목재 개체별 데이터 축적에 관한 지역 언론 인터뷰(2026).</p>`
      }
    };

    Object.entries(entries).forEach(([lang, entry]) => {
      const list = translations[lang].luthierData || (translations[lang].luthierData = []);
      const index = list.findIndex(item => item.name === key);
      if (index >= 0) list[index] = entry;
      else list.push(entry);
    });

    // Sort the Explorer by localized country name, then by luthier name within each country.
    const locales = { en: 'en', de: 'de', ko: 'ko-KR' };
    ['en', 'de', 'ko'].forEach(lang => {
      const collator = new Intl.Collator(locales[lang], { sensitivity: 'base', numeric: true });
      const list = translations[lang].luthierData || [];
      list.sort((a, b) => {
        const countryOrder = collator.compare(a.country || '', b.country || '');
        return countryOrder !== 0 ? countryOrder : collator.compare(a.name || '', b.name || '');
      });
    });

    // Replace the older mentor copy with the same evidence-based philosophy used in Explorer.
    translations.en.mentor2Name = 'Chanho Moon (Moon Guitar)';
    translations.en.mentor2Desc = '<p>Chanho Moon of Moon Guitar is one of the luthiers under whom Raven studies instrument making in practice. His teaching emphasizes that handcraft is not valuable merely because it is done by hand: a custom instrument should have a reason to exist, a sound and response that are not simply copies of an established brand. His process combines material observation, controlled comparison and accumulated build data, treating lutherie as a long-term discipline of testing and refinement.</p>';

    translations.de.mentor2Name = 'Chanho Moon (Moon Guitar)';
    translations.de.mentor2Desc = '<p>Chanho Moon von Moon Guitar ist einer der Gitarrenbauer, bei denen Raven den Instrumentenbau praktisch erlernt. Seine Lehre betont, dass Handarbeit nicht allein deshalb wertvoll ist, weil sie von Hand ausgeführt wird: Ein Custom-Instrument braucht eine eigene Existenzberechtigung sowie Klang und Ansprache, die nicht bloß eine etablierte Marke kopieren. Sein Prozess verbindet Materialbeobachtung, kontrollierte Vergleiche und gesammelte Baudaten und versteht Gitarrenbau als langfristige Disziplin aus Testen und Verfeinern.</p>';

    translations.ko.mentor2Name = '문찬호 (Moon Guitar)';
    translations.ko.mentor2Desc = '<p>문기타 문찬호 사장님은 Raven이 실제 제작 현장에서 악기 제작을 배우고 있는 스승 중 한 명이다. 그의 가르침에서 핸드메이드는 단순히 손으로 만들었다는 사실 때문에 가치가 생기는 것이 아니다. 커스텀 악기는 기존 유명 브랜드의 복제품이 아니라 스스로 존재할 이유와 고유한 소리, 반응을 가져야 한다. 또한 목재의 개체차를 관찰하고, 조건을 통제한 비교 제작과 결과 기록을 반복하여 데이터를 축적하는 장기적인 검증 과정을 중요하게 여긴다.</p>';

    const questEntries = {
      en: {
        title: 'Empirical Craft & Iterative Prototyping',
        content: 'Treat instrument making as a cycle of hypothesis, controlled comparison, observation and accumulated data rather than craft intuition alone.',
        details: `<ul><li><strong>Use controlled comparisons:</strong> Build paired prototypes or test pieces while changing as few variables as possible, so structural and material choices can be evaluated instead of merely assumed.</li><li><strong>Build a material record:</strong> Track density, stiffness, elasticity, moisture condition, machining behavior and the resulting response of individual pieces rather than assigning fixed tonal claims to species names.</li><li><strong>Validate differentiation:</strong> New structures, woods and electronics should earn their place through measurable function and player feedback, not through novelty or specification count.</li><li><strong>Connect experiment to narrative:</strong> Once a design choice proves useful, integrate it into the musical purpose and story of the instrument so that form, material and sound point in the same direction.</li></ul>`,
        related: [key]
      },
      de: {
        title: 'Empirischer Instrumentenbau & iteratives Prototyping',
        content: 'Instrumentenbau wird als Kreislauf aus Hypothese, kontrolliertem Vergleich, Beobachtung und angesammelten Daten verstanden — nicht allein als handwerkliche Intuition.',
        details: `<ul><li><strong>Kontrollierte Vergleiche:</strong> Prototypen oder Teststücke paarweise bauen und möglichst wenige Variablen gleichzeitig verändern, damit Struktur- und Materialentscheidungen tatsächlich bewertet werden können.</li><li><strong>Materialdaten aufbauen:</strong> Dichte, Steifigkeit, Elastizität, Feuchtezustand, Bearbeitungsverhalten und resultierende Ansprache einzelner Stücke dokumentieren, statt Holzarten pauschal feste Klangeigenschaften zuzuschreiben.</li><li><strong>Differenzierung verifizieren:</strong> Neue Strukturen, Hölzer und Elektronik müssen ihren Platz durch nachvollziehbare Funktion und Spielerfeedback verdienen, nicht durch Neuheit oder eine möglichst lange Spezifikationsliste.</li><li><strong>Experiment und Narrativ verbinden:</strong> Bewährte Entscheidungen werden anschließend mit dem musikalischen Zweck und der Geschichte des Instruments verknüpft, sodass Form, Material und Klang in dieselbe Richtung weisen.</li></ul>`,
        related: [key]
      },
      ko: {
        title: '경험적 제작과 반복 프로토타이핑',
        content: '악기 제작을 장인의 직감만이 아니라 가설, 통제된 비교, 관찰, 데이터 축적이 반복되는 개발 사이클로 다룬다.',
        details: `<ul><li><strong>통제된 비교 제작:</strong> 가능한 한 한 번에 바꾸는 변수를 줄인 짝 프로토타입이나 테스트 피스를 제작해 구조와 재료 선택의 효과를 실제로 비교한다.</li><li><strong>개체별 재료 기록:</strong> 수종 이름에 고정된 음향 이미지를 부여하기보다 각 목재의 밀도, 강성, 탄성, 함수 상태, 가공 특성과 완성 후 반응을 기록한다.</li><li><strong>차별화의 검증:</strong> 새로운 구조·목재·전자계통은 새롭다는 이유나 사양 수를 늘리기 위해 채택하지 않고, 기능과 연주자 피드백을 통해 유효성을 확인한다.</li><li><strong>실험과 서사의 연결:</strong> 검증된 설계 선택은 다시 악기의 음악적 목적과 서사에 통합해 형태·재료·소리가 같은 방향을 가리키도록 한다.</li></ul>`,
        related: [key]
      }
    };

    Object.entries(questEntries).forEach(([lang, entry]) => {
      const list = translations[lang].proposalsData || (translations[lang].proposalsData = []);
      const existing = list.findIndex(item => item.title === entry.title);
      if (existing >= 0) list[existing] = entry;
      else list.unshift(entry);
    });
  }

  installMoonGuitarResearch();

  function render() {
    const lang = copy[root.lang] ? root.lang : 'en';
    document.querySelectorAll('[data-footer-key]').forEach(node => {
      const key = node.dataset.footerKey;
      if (copy[lang][key]) node.textContent = copy[lang][key];
    });
  }

  render();
  new MutationObserver(render).observe(root, { attributes: true, attributeFilter: ['lang'] });
})();