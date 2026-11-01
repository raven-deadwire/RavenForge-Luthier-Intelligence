// Targeted regression inputs, not model-generated answers or proof of live quality.
// The current page deliberately remains EDDA in the EMBLA cases: the standard
// electronics of the recommended model must not inherit the page's passive EQ.
const configuration = (model, specialOptions = []) => ({
  model, selections: {}, specialOptions, accessories: []
});

const questions = {
  xpure_power: {
    ko: '현재 EDDA에 Delano xPure 버퍼를 추가했습니다. 패시브 컨트롤이므로 배터리 없이 사용해도 되나요? 이 구성의 필요한 전원과 패시브 컨트롤의 의미를 설명해 주세요.',
    en: 'I added the Delano xPure buffer to this EDDA. Since its controls are passive, can I use this configuration without a battery? Explain its power requirement and what passive controls mean here.',
    de: 'Ich habe diesem EDDA den Delano xPure Buffer hinzugefügt. Kann ich diese Konfiguration ohne Batterie spielen, weil die Regler passiv sind? Erkläre die Stromversorgung und die Bedeutung der passiven Regler.'
  },
  edda_electronics: {
    ko: '현재 EDDA의 온보드 EQ 메뉴에서 실제로 고를 수 있는 제품을 알려주세요. John East Uni Pre 5와 John East ACG EQ-01은 같은 지원 옵션인가요? Glockenklang과 LHZ도 선택할 수 있나요?',
    en: 'List the products actually selectable in the Onboard EQ menu for this EDDA. Are John East Uni Pre 5 and John East ACG EQ-01 both supported options? Can I also select Glockenklang or LHZ?',
    de: 'Welche Produkte sind im Onboard-EQ-Menü dieses EDDA tatsächlich auswählbar? Sind John East Uni Pre 5 und John East ACG EQ-01 beide unterstützt? Kann ich auch Glockenklang oder LHZ wählen?'
  },
  embla_default: {
    ko: '현재 화면은 EDDA지만, 5현 34인치 싱글스케일 세션용 EMBLA를 추천해 주세요. 기본형과 에보니 지판 구성을 비교 견적하고 에보니를 마지막으로 계산해 주세요. EMBLA의 기본 전자회로와 필요한 전원도 설명해 주세요. 아직 적용하지 마세요.',
    en: 'The page currently shows EDDA, but I need a five-string 34-inch single-scale session bass. Recommend EMBLA with ebony and compare its price to standard. Price the ebony build last. Explain EMBLA\'s standard electronics and power requirement. Do not apply yet.',
    de: 'Die Seite zeigt derzeit EDDA, aber ich brauche einen fünfsaitigen Session-Bass mit 34 Zoll Single-Scale. Empfiehl EMBLA mit Ebenholz und vergleiche den Preis mit der Standardausführung. Berechne Ebenholz zuletzt. Erkläre die Standardelektronik und Stromversorgung von EMBLA. Noch nicht anwenden.'
  },
  gramr_fretboard: {
    ko: '현재 GRAMR의 기본 지판과 에보니 지판을 비교 견적해 주세요. 에보니가 거절되면 지판 메뉴의 others/exotic을 선택하면 되나요? 실제로 선택 가능한 지판과 별도 제작 문의를 구분해 주세요.',
    en: 'Compare the price of this standard GRAMR with an ebony fretboard. If ebony is rejected, can I select others/exotic in the Fretboard menu? Distinguish actually selectable fretboards from a separate question for the maker.',
    de: 'Vergleiche den Preis dieses Standard-GRAMR mit einem Ebenholzgriffbrett. Falls Ebenholz abgelehnt wird, kann ich others/exotic im Griffbrett-Menü auswählen? Unterscheide auswählbare Griffbretter von einer gesonderten Anfrage an den Hersteller.'
  }
};

export const SPECIFICATION_CASES = Object.entries(questions).flatMap(([family, translations]) =>
  Object.entries(translations).map(([language, question]) => ({
    id: `${language}-${family}`,
    family,
    language,
    kind: 'targeted_regression_input',
    request: {
      language,
      configuration: configuration(family === 'gramr_fretboard' ? 'GRAMR' : 'EDDA',
        family === 'xpure_power' ? ['delano_buffer'] : []),
      messages: [{ role: 'user', content: question }]
    },
    review_requirements: {
      xpure_power: [
        'xPure requires a 9V battery in the selected EDDA configuration.',
        'Passive control compatibility does not mean the buffer works without power.'
      ],
      edda_electronics: [
        'Available EQs are passive, Lusithand Double NFP MKII, John East ACG EQ-01 and Nova Dual Filter Custom.',
        'Uni Pre 5, Glockenklang and LHZ are unavailable for EDDA; do not ban the John East brand.'
      ],
      embla_default: [
        'Current EDDA/passive and recommended EMBLA/Zuta Bass Core are different configurations.',
        'EMBLA standard electronics is Zuta Bass Core with 9V; passive is not an EMBLA menu option.',
        'Standard and ebony prices come from the existing price tool; the ebony quote is last.'
      ],
      gramr_fretboard: [
        'GRAMR currently offers only its Indian rosewood fretboard.',
        'Ebony and others/exotic are unavailable in that menu; a separate enquiry does not create an option or price.',
        'A rejected request preserves the rosewood selection and existing computed price.'
      ]
    }[family]
  })));

// These checks identify narrowly scoped warning signs and missing answer elements.
// They are an audit aid, not a semantic validator and never certify an answer.
// In particular, a denied option may be named correctly; names are not banned.
export function evaluateSpecificationReply(family, language, reply) {
  const text = typeof reply === 'string' ? reply : '';
  const clauses = text.split(/[\n.!?。；;]/).map(part => part.trim()).filter(Boolean);
  const findings = [];
  const requireMention = (pattern, code, description) => {
    if (!pattern.test(text)) findings.push({ code, description });
  };
  if (!text.trim()) findings.push({ code: 'empty_reply', description: 'No answer text was returned.' });

  if (family === 'xpure_power') {
    requireMention(/x\s*pure/i, 'xpure_not_identified', 'The answer must identify the xPure buffer.');
    requireMention(/\b9\s*V\b/i, 'xpure_9v_not_stated', 'No explicit 9V requirement was found.');
    // A 9V token alone must not hide an explicit contradictory assertion. Keep
    // the patterns narrow enough to allow "cannot run without a battery" and
    // its KO/DE equivalents; they do not resolve arbitrary quoted speech.
    const batteryFreeAssertion = clauses.some(part => {
      if (!/x\s*pure|buffer|버퍼/i.test(part)) return false;
      if (/claim.{0,60}(?:false|incorrect)|not true|뜻(?:은|이)?\s*아니|잘못된|falsch|unzutreffend/i.test(part)) return false;
      return /\b(?:is|remains|works|operates)\s+(?:completely\s+)?battery[ -]?free\b|\b(?:needs?|requires?)\s+no\s+battery\b|\b(?:does not|doesn['’]t)\s+(?:need|require)\s+(?:a\s+)?battery\b|\bcan\s+(?:also\s+)?(?:run|work|operate|play|be used)\s+without\s+(?:a\s+)?battery\b/i.test(part) ||
        /배터리\s*(?:없이|없어도).{0,35}(?:사용|작동|연주).{0,12}(?:수\s*있|이?\s*가능|됩니다)|배터리(?:가|는)?\s*(?:필요\s*없|필요하지\s*않|불필요)|배터리\s*없는\s*패시브\s*특성.{0,10}유지/i.test(part) ||
        /\b(?:benötigt|braucht)\s+keine\s+Batterie\b|\bist\s+(?:vollständig\s+)?batterie(?:los|frei)\b|\bkann\s+(?:auch\s+|aber\s+)?ohne\s+(?:eine\s+)?Batterie\b|\b(?:läuft|arbeitet|funktioniert)\s+ohne\s+(?:eine\s+)?Batterie\b/i.test(part);
    });
    if (batteryFreeAssertion) findings.push({ code: 'xpure_battery_free_assertion',
      description: 'An explicit battery-free assertion contradicts the xPure power requirement, even if 9V is mentioned.' });
  } else if (family === 'edda_electronics') {
    requireMention(/ACG\s+EQ[\s‐‑–—-]?01/i, 'edda_eq01_not_distinguished',
      'The supported John East ACG EQ-01 must be distinguished from Uni Pre 5.');
    requireMention(/Uni\s*Pre\s*5/i, 'edda_uni_pre_not_addressed',
      'The requested Uni Pre 5 availability question was not explicitly addressed.');
    const unavailableProduct = /Uni\s*Pre\s*5|Glockenklang|\bLHZ\b/i;
    const denial = /\b(?:not|no|unavailable|unsupported|cannot|neither|nicht|kein\w*|weder)\b|can['’]t|isn['’]t|aren['’]t|없|불가|미지원|않|아니/i;
    const affirmation = /\b(?:available|supported|selectable)\b|\bcan\s+(?:also\s+)?(?:select|choose|use)\b|\b(?:verfügbar|auswählbar|unterstützt)\b|선택(?:할)?\s*수\s*있|선택(?:이)?\s*가능|지원(?:합니다|됩니다|되는|하는)|고를\s*수\s*있/i;
    if (clauses.some(part => unavailableProduct.test(part) && affirmation.test(part) && !denial.test(part) &&
      // A correct comparison may say that Glockenklang is offered on ASKR.
      (!/\b(?:ASKR|EMBLA|GRAMR)\b/i.test(part) || /\bEDDA\b/i.test(part)))) {
      findings.push({ code: 'edda_unsupported_available_assertion',
        description: 'An affirmative-looking availability statement offers Uni Pre 5, Glockenklang or LHZ for EDDA.' });
    }
  } else if (family === 'embla_default') {
    requireMention(/Zuta\s+Bass\s+Core/i, 'embla_zuta_not_stated', 'The standard EMBLA electronics must be identified.');
    requireMention(/\b9\s*V\b/i, 'embla_9v_not_stated', 'No explicit EMBLA 9V supply was found.');
    const denial = /\b(?:not|no|cannot|nicht|kein\w*|weder)\b|isn['’]t|aren['’]t|없|불가|않|아니/i;
    if (clauses.some(part => /passive\s+electronics\s*\(\s*standard\s*\)/i.test(part) && !denial.test(part))) {
      findings.push({ code: 'embla_legacy_passive_standard', description: 'The recorded passive electronics (standard) claim reappeared.' });
    }
    const passiveStandard = clauses.some(part => !denial.test(part) && (
      /\bEMBLA\b.{0,55}(?:standard|default).{0,35}\b(?:is|are|has|uses)\s+(?:a\s+)?passive\b|\b(?:standard|default)\s+(?:electronics|circuit)\s+(?:of|for)\s+EMBLA\b.{0,20}\b(?:is|are)\s+passive\b/i.test(part) ||
      /EMBLA.{0,35}(?:기본|표준).{0,35}패시브(?:입니다|이며|이고|다|를)/i.test(part) ||
      /\bEMBLA\b.{0,55}(?:standardmäßig|serienmäßig|ab Werk|Standardelektronik).{0,35}\bpassiv\w*\b|\bStandardelektronik\s+(?:des|von)\s+EMBLA\b.{0,25}\bpassiv\w*\b/i.test(part)
    ));
    if (passiveStandard) findings.push({ code: 'embla_passive_standard_assertion',
      description: 'A narrowly matched KO/EN/DE assertion calls passive electronics standard on EMBLA.' });
  } else if (family === 'gramr_fretboard') {
    requireMention(/rosewood|로즈우드|Palisander/i, 'gramr_rosewood_not_stated',
      'The remaining selectable rosewood fretboard must be identified.');
    // Review only affirmative-looking navigation instructions. A sentence such
    // as "There is no exotic option in the Fretboard menu" is allowed.
    const denies = /not\b|no\b|unavailable|cannot|can['’]t|doesn['’]t|nicht|kein|weder|없|불가|아니|못|않/i;
    const exotic = /\bothers?\b|exotic|exotisch|이그조틱|기타\s*목재/i;
    const menu = /menu|category|dropdown|via the Fretboard|Menü|Kategorie|드롭다운|메뉴|카테고리/i;
    const navigate = /select|choose|via|wähl|auswähl|선택|고르/i;
    if (clauses.some(part => exotic.test(part) && menu.test(part) && navigate.test(part) && !denies.test(part))) {
      findings.push({ code: 'gramr_exotic_navigation', description: 'An affirmative-looking instruction navigates to an unsupported exotic fretboard menu.' });
    }
  } else {
    findings.push({ code: 'unknown_case_family', description: `Unknown case family: ${family}` });
  }
  return {
    language,
    automatic_status: findings.length ? 'findings_require_review' : 'no_targeted_findings',
    findings,
    manual_review_required: true,
    scope: 'Targeted text checks only; availability, negation, scope and all other prose require human review.'
  };
}
