(function (root, factory) {
  const geometry = typeof module === 'object' && module.exports ? require('./configurator-geometry.js') : root.RavenForgeGeometry;
  const drawingRenderer = typeof module === 'object' && module.exports ? require('./configurator-drawing-renderer.js') : root.RavenForgeDrawingRenderer;
  const rearRenderer = typeof module === 'object' && module.exports ? require('./configurator-rear-renderer.js') : root.RavenForgeRearRenderer;
  const options = typeof module === 'object' && module.exports ? require('./configurator-option-renderer.js') : root.RavenForgeOptionRenderer;
  const parts = typeof module === 'object' && module.exports ? require('./configurator-parts-renderer.js') : root.RavenForgeParts;
  const api = factory(geometry, drawingRenderer, rearRenderer, options, parts);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgePreview = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (geometry, drawingRenderer, rearRenderer, options, parts) {
  'use strict';
  // Standalone review builds embed the exact source bytes, independent of paths.
  const media = path => globalThis.RavenForgePreviewMedia?.[path] || path;
  const copy = {
    en: {
      title: 'Your instrument', live: 'Live finish preview', full: 'Full', body: 'Body', neck: 'Fretboard', head: 'Headstock',
      note: 'RavenForge sample render · part shapes and layout can differ from the selected specification.',
      scope: 'What is shown', tone: 'The sample silhouette is retained. Wood grain and continuous surface lighting are rendered independently of the controls; texture is illustrative, not a stock-board photograph.',
      symbols: 'Pickup, bridge and tuner shapes remain those of the sample. Selected brands are recorded below and in the quote; exact part geometry is not replaced. The sample saddle/tuner count can differ from the configured string count.',
      pending: 'Not visualized', covered: 'Covered by the top / opaque finish', reference: 'Original concept',
      colour: 'Preview colour', natural: 'Natural', transparent: 'Transparent', solid: 'Opaque',
      colourHelp: 'One preview colour applies to both body sides and the matching headstock. Use a swatch, #RRGGBB, or a simple colour name. Multi-part finish instructions remain in the quote only.',
      textOnly: 'This colour description is in the quote only. No colour has been inferred.',
      oil: 'A colour is specified with natural oil. Confirm the finish method before production.',
      headPending: 'Headstock plate artwork is not available.',
      geometry: 'Final geometry / exact parts require approved drawings.',
      updated: 'Preview updated', material: 'Material colour', schematic: 'Sample part retained', hidden: 'Not visible from the front',
      noShape: 'No verified outline is available for this model.', sampleGrain: 'Sample grain retained', referenceParts: 'Sample parts retained', sourceView: 'Sample render', drawingView:'Source drawing', drawingNote:'Front contours and positions follow the supplied drawing. Material and part surfaces are illustrative.', drawingParts:'Drawing geometry · illustrative surfaces', selectedView: 'Selected finish', drawingReferenceNote:'Source drawing; selected finishes are not applied.', referenceNote: 'Original sample only. It does not represent the selected options.', colourNames: ['Natural', 'Red', 'Blue', 'Black', 'White', 'Green']
    },
    ko: {
      title: '선택한 악기', live: '실시간 마감 미리보기', full: '전체', body: '바디', neck: '지판', head: '헤드스톡',
      note: '샘플 렌더링 기반 · 부품 형상·배치는 선택 사양과 다를 수 있습니다.',
      scope: '시각화 범위', tone: '샘플의 나뭇결과 반사를 유지합니다. 목재 선택은 색조를 바꾸며 수종별 무늬나 실제 제작 목재를 재현하지는 않습니다.',
      symbols: '픽업·브리지·튜너 형상은 샘플을 유지합니다. 선택한 제조사와 모델은 아래 목록과 견적에 반영되며 부품 형상을 교체하지 않습니다. 샘플의 새들·튜너 수는 선택 사양과 다를 수 있습니다.',
      pending: '미표현', covered: '탑 또는 불투명 마감에 가려짐', reference: '원본 컨셉 보기',
      colour: '미리보기 색상', natural: '내추럴', transparent: '투명', solid: '불투명',
      colourHelp: '한 가지 미리보기 색상을 바디 앞뒷면과 매칭 헤드스톡에 적용합니다. 색상표·#RRGGBB·단일 색상명을 사용할 수 있습니다. 부위별 복합 마감 요청은 견적에만 기록됩니다.',
      textOnly: '이 색상 설명은 견적에만 기록됩니다. 색상을 임의로 해석하지 않았습니다.',
      oil: '내추럴 오일과 색상이 함께 지정되었습니다. 제작 전 마감 방식을 확인해야 합니다.',
      headPending: '헤드스톡 플레이트 도안이 없어 표현하지 않습니다.',
      geometry: '최종 형상·부품 세부는 승인 도면 확인이 필요합니다.',
      updated: '미리보기 갱신', material: '소재 색조', schematic: '샘플 부품 유지', hidden: '정면에서 보이지 않음',
      noShape: '이 모델은 확인된 외곽 자료가 없습니다.', sampleGrain: '샘플 나뭇결 유지', referenceParts: '샘플 부품 유지', sourceView: '샘플 원본', drawingView:'기준 도면', drawingNote:'첨부 도면의 정면 외곽·배치를 적용했습니다. 재질과 부품 표면은 참고 표현입니다.', drawingParts:'도면 외곽 · 재질·부품 표면은 참고', selectedView: '선택한 마감', drawingReferenceNote:'기준 도면입니다. 현재 마감 옵션은 반영하지 않습니다.', referenceNote: '원본 샘플입니다. 현재 선택 옵션을 반영하지 않습니다.', colourNames: ['내추럴', '레드', '블루', '블랙', '화이트', '그린']
    },
    de: {
      title: 'Ihr Instrument', live: 'Live-Finish-Vorschau', full: 'Gesamt', body: 'Korpus', neck: 'Griffbrett', head: 'Kopfplatte',
      note: 'RavenForge-Musterrendering · Teile und Anordnung können von der gewählten Spezifikation abweichen.',
      scope: 'Umfang der Vorschau', tone: 'Maserung und Reflexionen des Musters bleiben erhalten. Die Holzwahl ändert den ungefähren Farbton, nicht die Holzart der Maserung oder das tatsächliche Brett.',
      symbols: 'Formen von Pickups, Brücke und Mechaniken bleiben aus dem Muster erhalten. Gewählte Modelle stehen unten und im Angebot; genaue Bauteile werden nicht ausgetauscht. Sattel- und Mechanikanzahl des Musters können von der konfigurierten Saitenzahl abweichen.',
      pending: 'Nicht dargestellt', covered: 'Von Decke / deckendem Finish verdeckt', reference: 'Originalkonzept',
      colour: 'Vorschaufarbe', natural: 'Natur', transparent: 'Transparent', solid: 'Deckend',
      colourHelp: 'Eine Vorschaufarbe gilt für beide Korpusseiten und die passende Kopfplatte. Farbfeld, #RRGGBB oder einfachen Farbnamen verwenden. Mehrteilige Finish-Wünsche stehen nur im Angebot.',
      textOnly: 'Diese Farbbeschreibung steht nur im Angebot. Es wurde keine Farbe abgeleitet.',
      oil: 'Farbe und Naturöl sind zusammen gewählt. Finish vor der Fertigung abstimmen.',
      headPending: 'Für die Kopfplattenplakette liegt keine Vorlage vor.',
      geometry: 'Endgültige Geometrie / genaue Teile benötigen freigegebene Zeichnungen.',
      updated: 'Vorschau aktualisiert', material: 'Materialfarbe', schematic: 'Musterteil beibehalten', hidden: 'Von vorn nicht sichtbar',
      noShape: 'Für dieses Modell liegt keine geprüfte Kontur vor.', sampleGrain: 'Mustermaserung beibehalten', referenceParts: 'Musterteile beibehalten', sourceView: 'Musterrendering', drawingView:'Referenzzeichnung', drawingNote:'Frontkonturen und Positionen folgen der vorgelegten Zeichnung. Material- und Bauteiloberflächen sind illustrativ.', drawingParts:'Zeichnungsgeometrie · illustrative Oberflächen', selectedView: 'Gewähltes Finish', drawingReferenceNote:'Referenzzeichnung; gewählte Finishes werden nicht angewendet.', referenceNote: 'Originalmuster. Die gewählten Optionen sind hier nicht dargestellt.', colourNames: ['Natur', 'Rot', 'Blau', 'Schwarz', 'Weiß', 'Grün']
    }
  };
  const viewCopy = {
    en: {front:'Front',back:'Back',backMissing:'Rear image not registered',backMissingNote:'A verified rear image or drawing is needed for this model. Your options remain in the quote.',backNote:'Bolt-on neck: five screws in the confirmed 2-2-1 arrangement, without a plate. The hatched joint and screw symbols are a construction schematic, not approved machining positions or heel geometry.',backParts:'Bolt-on · 5 screws / 2-2-1 · schematic joint',backReferenceNote:'Source rear outline with an amber five-bolt 2-2-1 schematic added. The screw symbols are not source drill coordinates. No neck plate.',backFinishNote:'The preview colour applies to both body sides. With no colour selected, the back follows the body wood; the front top is not applied to the back. Neck finish is separate.',bindruneTitle:'Bindrune layout examples',bindruneNote:'Existing RavenForge v5.0 designs · examples only. The final artwork and placement are agreed separately; these are not applied automatically to the instrument.',bindruneNames:['Compact centre','Extended centre','Three sections','Full-length composition'],ovalTitle:'RavenForge Oval',ovalNote:'Design study · a tapered oval with a feather-like split. Material colours are illustrative.',bindruneOriginal:'Original layout sheet',bindruneSource:'Design guide v5.0 · 9 Sep 2026 · page 1'},
    ko: {front:'앞면',back:'뒷면',backMissing:'뒷면 이미지 미등록',backMissingNote:'이 모델의 뒷면 이미지 또는 확인된 도면이 필요합니다. 선택한 옵션은 견적에 유지됩니다.',backNote:'볼트온 넥: 플레이트 없는 5볼트 2-2-1 배열입니다. 빗금 영역과 볼트 기호는 구조 설명용이며, 승인된 가공 좌표나 힐 형상이 아닙니다.',backParts:'볼트온 · 5볼트 / 2-2-1 · 접합부 구조도',backReferenceNote:'도면의 뒷면 외곽에 황색 5볼트 2-2-1 구조 기호를 덧붙였습니다. 기호는 도면의 실제 가공 좌표가 아닙니다. 플레이트는 없습니다.',backFinishNote:'미리보기 색상을 바디 앞뒷면에 함께 적용합니다. 색상 미지정 시 뒷면은 바디 목재를 따르며, 앞면 탑은 적용하지 않습니다. 넥 마감은 별도 선택입니다.',bindruneTitle:'바인드룬 배치 예시',bindruneNote:'기존 RavenForge v5.0 설계도 예시입니다. 최종 문양과 배치는 별도로 협의하며, 악기 이미지에 자동 적용하지 않습니다.',bindruneNames:['압축 중심형','확장 중심형','세 구획형','전체 문장형'],ovalTitle:'RavenForge Oval',ovalNote:'디자인 시안 · 끝을 좁힌 타원에 깃털 형태의 분할을 더했습니다. 재질 색조는 참고 표현입니다.',bindruneOriginal:'설계 가이드 예시 원본',bindruneSource:'설계 가이드 v5.0 · 2026.09.09 · 1쪽'},
    de: {front:'Vorderseite',back:'Rückseite',backMissing:'Rückseitenbild noch nicht hinterlegt',backMissingNote:'Für dieses Modell wird eine geprüfte Rückansicht benötigt. Ihre Optionen bleiben im Angebot erhalten.',backNote:'Geschraubter Hals: fünf Schrauben in bestätigter 2-2-1-Anordnung, ohne Halsplatte. Schraffur und Schraubensymbole erklären die Konstruktion; Bohrpositionen und Halsfuß sind nicht maßlich freigegeben.',backParts:'Geschraubter Hals · 5 Schrauben / 2-2-1 · Schema',backReferenceNote:'Rückenkontur der Vorlage mit ergänztem ockerfarbenem Fünfschrauben-Schema (2-2-1). Die Symbole sind keine Bohrkoordinaten aus der Zeichnung. Ohne Halsplatte.',backFinishNote:'Die Vorschaufarbe gilt für beide Korpusseiten. Ohne Farbe bleibt das Korpusholz sichtbar; die Decke wird nicht auf die Rückseite übertragen. Halsfinish separat.',bindruneTitle:'Bindrune-Beispiele',bindruneNote:'Vorhandene RavenForge-Entwürfe v5.0 · nur Beispiele. Endgültiges Motiv und Platzierung werden separat vereinbart und nicht automatisch auf das Instrument übertragen.',bindruneNames:['Kompakte Mitte','Erweiterte Mitte','Drei Abschnitte','Ganzes Griffbrett'],ovalTitle:'RavenForge Oval',ovalNote:'Designentwurf · eine zugespitzte Ovalform mit federartiger Teilung. Materialfarben sind illustrativ.',bindruneOriginal:'Originale Beispieltafel',bindruneSource:'Entwurfshandbuch v5.0 · 9. Sept. 2026 · Seite 1'}
  };
  for (const language of Object.keys(copy)) Object.assign(copy[language],viewCopy[language]);
  Object.assign(copy.en,{imageLoading:'Loading original image…',imageError:'Image could not be loaded',imageErrorNote:'Open the bundled standalone HTML to use the included original images.'});
  Object.assign(copy.ko,{imageLoading:'원본 이미지 불러오는 중…',imageError:'이미지를 불러오지 못했습니다',imageErrorNote:'동봉된 단일 HTML 파일을 열면 내장 원본 이미지를 사용할 수 있습니다.'});
  Object.assign(copy.de,{imageLoading:'Originalbild wird geladen…',imageError:'Bild konnte nicht geladen werden',imageErrorNote:'Die beiliegende eigenständige HTML-Datei enthält die Originalbilder.'});
  Object.assign(copy.en,{rearConcept:'Rear concept',rearConceptParts:'EDDA rear concept · bolt-on',rearConceptNote:'AI concept based on the existing front sample. Bolt positions, heel and cavity are illustrative; this is not an approved rear drawing.',boltOn:'Bolt-on neck',bassRearParts:'Bolt-on neck · 5 screws · supplied drawing',bassRearNote:'Rear outline, five bolt centres, control cover and battery position follow the supplied prototype drawing. Material, laminate widths and part surfaces are illustrative.',bassRearReference:'Rear drawing geometry. Ghosted front components and construction annotations are omitted.'});
  Object.assign(copy.ko,{rearConcept:'뒷면 시안',rearConceptParts:'EDDA 뒷면 시안 · 볼트온',rearConceptNote:'기존 앞면 샘플을 참고한 AI 시안입니다. 볼트 위치·힐·캐비티는 참고 배치이며 승인된 뒷면 도면이 아닙니다.',boltOn:'볼트온 넥',bassRearParts:'볼트온 넥 · 5볼트 체결 · 첨부 도면 기준',bassRearNote:'첨부 프로토타입 도면의 뒷면 외곽·볼트 5개 중심·컨트롤 커버·배터리 위치를 적용했습니다. 재질·라미네이트 폭·부품 표면은 참고 표현입니다.',bassRearReference:'뒷면 도면의 표시 형상입니다. 겹쳐 표시된 앞면 부품과 가공 주석은 제외했습니다.'});
  Object.assign(copy.de,{rearConcept:'Rückseitenentwurf',rearConceptParts:'EDDA-Rückseitenentwurf · geschraubter Hals',rearConceptNote:'KI-Entwurf anhand der vorhandenen Vorderansicht. Schraubenpositionen, Halsfuß und Fach sind illustrativ; keine freigegebene Rückseitenzeichnung.',boltOn:'Geschraubter Hals',bassRearParts:'Geschraubter Hals · 5 Schrauben · vorgelegte Zeichnung',bassRearNote:'Kontur, fünf Schraubenmittelpunkte, Elektronikdeckel und Batteriefach folgen der vorgelegten Prototypzeichnung. Material, Laminatbreiten und Bauteiloberflächen sind illustrativ.',bassRearReference:'Geometrie der Rückseitenzeichnung. Überlagerte Vorderseitenbauteile und Fertigungsanmerkungen sind ausgelassen.'});
  Object.assign(copy.ko,{"live":"실시간 옵션 미리보기","selectedView":"선택 옵션","tone":"수종별 참고 텍스처를 적용합니다. AI로 제작한 무늬 예시이며 실제 제작 목재의 무늬·색차·북매칭을 확정하지 않습니다.","sampleGrain":"수종별 참고 무늬","note":"기존 악기 외곽에 선택한 목재·마감·지판 세부를 합성한 참고 이미지입니다.","bindruneNote":"C1~C4 예시를 누르면 선택한 문양을 지판에 미리 적용합니다. 설계 가이드의 예시 배치이며 최종 문양·치수는 별도 확정합니다.","textureStatus":"참고 텍스처 반영","detailStatus":"이미지에 반영 · 세부 치수는 참고","fixedBridge":"ASKR 멀티스케일 브리지 마감은 고정입니다. 하드웨어 색상은 브리지를 제외한 부품에 적용됩니다.","fixedStatus":"브리지 고정 마감","runeApplied":"적용된 바인드룬 예시","rearOnly":"뒷면에서 확인","frontOnly":"앞면에서 확인","symbols":"픽업·브리지·튜너의 제조사별 형상은 기존 자료를 유지합니다. 3픽업·램프·맞춤 부품은 배치 도면이 필요합니다.","shapePending":"형상·배치 자료 필요"});
  Object.assign(copy.en,{"live":"Live option preview","selectedView":"Selected options","tone":"Species-specific illustrative textures are applied. AI-created grain examples do not define the actual stock board, colour variation or bookmatching.","sampleGrain":"Illustrative wood texture","note":"Selected wood, finish and fretboard details are composited onto the existing instrument outline.","bindruneNote":"Click C1–C4 to preview its artwork on the fretboard. These guide layouts are examples; final artwork and dimensions are agreed separately.","textureStatus":"Illustrative texture applied","detailStatus":"Shown · dimensions illustrative","fixedBridge":"ASKR multiscale bridge finish is fixed. Hardware colour applies to the other parts.","fixedStatus":"Fixed bridge finish","runeApplied":"Bindrune example applied","rearOnly":"Shown on the back","frontOnly":"Shown on the front","symbols":"Manufacturer-specific pickup, bridge and tuner shapes retain the existing references. Three-pickup layouts, ramps and custom parts need approved placement drawings.","shapePending":"Shape / placement pending"});
  Object.assign(copy.de,{"live":"Live-Optionsvorschau","selectedView":"Gewählte Optionen","tone":"Holzspezifische Beispieltexturen werden angewendet. KI-erstellte Maserungen legen das reale Holzstück, Farbabweichungen oder die Spiegelung nicht fest.","sampleGrain":"Illustrative Holztextur","note":"Gewähltes Holz, Finish und Griffbrettdetails werden auf die vorhandene Instrumentenkontur übertragen.","bindruneNote":"C1–C4 anklicken, um das Motiv auf dem Griffbrett zu sehen. Die Vorlagen sind Beispiele; endgültiges Motiv und Maße werden separat vereinbart.","textureStatus":"Beispieltextur angewendet","detailStatus":"Dargestellt · Maße illustrativ","fixedBridge":"Das Finish der ASKR-Multiscale-Brücke bleibt fest. Die Hardwarefarbe gilt für die übrigen Teile.","fixedStatus":"Festes Brückenfinish","runeApplied":"Angewendetes Bindrune-Beispiel","rearOnly":"Auf der Rückseite sichtbar","frontOnly":"Auf der Vorderseite sichtbar","symbols":"Herstellerspezifische Formen von Pickups, Brücke und Mechaniken bleiben aus der Vorlage. Drei-Pickup-Anordnungen, Rampen und Sonderteile benötigen freigegebene Positionszeichnungen.","shapePending":"Form / Position ausstehend"});
  Object.assign(copy.ko,{"symbols": "픽업·브리지·헤드머신은 샘플·도면의 형상을 유지합니다. 선택 부품의 실제 외형은 아직 반영되지 않습니다. 샘플의 튜너·새들 수는 주문 사양과 다를 수 있습니다.", "partsNote": "픽업·브리지·헤드머신: 샘플 형상 유지 · 선택 부품 형상 미반영.", "guardTitle": "픽가드 · 테스트 표시", "guardNote": "GRAMR 도면의 외곽을 사용합니다. 시각 비교용 선택이며 견적·주문 사양에는 포함되지 않습니다.", "guardNames": ["없음", "블랙", "아이보리", "매칭 목재"], "assembly": "선택 부품 · 형상 미반영", "construction": "바디 / 넥 피스", "constructionNote": "피스 이음은 목재가 보이는 면에 표시합니다. 매칭 탑·별도 탑·불투명 도장 아래의 이음과 내부 챔버는 보이지 않습니다.", "controlNote": "노브는 그대로 유지합니다. 추가 스위치의 점선 테두리는 임시 배치이며 실제 장착 위치는 미확정입니다. 견적의 기존 컨트롤 위치 조건은 그대로이므로 제작 배치는 별도 확인이 필요합니다.", "kill": "킬스위치", "dual": "듀얼톤 · 푸시풀", "buffer": "버퍼 · 내부 부품", "coil": "코일 스위치", "hiddenInternal": "내부 기능 · 외관 변화 없음", "proposalStatus": "외형·배치 예시", "pickguard": "픽가드", "controlVisibleNote": "점선 스위치: 임시 배치 · 기존 노브 유지", "shapePending": "선택 형상·배치 미반영", "guardUnavailable": "픽가드: 확인된 외곽 도면이 없어 표시하지 않습니다.", "eddaGuardNote": "EDDA는 픽가드를 선택할 수 있습니다. 원본 샘플의 픽가드 외곽을 참고했으며 가공 도면은 아닙니다. 테스트 표시만 바뀌며 견적·주문 사양에는 포함되지 않습니다.", "laminateNote": "넥 라미네이트는 구성 목재의 참고 텍스처를 적용합니다. 베이스의 배열과 각 피스 폭은 예시이며 뒷면에서 확인할 수 있습니다.", "neckAccentTitle": "라미네이트 추가 수종 · 테스트 표시", "neckAccentNames": ["월넛", "블러드우드"], "neckAccentNote": "9·13피스 사양의 두 수종 대안을 비교합니다. 이 표시는 견적에 저장되지 않으며 최종 수종·배열은 별도 확정합니다."});
  Object.assign(copy.en,{"symbols": "Pickups, bridge and tuners retain the sample/drawing geometry. The selected product shapes are not yet rendered. Sample tuner/saddle counts can differ from the order specification.", "partsNote": "Pickups, bridge and tuners: source shapes retained; selected product shapes not rendered.", "guardTitle": "Pickguard · test display", "guardNote": "Uses the GRAMR drawing contour. For visual comparison only; excluded from the quote and order specifications.", "guardNames": ["None", "Black", "Ivory", "Matching wood"], "assembly": "Selected parts · shapes not rendered", "construction": "Body / neck pieces", "constructionNote": "Joins appear on exposed wood. Matching/separate tops, opaque finishes and internal chambers conceal the underlying construction.", "controlNote": "Existing knobs are retained. Dashed outlines mark additional switches at unconfirmed preview positions. The quote still specifies existing control positions, so the production layout needs separate confirmation.", "kill": "Kill switch", "dual": "Dual tone · push-pull", "buffer": "Buffer · internal component", "coil": "Coil switch", "hiddenInternal": "Internal function · no exterior change", "proposalStatus": "Shape / placement example", "pickguard": "Pickguard", "controlVisibleNote": "Dashed switches: proposed positions · knobs retained", "shapePending": "Selected shape / layout not rendered", "guardUnavailable": "Pickguard not shown: no confirmed outline is available.", "eddaGuardNote": "EDDA supports an optional pickguard. The contour follows the original sample and is not a machining drawing. This test display choice is excluded from the quote and order specifications.", "laminateNote": "Neck laminates use illustrative textures for their specified species. Bass strip order and widths are examples, visible on the back.", "neckAccentTitle": "Laminate accent wood · test display", "neckAccentNames": ["Walnut", "Bloodwood"], "neckAccentNote": "Compare the two alternatives in the 9/13-piece specification. This display choice is not saved in the quote; final species/order are agreed separately."});
  Object.assign(copy.de,{"symbols": "Pickups, Brücke und Mechaniken behalten die Muster-/Zeichnungsformen. Die Formen der gewählten Produkte werden noch nicht dargestellt. Mechanik- und Sattelanzahl der Vorlage können vom Auftrag abweichen.", "partsNote": "Pickups, Brücke und Mechaniken: Vorlagenformen bleiben; gewählte Produktformen nicht dargestellt.", "guardTitle": "Schlagbrett · Testanzeige", "guardNote": "Nutzt die GRAMR-Zeichnungskontur. Nur zum optischen Vergleich; nicht Teil des Angebots oder der Bestellspezifikation.", "guardNames": ["Ohne", "Schwarz", "Elfenbein", "Passendes Holz"], "assembly": "Gewählte Teile · Formen nicht dargestellt", "construction": "Korpus- / Halsteile", "constructionNote": "Fugen erscheinen auf sichtbarem Holz. Passende/separate Decken, deckende Lacke und interne Kammern verdecken die darunterliegende Konstruktion.", "controlNote": "Vorhandene Regler bleiben erhalten. Gestrichelte Umrisse markieren zusätzliche Schalter an unbestätigten Vorschaupositionen. Das Angebot nennt weiterhin vorhandene Reglerpositionen; die Fertigungsanordnung muss separat geklärt werden.", "kill": "Killschalter", "dual": "Dual Tone · Push-Pull", "buffer": "Buffer · internes Bauteil", "coil": "Spulenschalter", "hiddenInternal": "Interne Funktion · außen unverändert", "proposalStatus": "Form- / Positionsbeispiel", "pickguard": "Schlagbrett", "controlVisibleNote": "Gestrichelte Schalter: Positionsvorschlag · Regler bleiben", "shapePending": "Gewählte Form / Anordnung nicht dargestellt", "guardUnavailable": "Schlagbrett nicht dargestellt: keine bestätigte Kontur vorhanden.", "eddaGuardNote": "EDDA kann optional ein Schlagbrett erhalten. Die Kontur folgt dem Originalmuster und ist keine Fertigungszeichnung. Diese Testanzeige ist nicht Teil des Angebots oder der Bestellspezifikation.", "laminateNote": "Halslaminate zeigen Beispieltexturen der angegebenen Holzarten. Reihenfolge und Breiten der Bassstreifen sind Beispiele, auf der Rückseite sichtbar.", "neckAccentTitle": "Zusätzliches Laminatholz · Testanzeige", "neckAccentNames": ["Walnuss", "Bloodwood"], "neckAccentNote": "Vergleich der zwei Alternativen für 9/13 Teile. Diese Anzeige wird nicht im Angebot gespeichert; endgültige Holzarten/Reihenfolge werden separat vereinbart."});
  const metals = { hw_chrome:'#b8c3cc', hw_black:'#33383d', hw_gold:'#c9a75c', hw_vintage_copper:'#b77a55' };
  const colourWords = {
    red:'#9d282b', 레드:'#9d282b', 빨강:'#9d282b', rot:'#9d282b', blue:'#275f89', 블루:'#275f89', 파랑:'#275f89', blau:'#275f89',
    black:'#24262a', 블랙:'#24262a', 검정:'#24262a', schwarz:'#24262a', white:'#eee8dc', 화이트:'#eee8dc', 흰색:'#eee8dc', weiß:'#eee8dc', weiss:'#eee8dc',
    green:'#35624b', 그린:'#35624b', 초록:'#35624b', grün:'#35624b', purple:'#64476f', 퍼플:'#64476f', violett:'#64476f'
  };
  function parseColour(input) {
    let value = String(input || '').trim().toLowerCase();
    if (!value || /^(natural|natur|내추럴|내츄럴)$/.test(value)) return {status:'natural', colour:null, opaque:false};
    const opaque = /^(solid|opaque|deckend|불투명|솔리드)\s+/.test(value);
    value = value.replace(/^(transparent|translucent|solid|opaque|deckend|투명|불투명|솔리드)\s+/, '');
    const colour = /^#[0-9a-f]{6}$/.test(value) ? value : colourWords[value];
    return {status:colour ? 'colour' : 'unmapped', colour:colour || null, opaque};
  }
  function wood(id) {
    return options.materials.get(id)?.colour || null;
  }
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const point = (a,b,t) => [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];
  const pts = points => points.map(p=>p.join(',')).join(' ');
  // Original RavenForge motif: tapered oval / raven-eye, with a split feather vein.
  // No Marleaux paths or image pixels are used.
  function ovalMark(center,width,height,angle,material,boardColour) {
    const colour={oval_avalon:'#c9d6c9',oval_wood:'#b68c59',oval_acryl:'#b8c5d0',oval_resin:'#b4a7c5'}[material]||'#d9d3bd';
    return `<g data-inlay-design="ravenforge-oval" data-material="${esc(material||'')}" transform="translate(${center[0]} ${center[1]}) rotate(${angle}) scale(${width/2} ${height/2})"><path d="M-1 .10 C-.74 -.81 .30 -.96 1 -.12 C.56 .68 -.35 .87 -1 .10Z" fill="${colour}" stroke="none"/><path d="M-.69 .23 Q.03 -.17 .77 -.18 M-.12 -.04 L-.29 -.42" fill="none" stroke="${boardColour||'#413a32'}" stroke-width=".09" stroke-linecap="round"/></g>`;
  }
  Object.assign(copy.ko,{"symbols": "확인한 제조사 자료를 기준으로 부품 외형을 그립니다. 장착 크기·위치는 시각 비교용이며 미확인 부품은 원본 형상과 미표현 표시를 유지합니다.", "partsNote": "제조사 자료 기반 외형 · 장착 위치는 참고용", "assembly": "선택 부품", "rampDeferred": "핑거램프는 추후 추가 예정입니다. 현재 테스트 선택·미리보기에서 제외했습니다."});
  Object.assign(copy.en,{"symbols": "Product shapes follow verified manufacturer references. Display fit is illustrative; unsupported parts retain their source shapes and are marked not visualized.", "partsNote": "Manufacturer reference shapes · illustrative installation fit", "assembly": "Selected parts", "rampDeferred": "Finger ramps are deferred and excluded from the current test controls and preview."});
  Object.assign(copy.de,{"symbols": "Teileformen folgen geprüften Herstellerunterlagen. Die Einpassung ist beispielhaft; nicht unterstützte Teile behalten die Vorlagenform und werden als nicht dargestellt markiert.", "partsNote": "Formen nach Herstellerreferenz · Einpassung beispielhaft", "assembly": "Gewählte Teile", "rampDeferred": "Fingerrampen sind für später vorgesehen und aus Testauswahl und Vorschau entfernt."});
  function scene(model, selections, finishColour, labels, bindruneExample, extras={}) {
    const s = Object.assign({}, selections); // Read-only boundary; pricing owns normalization.
    const g = geometry[model];
    const finish = parseColour(finishColour);
    const hasTop = ['cap','veneer'].includes(s.top_type);
    const bodyId = s.body_wood_single || s.body_core_wood;
    const topId = hasTop ? s.top_wood_selection : bodyId;
    const pending = [];
    // Catalog illustrations do not establish an ordered custom housing or fit.
    // Retained prototype parts and unconfirmed catalog fits remain explicit.
    for(const category of ['pickups','hardware_bridge','hardware_machine_head']){
      const ref=parts.profile({model,selections:s},category);
      if(!ref||ref.scope==='catalog-reference')pending.push(category);
    }
    if(s.pickup_configuration==='pickup_3')pending.push('pickup_configuration');
    ['fretboard', ...(hasTop ? ['top_wood_selection'] : ['body_wood_single','body_core_wood'])].forEach(id=>{
      if (s[id] && !wood(s[id])) pending.push(id);
    });
    if (!parts.electronicsPlan({model,g,selections:s})) pending.push('electronics');
    if (s.knob === 'knob_wood' && !wood(topId)) pending.push('knob');
    if ((s.inlay_type === 'inlay_custom' && !(s.inlay_custom_spec === 'custom_bindrune' && /^c[1-4]$/.test(bindruneExample))) || s.inlay_dot_pos === 'pos_custom') pending.push('inlay_type');
    if (s.body_wing_wood && !wood(s.body_wing_wood)) pending.push('body_wing_wood');
    if (s.nut_material === 'nut_others') pending.push('nut_material');
    if (s.fret_material === 'mat_others') pending.push('fret_material');
    if (['extra','guitar_neck_custom'].includes(s.neck)) pending.push('neck');
    return {model, g, selections:s, neckAccent:extras.neckAccent==='bloodwood'?'bloodwood':'walnut', specialOptions:Array.isArray(extras.specialOptions)?extras.specialOptions.filter(id=>['kill_switch','dual_tone','delano_buffer'].includes(id)):[], pickguard:g?.pickguard?(model==='EDDA'?(s.pickguard==='pg_add'?(s.pickguard_material==='pg_wood'?'wood':(['pg_black','pg_white','pg_ivory','pg_red','pg_match'].includes(s.pickguard_colour)?s.pickguard_colour:'pg_black').replace('pg_','')):'none'):(['none','black','ivory','wood'].includes(extras.pickguard)?extras.pickguard:'black')):'none', pickguardMaterial:model==='EDDA'?(['pg_acrylic','pg_aluminium','pg_wood'].includes(s.pickguard_material)?s.pickguard_material:'pg_acrylic'):null, pickguardFinish:model==='EDDA'?s.pickguard_finish:null, labels:labels || {}, finish, neckFinish:finish, neckColour:s.neck_finish==='neck_body'?'body':'natural', hasTop, bodyId, topId, pending,
      bindruneExample:/^c[1-4]$/.test(bindruneExample)?bindruneExample:null, bodyColour:wood(topId), boardColour:wood(s.fretboard), metal:metals[s.hardware_color] || metals.hw_chrome,
      bridgeColour:s.hardware_bridge === 'nova_parts' ? metals.hw_black : model === 'ASKR' ? metals.hw_chrome : (metals[s.hardware_color] || metals.hw_chrome), bridgeFinishFixed:model==='ASKR'};
  }
  // EDDA retains its sample; ASKR/EMBLA use extracted PDF vector contours.
  // Materials, finishes and selected hardware are independent display layers.
  function renderUnoriented(state, view, language, layout) {
    const g = state.g;
    const bassDrawing=g?.kind==='bass-drawing';
    if (!g) return '';
    if (view === 'back' && !g.back) return '';
    if (view === 'back' && g.back.kind) return rearRenderer.render(Object.assign({},state,{bodyColour:wood(state.bodyId),topId:state.bodyId}),language,layout,copy);
    if (g.kind === 'drawing') {
      const rearState=view==='back'?Object.assign({},state,{bodyColour:wood(state.bodyId),topId:state.bodyId,finish:state.finish}):state;
      return drawingRenderer.render(rearState,view==='back'?'back':'full',language,layout,copy,ovalMark);
    }
    view='full'; // Full instrument only; old crop names never trigger enlargement.
    const s = state.selections, t = copy[language] || copy.en;
    const prefix = 'rf-preview-' + state.model.toLowerCase();
    // Source head contour ends above the angled nut. Close only the missing
    // transition face; retain the extracted exterior and the exact board anchors.
    const headPath=state.model==='ASKR'&&bassDrawing?g.head.replace(/Z\s*$/,`L${g.board[1]} Z`):g.head;
    const headNatural=state.selections.color_headstock==='head_natural';
    const unknown = `url(#${prefix}-unknown)`;
    const finish = state.finish;
    const portrait = layout === 'portrait';
    const polygon = (points, attrs='') => `<polygon points="${pts(points)}" ${attrs}/>`;
    const path = (d, attrs='') => `<path d="${d}" ${attrs}/>`;
    const line = (a,b,attrs='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${attrs}/>`;
    const label = id => esc(state.labels[id] || s[id] || '');
    const rect = (r,attrs='') => `<rect x="${r.x+1}" y="${r.y+1}" width="${r.w-2}" height="${r.h-2}" rx="5" ${r.angle ? `transform="rotate(${r.angle} ${r.x+r.w/2} ${r.y+r.h/2})"` : ''} ${attrs}/>`;
    const source = attrs => `<image href="${media(g.source)}" x="0" y="0" width="${g.imageSize[0]}" height="${g.imageSize[1]}" ${attrs || ''}/>`;
    const circles = (radius,attrs='') => g.controls.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${radius}" ${attrs}/>`).join('');
    const hardwareMask = path(g.tunerMask);
    const drawKnobs=!!parts.electronicsPlan(state);
    const drawPickups=!!parts.profile(state,'pickups'),drawBridge=!!parts.profile(state,'hardware_bridge'),drawTuners=!!parts.profile(state,'hardware_machine_head');
    const partsMask = (drawPickups?'':g.pickups.map(r=>rect(r)).join(''))+(drawBridge?'':path(g.hardware))+(drawKnobs?'':circles(8))+(g.pickguard&&state.pickguard!=='none'?path(g.pickguard):'');
    // Black -> selected midtone -> soft specular highlight. Colour-space is explicit
    // so Chromium and SVG rasterizers use the same transfer curve.
    const colourFilter = (name, colour, weights, exposure, opaque) => {
      const rgb = colour.match(/[a-f0-9]{2}/gi).map(v=>parseInt(v,16)/255);
      const tables = rgb.map(channel=>[0,.16,.32,.48,.64,.80,1].map(v=>{
        const light=Math.min(1,Math.pow(v,.8)*exposure);
        // Opaque suppresses grain contrast with a pointwise tone curve. No spatial
        // averaging: outlines, hardware edges and highlights stay at source resolution.
        if(opaque) return (light<.24?channel*(.36+light*2.3):light<.76?channel*(.91+(light-.24)*.12):channel+(1-channel)*(light-.76)/.24).toFixed(4);
        return (light<.7 ? channel*light/.7 : channel+(1-channel)*(light-.7)/.3).toFixed(4);
      }).join(' '));
      const row=weights.join(' ')+' 0 0';
      return `<filter id="${prefix}-${name}" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${row} ${row} ${row} 0 0 0 1 0"/><feComponentTransfer>${['R','G','B'].map((c,i)=>`<feFunc${c} type="table" tableValues="${tables[i]}"/>`).join('')}</feComponentTransfer></filter>`;
    };
    const dye=(base,colour)=>'#'+[0,1,2].map(i=>Math.round(parseInt(base.slice(1+i*2,3+i*2),16)*.16+parseInt(colour.slice(1+i*2,3+i*2),16)*.84).toString(16).padStart(2,'0')).join('');
    const bodyColour=finish.colour ? (finish.opaque?finish.colour:dye(state.bodyColour||'#7f8589',finish.colour)) : state.bodyColour || '#7f8589';
    const boardColour=state.boardColour || '#7f8589';
    const viewBox = (portrait?g.portrait:g.views)[view] || (portrait?g.portrait:g.views).full;
    const transform=portrait?(g.portraitTransform||'translate(0 0)'):g.transform;
    const fretted=s.fret_type!=='fretless';
    let out=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" data-preview-svg="${state.model}" data-renderer="${bassDrawing?'drawing-composite':'sample-composite'}" data-side="front" data-layout="${portrait?'portrait':'landscape'}">
      <title id="${prefix}-title">${esc(state.model+' · '+t.live)}</title><desc id="${prefix}-desc">${esc(bassDrawing?t.drawingNote+' '+t.geometry:t.note+' '+t.tone+' '+t.symbols)}</desc>
      <defs>${options.definitions(prefix,state,false)}${parts.definitions(prefix,state)}${options.materials.pattern(prefix+'-natural-head','maple')}
      <pattern id="${prefix}-unknown" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#5e6670"/><path d="M0 12L12 0" stroke="#b4bdc7" stroke-width="2"/></pattern>
      <clipPath id="${prefix}-silhouette">${path(g.body)}${path(headPath)}${polygon(g.board)}${drawTuners?'':path(g.tunerMask)}</clipPath>
      <linearGradient id="${prefix}-clean-light" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#ffffff" stop-opacity=".1"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      <linearGradient id="${prefix}-body-light" x1="0" y1=".1" x2="1" y2=".85"><stop stop-color="#fffaf0" stop-opacity=".22"/><stop offset=".25" stop-color="#fff" stop-opacity=".05"/><stop offset=".55" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".4"/></linearGradient>
      <linearGradient id="${prefix}-body-rim" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#fff8ed" stop-opacity=".65"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/><stop offset=".65" stop-color="#080b0c" stop-opacity=".35"/><stop offset="1" stop-color="#030405" stop-opacity=".75"/></linearGradient>
      <filter id="${prefix}-body-edge" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur in="SourceAlpha" stdDeviation="5" result="soft"/><feComposite in="SourceAlpha" in2="soft" operator="out" result="edge"/><feFlood flood-color="#030508" flood-opacity=".85"/><feComposite in2="edge" operator="in"/></filter>
      <clipPath id="${prefix}-body">${path(g.body)}</clipPath><clipPath id="${prefix}-head">${path(headPath)}</clipPath>
      <clipPath id="${prefix}-board">${polygon(g.board)}</clipPath>
      <clipPath id="${prefix}-hardware">${hardwareMask}</clipPath><clipPath id="${prefix}-knobs">${circles(8)}</clipPath><clipPath id="${prefix}-bridge">${path(g.hardware)}</clipPath>
      <clipPath id="${prefix}-pickups">${g.pickups.map(r=>rect(r)).join('')}</clipPath>
      <mask id="${prefix}-wood-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${g.imageSize[0]}" height="${g.imageSize[1]}"><rect width="${g.imageSize[0]}" height="${g.imageSize[1]}" fill="white"/><g fill="black">${partsMask}${polygon(g.board)}</g></mask>
      ${colourFilter('wood-tone',bodyColour,g.luminance,g.exposure,finish.opaque)}
      ${colourFilter('head-tone',headNatural?'#dcc6a0':bodyColour,g.luminance,Math.min(1.15,g.exposure),!headNatural&&finish.opaque)}
      ${colourFilter('material-tint',finish.colour||'#ffffff',[.30,.59,.11],1.2,false)}
      <filter id="${prefix}-source-shade" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope=".55" intercept=".45"/><feFuncG type="linear" slope=".55" intercept=".45"/><feFuncB type="linear" slope=".55" intercept=".45"/></feComponentTransfer></filter>
      ${colourFilter('metal-tone',state.metal,[.30,.59,.11],1.6,0)}
      ${colourFilter('bridge-tone',state.bridgeColour,[.30,.59,.11],1.6,0)}
      <linearGradient id="${prefix}-reference-bridge-metal" x2=".3" y2="1"><stop stop-color="#24282b"/><stop offset=".2" stop-color="${state.bridgeColour}"/><stop offset=".32" stop-color="#dde0dd"/><stop offset=".48" stop-color="${state.bridgeColour}"/><stop offset="1" stop-color="#1b2022"/></linearGradient>
      <linearGradient id="${prefix}-board-tone" ${g.horizontal?'x1="0" y1="0" x2="0" y2="1"':'x1="0" y1="0" x2="1" y2="0"'}><stop stop-color="#0c0b0a"/><stop offset=".15" stop-color="${boardColour}"/><stop offset=".53" stop-color="${boardColour}"/><stop offset="1" stop-color="#14110f"/></linearGradient>
      <linearGradient id="${prefix}-board-light" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff1cc" stop-opacity=".12"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <filter id="${prefix}-shadow" x="-15%" y="-15%" width="130%" height="135%"><feDropShadow dx="5" dy="9" stdDeviation="10" flood-color="#000" flood-opacity=".65"/></filter>
      </defs><g transform="${transform}">
      <g filter="url(#${prefix}-shadow)">${bassDrawing?path(g.body,'fill="#141410"')+path(headPath,'fill="#141410"'):source(`clip-path="url(#${prefix}-silhouette)"`)}</g>
      <g data-layer="body" data-option="${esc(state.topId||'')}" data-material="${esc(state.bodyId||'')}" clip-path="url(#${prefix}-body)" ${bassDrawing?'data-contour="pdf-vector"':'mask="url(#'+prefix+'-wood-mask)"'}>
        <title>${label(state.hasTop?'top_wood_selection':s.body_wood_single?'body_wood_single':'body_core_wood')} · ${esc(t.sampleGrain)}</title>
        <g data-surface="continuous-body" data-source-hardware="excluded">
          ${path(g.body,`fill="${bodyColour}"`)}
          ${!finish.opaque&&options.materials.get(state.topId)?path(g.body,`data-texture="${options.materials.key(state.topId)}" fill="url(#${prefix}-material)" ${finish.colour?`filter="url(#${prefix}-surface-dye)"`:''}`):''}
          ${path(g.body,`fill="url(#${prefix}-body-light)"`)}
          ${path(g.body,`fill="white" filter="url(#${prefix}-body-edge)"`)}
          ${path(g.body,`fill="none" stroke="url(#${prefix}-body-rim)" stroke-width="2"`)}
        </g>${options.finish(state,prefix,g.body)}
        ${!state.bodyColour?path(g.body,`fill="${unknown}" opacity=".4"`):''}
      </g>`;
    out+=options.bodyPieces(state,prefix,g.body,false,g.bodyCenter,100);
    // The sample guard wraps around the neck pocket, so the board stays above it.
    out+=parts.guard(state,prefix);
    if(finish.colour) out+=`<g data-layer="finish" data-colour="${finish.colour}" data-opaque="${finish.opaque}"><title>${esc(t.colour)}: ${finish.colour}</title></g>`;
    out+=parts.tuners(state,prefix,false,'rear-mount');
    out+=`<g data-layer="headstock" data-option="${esc(s.color_headstock||'')}" data-neck-transition="${state.model==='ASKR'&&bassDrawing?'source-anchor-closure':'source-contour'}" clip-path="url(#${prefix}-head)">${path(headPath,`fill="${headNatural?'#dcc6a0':bodyColour}"`)+((headNatural||!finish.opaque)?path(headPath,`fill="url(#${prefix}-${headNatural?'natural-head':'material'})" ${!headNatural&&finish.colour?`filter="url(#${prefix}-surface-dye)"`:''}`):'')+path(headPath,`fill="url(#${prefix}-clean-light)"`)}</g>`;
    // A clean board removes the sample's ornate custom inlay, which is not selected.
    out+=`<g data-layer="fretboard" data-option="${esc(s.fretboard||'')}">${polygon(g.board,`fill="${state.boardColour?`url(#${prefix}-board-material)`:unknown}" stroke="#796750" stroke-width=".8"`)}<title>${label('fretboard')}</title><g clip-path="url(#${prefix}-board)" opacity=".13">`;
    for(let i=0;i<32;i++) {
      const f=(i+.5)/32, start=point(g.board[0],g.board[1],f), end=point(g.board[3],g.board[2],Math.min(.99,f+.009*Math.sin(i*2)));
      out+=line(start,end,`stroke="${i%3?'#16100c':'#e6cb9f'}" stroke-width="${.3+(i%4)*.2}"`);
    }
    out+=`</g>${polygon(g.board,`fill="url(#${prefix}-board-light)"`)}</g>`;
    out+=options.boardEdges(state,g.board)+options.bindrune(state,g.board,prefix+'-board');
    const frets=g.frets?[...g.frets]:[];
    for(let n=1;!g.frets&&n<=24;n++) {
      const fraction=(1-Math.pow(2,-n/12))/.75;
      frets.push([point(g.board[0],g.board[3],fraction),point(g.board[1],g.board[2],fraction)]);
    }
    if(fretted||s.fretline==='line_yes') {
      const colour=!fretted?'#b1a08a':s.fret_material==='mat_brass'?'#dfc38b':'#d8dcda';
      out+=`<g data-layer="frets" data-count="24">`;
      frets.forEach(pair=>{if(fretted) out+=line(...pair,'stroke="#161616" stroke-width="3.1"');out+=line(...pair,`stroke="${colour}" stroke-width="${fretted?options.fretWidth(s):.8}"`);});
      out+='</g>';
    }
    const nutColours={guitar_bone_nut:'#e8dfcc',nut_bone:'#e8dfcc',nut_horn:'#262420',nut_guayacan:'#79663e',nut_brass:'#d6b872',nut_guide:'#b8c3cc'};
    out+=`<g data-layer="nut" data-option="${esc(s.nut_material||'')}" data-zero-fret="${state.model!=='GRAMR'&&fretted}">${line(g.board[0],g.board[1],`stroke="${nutColours[s.nut_material]||'#77808b'}" stroke-width="3"`)}`;
    if(state.model!=='GRAMR'&&fretted) out+=line(point(g.board[0],g.board[3],.008),point(g.board[1],g.board[2],.008),'stroke="#c2c9cc" stroke-width="1.25"');
    out+='</g>';
    if(s.inlay_type==='inlay_oval'||(s.inlay_type==='inlay_dot'&&s.inlay_dot_pos!=='pos_custom')) {
      out+=`<g data-layer="inlays" data-material="${esc(s.inlay_dot_mat||s.inlay_oval_mat||'')}" fill="${options.dotColour(state)}" stroke="#f9edd1" stroke-width=".35">`;
      [3,5,7,9,12,15,17,19,21,24].forEach(n=>{
        const fraction=((1-Math.pow(2,-n/12))+(1-Math.pow(2,-(n-1)/12)))/1.5;
        const a=g.frets?point(frets[n-2][0],frets[n-1][0],.5):point(g.board[0],g.board[3],fraction),b=g.frets?point(frets[n-2][1],frets[n-1][1],.5):point(g.board[1],g.board[2],fraction);
        const places=n%12===0?[.3,.7]:[s.inlay_type==='inlay_oval'?.5:s.inlay_dot_pos==='pos_left'?.2:s.inlay_dot_pos==='pos_right'?.8:.5];
        places.forEach(f=>{const p=point(a,b,f);if(s.inlay_type==='inlay_oval'){
          const breadth=Math.hypot(b[0]-a[0],b[1]-a[1]);
          const gap=Math.hypot(frets[n-1][0][0]-frets[n-2][0][0],frets[n-1][0][1]-frets[n-2][0][1]);
          out+=ovalMark(p,breadth*(n%12===0?.32:.66),Math.min(breadth*.2,gap*.55),Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,s.inlay_oval_mat,boardColour);
        }else out+=`<ellipse cx="${p[0]}" cy="${p[1]}" rx="2.5" ry="2.5"/>`;});
      });out+='</g>';
    }
    // Preserve original part pixels. No stretched product-family symbols or
    // flat material patches covering source hardware.
    out+=parts.ramps(state,prefix);
    out+=parts.pickups(state,prefix)||`<g data-layer="pickups" data-option="${esc(s.pickups||'')}" data-count="2" data-appearance="reference-retained"><title>${label('pickups')} · ${esc(t.referenceParts)}</title>${bassDrawing?g.pickupOutlines.map(d=>path(d,'fill="#171a1c" stroke="#55595b" stroke-width=".8"')).join(''):source(`clip-path="url(#${prefix}-pickups)"`)}</g>`;
    out+=parts.tuners(state,prefix)||`<g data-layer="hardware" data-option="${esc(s.hardware_color||'')}" data-colour="${state.metal}" data-appearance="reference-retained"><title>${label('hardware_color')}</title>${bassDrawing?g.tuners.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="${state.metal}" stroke="#303536"/>`).join(''):source(`clip-path="url(#${prefix}-hardware)" filter="url(#${prefix}-metal-tone)"`)}</g>`;
    out+=parts.bridge(state,prefix)||parts.referenceBridge(state,prefix)||`<g data-layer="bridge" data-option="${esc(s.hardware_bridge||'')}" data-colour="${state.bridgeColour}" data-finish-fixed="${!!state.bridgeFinishFixed}" data-appearance="reference-retained"><title>${label('hardware_bridge')} · ${esc(t.referenceParts)}</title>${bassDrawing?g.bridgeOutlines.map(d=>path(d,`fill="url(#${prefix}-reference-bridge-metal)" stroke="#252a2c" stroke-width=".7"`)).join('')+path(g.bridgeArtwork,`fill="none" stroke="${state.bridgeColour}" stroke-width="1.1"`):source(`clip-path="url(#${prefix}-bridge)" filter="url(#${prefix}-bridge-tone)"`)}</g>`;
    out+=(drawKnobs?parts.knobs(state,prefix,8):`<g data-layer="knobs" data-count="${g.controls.length}" data-placement="source-retained">${(bassDrawing||state.model==='EDDA')?g.controls.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="8" fill="url(#${prefix}-part-metal)" stroke="#222"/>`).join(''):source(`clip-path="url(#${prefix}-knobs)" filter="url(#${prefix}-metal-tone)"`)}${options.knobs(state,prefix,g.controls,8)}</g>`)+parts.controls(state,prefix,8);
    // Only the board is redrawn. Strings/saddles on the body and tuner layout are
    // baked reference details, explicitly distinguished from current specifications.
    out+=`<g data-layer="strings" data-count="${g.strings}" data-scope="${bassDrawing?'whole-instrument':'fretboard'}" ${bassDrawing?'':'clip-path="url(#'+prefix+'-board)"'}>`;
    for(let i=0;i<g.strings;i++) {
      if(bassDrawing){const f=i/(g.strings-1),nut=point(g.board[0],g.board[1],.08+.84*f),bridge=parts.bridgeAnchors(state)?.[i]||g.stringLines[i][1],tuner=g.tuners[i];out+=path(`M${tuner} L${nut} L${bridge}`,`fill="none" stroke="#10100e" stroke-width="${2-i*.28}"`)+path(`M${tuner} L${nut} L${bridge}`,`fill="none" stroke="#d6d3c4" stroke-width="${1.2-i*.2}"`);continue;}
      const f=.08+.84*i/(g.strings-1),a=point(g.board[0],g.board[1],f),b=point(g.board[3],g.board[2],f);
      out+=line(a,b,`stroke="#0e0d0c" stroke-width="${2.1-i*.19}" opacity=".8"`);
      out+=line(a,b,`stroke="#ddd8c5" stroke-width="${1.15-i*.12}" opacity=".85"`);
    }
    out+='</g>';
    if(state.model!=='ASKR'&&(drawPickups||drawBridge||s.fretboard_extense!=='extense_none'||state.pickguard!=='none')){
      out+='<g data-layer="body-strings" data-appearance="reference-alignment">';
      for(let i=0;i<g.strings;i++)out+=line(point(g.board[3],g.board[2],.08+.84*i/(g.strings-1)),(parts.bridgeAnchors(state)?.[i]||point(g.bridge[0],g.bridge[1],i/(g.strings-1))),`stroke="#d6d0b9" stroke-width="${1.15-i*.12}" opacity=".7"`);
      out+='</g>';
    }
    return out+'</g></svg>';
  }
  function renderSvg(state,view,language,layout){return options.orientation(renderUnoriented(state,view,language,layout),state);}
  const guardCopy={
    ko:{titles:{pickguard:'픽가드',pickguard_material:'픽가드 재질',pickguard_colour:'픽가드 색상',pickguard_finish:'픽가드 표면'},options:{pg_none:'없음',pg_add:'픽가드 추가',pg_acrylic:'아크릴',pg_aluminium:'알루미늄',pg_wood:'바디·탑 매칭 목재',pg_black:'블랙',pg_white:'화이트',pg_ivory:'아이보리',pg_red:'버건디',pg_match:'바디 색상 매칭',pg_matte:'무광',pg_gloss:'유광'},note:'EDDA 선택형 픽가드. 선택은 사양표·PDF에 기록되며 추가 가격은 별도 견적입니다. 외곽·재질·표면은 비교용 시안입니다.',woodNote:'매칭 목재는 선택한 바디·탑 수종과 색상을 따릅니다. 실제 재고 무늬와 가공 도면은 별도 확정합니다.',location:'픽가드 유무·재질·색상·표면은 4단계 하드웨어에서 선택합니다.',pending:'실제 외형 미반영'},
    en:{titles:{pickguard:'Pickguard',pickguard_material:'Pickguard material',pickguard_colour:'Pickguard colour',pickguard_finish:'Pickguard surface'},options:{pg_none:'None',pg_add:'Add pickguard',pg_acrylic:'Acrylic',pg_aluminium:'Aluminium',pg_wood:'Body / top matching wood',pg_black:'Black',pg_white:'White',pg_ivory:'Ivory',pg_red:'Burgundy',pg_match:'Match body colour',pg_matte:'Matte',pg_gloss:'Gloss'},note:'Optional EDDA pickguard. Choices are saved in the specification and PDF; surcharge quoted separately. Outline, material and surface are visual proposals.',woodNote:'Matching wood follows the selected body/top species and colour. Actual grain and machining drawings are agreed separately.',location:'Choose pickguard, material, colour and surface in step 4: Hardware.',pending:'Actual shape not rendered'},
    de:{titles:{pickguard:'Schlagbrett',pickguard_material:'Schlagbrettmaterial',pickguard_colour:'Schlagbrettfarbe',pickguard_finish:'Schlagbrettoberfläche'},options:{pg_none:'Ohne',pg_add:'Schlagbrett hinzufügen',pg_acrylic:'Acryl',pg_aluminium:'Aluminium',pg_wood:'Passendes Korpus-/Deckenholz',pg_black:'Schwarz',pg_white:'Weiß',pg_ivory:'Elfenbein',pg_red:'Burgunderrot',pg_match:'An Korpusfarbe anpassen',pg_matte:'Matt',pg_gloss:'Glänzend'},note:'Optionales EDDA-Schlagbrett. Auswahl wird in Spezifikation und PDF gespeichert; Aufpreis auf Anfrage. Kontur, Material und Oberfläche sind Gestaltungsvorschläge.',woodNote:'Passendes Holz folgt der gewählten Korpus-/Deckenholzart und Farbe. Maserung und Fertigungszeichnung werden separat vereinbart.',location:'Schlagbrett, Material, Farbe und Oberfläche in Schritt 4: Hardware wählen.',pending:'Tatsächliche Form nicht dargestellt'}
  };
  function configureTestOptions(data,i18n){
    // Test-only catalog extension. Existing calculations/normalization/PDF code
    // consume these normal category records; the production catalog is untouched.
    const head=data.categories.find(c=>c.id==='color_headstock');
    if(!head.options.some(o=>o.id==='head_natural')){
      head.options=head.options.filter(o=>o.id!=='head_plate');
      head.options.push({id:'head_natural',label:'Non-matching · natural',prices:{EDDA:0,EMBLA:0,ASKR:0,GRAMR:0}});
    }
    if(!data.categories.some(c=>c.id==='neck_finish'))data.categories.push({id:'neck_finish',title:'Neck colour',options:[
      {id:'neck_natural',label:'Natural',prices:{EDDA:0,EMBLA:0,ASKR:0,GRAMR:0},isStandard:['EDDA','EMBLA','ASKR','GRAMR']},
      {id:'neck_body',label:'Match body colour',spec:'Finish surcharge to be quoted',prices:{EDDA:'request',EMBLA:'request',ASKR:'request',GRAMR:'request'}}]});
    const guardOption=(id,label,price=0,standard=false)=>({id,label,prices:{EDDA:price},...(standard?{isStandard:['EDDA']}:{})});
    const guardCategories=[
      {id:'pickguard',title:'Pickguard',options:[guardOption('pg_none','None',0,true),guardOption('pg_add','Add pickguard','request')]},
      {id:'pickguard_material',title:'Pickguard material',dependsOn:{pickguard:'pg_add'},options:[guardOption('pg_acrylic','Acrylic'),guardOption('pg_aluminium','Aluminium'),guardOption('pg_wood','Matching wood')]},
      {id:'pickguard_colour',title:'Pickguard colour',dependsOn:{pickguard_material:['pg_acrylic','pg_aluminium']},options:[guardOption('pg_black','Black'),guardOption('pg_white','White'),guardOption('pg_ivory','Ivory'),guardOption('pg_red','Burgundy'),guardOption('pg_match','Match body colour')]},
      {id:'pickguard_finish',title:'Pickguard surface',dependsOn:{pickguard:'pg_add'},options:[guardOption('pg_matte','Matte'),guardOption('pg_gloss','Gloss')]}
    ];
    for(const category of guardCategories)if(!data.categories.some(c=>c.id===category.id))data.categories.push(category);
    if(i18n)for(const lang of ['ko','en','de']){
      i18n[lang].categoryTitles.neck_finish=copy[lang].neckColourTitle;
      Object.assign(i18n[lang].categoryTitles,guardCopy[lang].titles);
      Object.assign(i18n[lang].optionLabels,guardCopy[lang].options);
      i18n[lang].categoryNotes ||= {};
      i18n[lang].categoryNotes.pickguard=guardCopy[lang].note;
      i18n[lang].categoryNotes.pickguard_material=guardCopy[lang].woodNote;
      Object.assign(i18n[lang].optionLabels,{head_natural:copy[lang].headNatural,neck_natural:copy[lang].neckNatural,neck_body:copy[lang].neckBody});
    }
  }
  const controlWords={
    ko:{volume:'볼륨',blend:'블렌드',tone:'톤',bass:'베이스',mid:'미드',treble:'트레블',low_mid:'로우 미드',high_mid:'하이 미드',mid_frequency:'미드 주파수',neck_filter:'넥 필터',bridge_filter:'브릿지 필터',neck_resonance:'넥 공진',bridge_resonance:'브릿지 공진',bass_frequency:'베이스 주파수',treble_filter:'고역 필터',treble_level:'고역 레벨'},
    en:{volume:'Volume',blend:'Blend',tone:'Tone',bass:'Bass',mid:'Mid',treble:'Treble',low_mid:'Low mid',high_mid:'High mid',mid_frequency:'Mid frequency',neck_filter:'Neck filter',bridge_filter:'Bridge filter',neck_resonance:'Neck resonance',bridge_resonance:'Bridge resonance',bass_frequency:'Bass frequency',treble_filter:'High-pass filter',treble_level:'Treble level'},
    de:{volume:'Lautstärke',blend:'Balance',tone:'Tonblende',bass:'Bass',mid:'Mitten',treble:'Höhen',low_mid:'Tiefmitten',high_mid:'Hochmitten',mid_frequency:'Mittenfrequenz',neck_filter:'Halsfilter',bridge_filter:'Stegfilter',neck_resonance:'Halsresonanz',bridge_resonance:'Stegresonanz',bass_frequency:'Bassfrequenz',treble_filter:'Hochpass',treble_level:'Höhenpegel'}
  };
  Object.assign(copy.ko,{displaySettings:'미리보기 설정·표현 범위',neckColourTitle:'넥 색상',neckNatural:'내추럴',neckBody:'바디 색상 매칭',headNatural:'논 매칭 · 내추럴',controlNote:'선택한 전자장치의 기능에 따라 단일·이중 노브를 표시합니다. 배열은 설치 예시이며 최종 배선과 가공 위치는 별도 확정합니다.',controlVisibleNote:'추가 스위치는 노브와 별도 배치 · 최종 가공 위치는 별도 확정',eqTitle:'컨트롤 배열',eqPending:'커스텀 배선 미확정 · 원본 노브 유지',stacked:'이중 노브'});
  Object.assign(copy.en,{displaySettings:'Preview settings & scope',neckColourTitle:'Neck colour',neckNatural:'Natural',neckBody:'Match body colour',headNatural:'Non-matching · natural',controlNote:'Single and stacked knobs follow the selected electronics. Arrangement is an installation example; final wiring and drilling positions are agreed separately.',controlVisibleNote:'Additional switches stay separate from knobs · final drilling positions unconfirmed',eqTitle:'Control layout',eqPending:'Custom wiring pending · source knobs retained',stacked:'Stacked'});
  Object.assign(copy.de,{displaySettings:'Vorschau-Einstellungen & Umfang',neckColourTitle:'Halsfarbe',neckNatural:'Natur',neckBody:'An Korpusfarbe anpassen',headNatural:'Nicht angepasst · Natur',controlNote:'Einzel- und Doppelknöpfe folgen der gewählten Elektronik. Die Anordnung ist ein Einbaubeispiel; Verdrahtung und Bohrpositionen werden separat vereinbart.',controlVisibleNote:'Zusatzschalter sind von Reglern getrennt · endgültige Bohrpositionen unbestätigt',eqTitle:'Regleranordnung',eqPending:'Sonderverdrahtung offen · ursprüngliche Regler beibehalten',stacked:'Doppelknopf'});
  const pickupCopy={
    ko:{reference:'제품 사진·도면 기반 렌더',source:'제조사 자료',unknown:'주문 외형 자료 없음 · 악기는 원본 픽업 유지',custom:'기본 MM 외형 참고 · 주문 커버는 미확정',bassbar:'카탈로그 101×36 외형 참고 · 주문용 100×36 커버는 미확정'},
    en:{reference:'Render from product photos / drawings',source:'Manufacturer reference',unknown:'Custom shape unavailable · source pickups retained on instrument',custom:'Standard MM reference · custom cover unconfirmed',bassbar:'Catalog 101×36 reference · custom 100×36 cover unconfirmed'},
    de:{reference:'Darstellung nach Produktfotos / Zeichnungen',source:'Herstellerquelle',unknown:'Sonderform fehlt · ursprüngliche Tonabnehmer am Instrument beibehalten',custom:'Standard-MM als Referenz · Sondergehäuse unbestätigt',bassbar:'Katalogform 101×36 · Sondergehäuse 100×36 unbestätigt'}
  };
  function pickupStatus(model,option,language){
    const t=pickupCopy[language]||pickupCopy.en,ref=parts.profile({model,selections:{pickups:option}},'pickups');
    return !ref?t.unknown:ref.note==='bassbar-custom'?t.bassbar:ref.note==='nova-custom'?t.custom:t.reference;
  }
  function PickupExample({model,option,language}){
    const h=window.React.createElement,svg=parts.pickupThumbnail(model,option,`pickup-card-${model}-${option.replace(/[^a-zA-Z0-9_-]/g,'')}`);
    return h('div',{className:'rf-pickup-card','data-pickup-example':option},svg&&h('div',{className:'rf-pickup-card-image',dangerouslySetInnerHTML:{__html:svg}}),h('p',{'data-pickup-card-status':true},pickupStatus(model,option,language)));
  }
  function Component(props) {
    const React = window.React, h = React.createElement;
    const [view,setView] = React.useState('front');
    const [sample,setSample] = React.useState(false);
    const [guards,setGuards] = React.useState({});
    const [neckAccents,setNeckAccents] = React.useState({});
    const neckAccent=neckAccents[props.model]||'walnut';
    const pickguard=props.model==='EDDA'?props.selections.pickguard:(guards[props.model]||'black');
    const [compact,setCompact] = React.useState(()=>window.matchMedia('(max-width:1023px)').matches);
    React.useEffect(()=>{const media=window.matchMedia('(max-width:1023px)');const change=()=>setCompact(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
    React.useEffect(()=>{setSample(false);},[props.model,props.selections,props.finishColor,props.bindruneExample,props.specialOptions,pickguard,neckAccent]);
    React.useEffect(()=>{setView('front');},[props.model,props.selections.pickguard,props.selections.pickguard_material,props.selections.pickguard_colour,props.selections.pickguard_finish]);
    React.useEffect(()=>{if(props.bindruneExample)setView('front');},[props.bindruneExample]);
    const t = copy[props.language] || copy.en;
    const state = scene(props.model,props.selections,props.finishColor,props.labels,props.bindruneExample,{specialOptions:props.specialOptions,pickguard,neckAccent});
    const s = state.selections;
    const isDrawing=state.g && ['drawing','bass-drawing'].includes(state.g.kind);
    const rear=view==='back',missing=rear&&!state.g?.back;
    const rearConcept=rear&&state.g?.back?.kind==='rear-concept';
    const rearDrawing=rear&&state.g?.back?.kind==='rear-drawing';
    const referenceTitle=rearConcept?t.rearConcept:isDrawing||rearDrawing?t.drawingView:t.sourceView;
    const rearNote=rearConcept?t.rearConceptNote:rearDrawing?t.bassRearNote:t.backNote;
    const rearParts=rearConcept?t.rearConceptParts:rearDrawing?t.bassRearParts:t.backParts;
    const rearReference=rearConcept?t.rearConceptNote:rearDrawing?t.bassRearReference:t.backReferenceNote;
    const source=rear?state.g?.back?.source:state.g?.source;
    const imageSource=source && media(sample?source:isDrawing||rearDrawing?'assets/configurator-materials/ash-illustrative.webp':source);
    const imageSources=[...new Set([imageSource,...(!sample?options.materials.sources.map(media):[])].filter(Boolean))];
    const imageKey=imageSources.join('|');
    const [imageStatus,setImageStatus]=React.useState({source:null,status:'loading'});
    React.useEffect(()=>{
      let active=true;
      if(!imageSource) return ()=>{active=false;};
      Promise.all(imageSources.map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;})))
        .then(()=>{if(active)setImageStatus({source:imageKey,status:'ready'});})
        .catch(()=>{if(active)setImageStatus({source:imageKey,status:'error'});});
      return ()=>{active=false;};
    },[imageKey]);
    const imageReady=imageStatus.source===imageKey&&imageStatus.status==='ready';
    const imageFailed=imageStatus.source===imageKey&&imageStatus.status==='error';
    const rows = ['pickguard','pickguard_material','pickguard_colour','pickguard_finish','body_construction','electronics','neck_finish','coil_switch','control_layout','orientation','body_wood_single','body_core_wood','body_wing_wood','top_type','top_wood_selection','neck','fretboard','fret_type','fret_material','fret_size','fret_side','inlay_type','inlay_dot_mat','inlay_dot_pos','inlay_oval_mat','nut_material','color_top','color_back_side','color_headstock','extra_finish_burst','extra_finish_flake','knob','pickup_configuration','pickups','hardware_bridge','hardware_machine_head','hardware_color','fretboard_extense'].filter(id=>s[id]);
    return h('section',{className:'rf-preview',id:'instrument-preview','aria-labelledby':'preview-title','data-preview-model':props.model,'data-preview-side':view,'data-preview-version':'v23'},
      h('div',{className:'rf-preview-heading'},h('div',null,h('p',null,t.live),h('h2',{id:'preview-title'},props.model),h('p',{'data-neck-construction':'bolt-on'},t.boltOn)),h('span',{className:'rf-preview-mark','aria-hidden':true},'RF / TEST v23')),
      h('div',{className:'rf-preview-sides','aria-label':t.title},['front','back'].map(id=>h('button',{type:'button',key:id,'data-preview-side':id,'aria-pressed':view===id,onClick:()=>{setSample(false);setView(id);}},t[id]))),
      !missing && h('div',{className:'rf-preview-mode'},[false,true].map(original=>h('button',{key:String(original),type:'button','data-preview-mode':original?'sample':'selected','aria-pressed':sample===original,onClick:()=>setSample(original)},original?referenceTitle:t.selectedView))),
      missing?h('div',{className:'rf-preview-unavailable','data-preview-unavailable':'back',role:'status'},h('strong',null,t.backMissing),h('p',null,t.backMissingNote)):
        !imageReady?h('div',{className:'rf-preview-unavailable','data-preview-image-status':imageFailed?'error':'loading',role:'status'},h('strong',null,imageFailed?t.imageError:t.imageLoading),imageFailed&&h('p',null,t.imageErrorNote)):
        sample?h('div',{className:'rf-preview-reference'},h('img',{src:media(source),alt:props.model+' · '+t[view]+' · '+referenceTitle}),h('p',null,rear?rearReference:isDrawing?t.drawingReferenceNote:t.referenceNote)):
          h('div',{className:'rf-preview-stage','data-view':view,dangerouslySetInnerHTML:{__html:renderSvg(state,view,props.language,compact?'landscape':'portrait')}}),
      state.finish.status==='unmapped' && h('p',{className:'rf-preview-warning',role:'status'},t.textOnly),
      state.finish.colour && (rear?s.color_back_side==='back_oil':s.color_top==='top_oil') && h('p',{className:'rf-preview-warning'},t.oil),
      !rear&&state.pending.includes('pickups')&&h('p',{className:'rf-preview-warning','data-pickup-pending':true},props.labels.pickups+' · '+pickupStatus(props.model,s.pickups,props.language)),
      !rear&&parts.profile(state,'pickups')&&h('p',{className:'rf-pickup-source','data-pickup-reference':true},props.labels.pickups+' · ',h('a',{href:parts.profile(state,'pickups').url,target:'_blank',rel:'noopener noreferrer'},(pickupCopy[props.language]||pickupCopy.en).source)),
      h('p',{className:'rf-preview-note','data-geometry-scope':true},rear?rearNote:isDrawing?t.drawingParts+' · '+t.geometry:t.note),
      h('details',{className:'rf-preview-settings'},h('summary',null,t.displaySettings),
      props.model==='EDDA'?h('p',{'data-pickguard-catalog':true},(guardCopy[props.language]||guardCopy.en).location):state.g?.pickguard?h('div',{className:'rf-preview-guard'},h('strong',null,t.guardTitle),
        h('div',{className:'rf-preview-guard-options','aria-label':t.pickguard},['none','black','ivory','wood'].map((id,i)=>h('button',{type:'button',key:id,'data-preview-pickguard':id,'aria-pressed':pickguard===id,onClick:()=>{setGuards(previous=>({...previous,[props.model]:id}));setView('front');setSample(false);}},t.guardNames[i]))),h('p',null,props.model==='EDDA'?t.eddaGuardNote:t.guardNote)):h('p',{className:'rf-preview-note','data-pickguard-unavailable':true},t.guardUnavailable),
      h('p',{className:'rf-preview-note','data-preview-construction':true},t.construction+' · '+(props.labels.body_construction||'')+' / '+(props.labels.neck||'')),
      options.laminatePlan(state)&&h('p',{className:'rf-preview-note','data-laminate-note':true},t.laminateNote),
      ['9pc','13pc'].includes(s.neck)&&h('div',{className:'rf-preview-guard','data-neck-accent-control':true},h('strong',null,t.neckAccentTitle),h('div',{className:'rf-preview-guard-options'},['walnut','bloodwood'].map((id,i)=>h('button',{key:id,type:'button','data-preview-neck-accent':id,'aria-pressed':neckAccent===id,onClick:()=>{setNeckAccents(previous=>({...previous,[props.model]:id}));setSample(false);setView('back');}},t.neckAccentNames[i]))),h('p',null,t.neckAccentNote)),
      !rear&&h('p',{className:'rf-preview-note','data-fit-scope':true},({ko:'EDDA: 원래 픽가드 외곽 복원 · 노브는 픽가드 밖 컨트롤 영역에 배치 · 가공 도면 아님. ETS: Tuning Fork 참고 외형, 주문 치수 미확정. Schaller 3D: 제조사 도면 외형, 악기 장착 미확정.',en:'EDDA: original pickguard contour restored; controls stay outside its boundary. Not a machining drawing. ETS: Tuning Fork catalog reference; custom dimensions pending. Schaller 3D: manufacturer outline; instrument fit unconfirmed.',de:'EDDA: ursprüngliche Schlagbrettkontur; Regler außerhalb. Keine Fertigungszeichnung. ETS: Tuning-Fork-Katalogreferenz; Sondermaße offen. Schaller 3D: Herstellerkontur; Einbau unbestätigt.'})[props.language]),
      !rear&&h('div',{className:'rf-eq-legend','data-eq-legend':true},h('strong',null,t.eqTitle+' · '+(props.labels.electronics||'')),parts.electronicsPlan(state)?h('ol',null,parts.electronicsPlan(state).knobs.map((k,i)=>h('li',{key:i},(i+1)+'. '+k.functions.map(fn=>controlWords[props.language]?.[fn]||controlWords.en[fn]).join(' / ')+(k.stacked?' · '+t.stacked:'')))):h('p',null,t.eqPending)),
      !rear&&h('p',{className:'rf-preview-note','data-parts-scope':true},t.partsNote),
      !rear&&parts.controlPlan(state).some(v=>v.type!=='knob')&&h('p',{className:'rf-preview-note','data-control-placement':true},t.controlVisibleNote),
      !rear&&h('p',{className:'rf-preview-parts','data-control-plan':true},[parts.controlPlan(state).filter(v=>v.type==='toggle').length? t.coil+' × '+parts.controlPlan(state).filter(v=>v.type==='toggle').length:null,...state.specialOptions.map(id=>id==='kill_switch'?t.kill:id==='dual_tone'?t.dual:t.buffer)].filter(Boolean).join(' · ')),
      !state.g && h('p',{role:'status'},t.noShape),
      state.bridgeFinishFixed && h('p',{className:'rf-preview-note','data-bridge-finish-fixed':true},t.fixedBridge),
      s.inlay_type==='inlay_custom'&&s.inlay_custom_spec==='custom_bindrune'&&state.bindruneExample&&h('p',{className:'rf-preview-parts','data-bindrune-applied':state.bindruneExample},t.runeApplied+' · '+state.bindruneExample.toUpperCase()),
      h('p',{className:'rf-preview-note','data-finger-ramp-deferred':true},t.rampDeferred),
      !missing && h('p',{className:'rf-preview-parts','data-preview-parts':true},rear?rearParts:t.assembly+' · '+props.labels.pickups+' / '+props.labels.hardware_bridge+' / '+props.labels.hardware_machine_head),
      !missing && h('p',{className:'rf-preview-note'},rear?rearNote:isDrawing?t.drawingNote:t.note),
      rear&&!missing && h('p',{className:'rf-preview-note'},t.backFinishNote),
      h('details',{className:'rf-preview-scope'},h('summary',null,t.scope),
        h('p',null,rear?rearNote:isDrawing?t.drawingNote:t.tone),!rear&&h('p',null,isDrawing?t.drawingParts:t.symbols),h('p',null,t.geometry),h('p',null,t.constructionNote),h('p',null,t.controlNote),
        source && h('a',{href:media(source),download:source.split('/').pop()},isDrawing?t.drawingView:t.reference),
        h('dl',null,rows.map(id=>{
          const woodCategory=['body_wood_single','body_core_wood','body_wing_wood','top_wood_selection','fretboard'].includes(id);
          const frontDetails=['coil_switch','control_layout','finger_ramp','fretboard_extense','pickups','pickup_configuration','fretboard','top_type','top_wood_selection','color_headstock','color_top','fret_type','fret_material','fret_size','fret_side','inlay_type','inlay_dot_mat','inlay_dot_pos','inlay_oval_mat','nut_material','knob','extra_finish_flake'];
          const status=state.pending.includes(id)?t.shapePending:id==='hardware_bridge'&&state.bridgeFinishFixed?t.fixedStatus:['neck','neck_finish','body_construction','body_wing_wood','color_back_side'].includes(id)&&!rear?t.rearOnly:rear&&frontDetails.includes(id)?t.frontOnly:['pickups','hardware_bridge','hardware_machine_head','finger_ramp','fretboard_extense','coil_switch','control_layout'].includes(id)?t.proposalStatus:woodCategory&&id!=='fretboard'&&!rear&&(state.finish.opaque||(['body_wood_single','body_core_wood'].includes(id)&&state.hasTop))?t.covered:woodCategory?t.textureStatus:t.detailStatus;
          return h('div',{key:id,'data-preview-category':id,'data-option':s[id]},h('dt',null,props.categoryTitles[id]||id),h('dd',null,props.labels[id],h('small',null,status)));
        })),
        state.pending.length>0 && h('p',{'data-preview-pending':true},t.pending+': '+state.pending.map(id=>props.categoryTitles[id]||id).join(', '))),
      ),
      h('span',{className:'rf-preview-sr','aria-live':'polite','aria-atomic':'true'},t.updated+' · '+props.model+' · '+t[view]+' · '+Object.values(props.labels).join(', '))
    );
  }
  function OvalExample(props) {
    const h=window.React.createElement,t=copy[props.language]||copy.en;
    return h('figure',{className:'rf-oval-example','data-oval-example':true},
      h('div',{dangerouslySetInnerHTML:{__html:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 100" role="img" aria-label="${t.ovalTitle}">${ovalMark([120,50],180,50,0,props.material,'#252e2e')}</svg>`}}),
      h('figcaption',null,h('strong',null,t.ovalTitle),h('p',null,t.ovalNote)));
  }
  function BindruneExamples(props) {
    const h=window.React.createElement,t=copy[props.language]||copy.en;
    return h('section',{className:'rf-bindrune-examples','data-bindrune-examples':true,'aria-label':t.bindruneTitle},
      h('h4',null,t.bindruneTitle),h('p',null,t.bindruneNote),
      h('div',{className:'rf-bindrune-grid'},t.bindruneNames.map((name,i)=>h('button',{type:'button',key:i,'data-bindrune-select':'c'+(i+1),'aria-pressed':props.selected==='c'+(i+1),onClick:()=>props.onSelect('c'+(i+1))},
        h('img',{src:media('assets/configurator-bindrune/c'+(i+1)+'.svg'),alt:'C'+(i+1)+' · '+name}),
        h('span',null,'C'+(i+1)+' · '+name)))),h('small',null,t.bindruneSource),h('a',{href:media('assets/configurator-bindrune/layouts-v5.png'),download:'RavenForge_Bindrune_Layouts_v5.png'},t.bindruneOriginal));
  }
  function ColourControls(props) {
    const h = window.React.createElement, t = copy[props.language] || copy.en, finish = parseColour(props.value);
    const colours = ['', '#9d282b','#275f89','#24262a','#eee8dc','#35624b'];
    const change = colour => props.onChange(colour ? (finish.opaque?'solid ':'transparent ')+colour : '');
    return h('div',{className:'rf-colour-controls'},
      h('p',null,t.colourHelp),
      h('div',{className:'rf-colour-swatches'},colours.map((colour,i)=>h('button',{
        type:'button',key:i,title:t.colourNames[i],'aria-label':t.colourNames[i],'aria-pressed':(finish.colour||'')===colour&&finish.status!=='unmapped',
        style:{background:colour||'#c5a779'},onClick:()=>change(colour),'data-preview-swatch':colour||'natural'
      },i===0?'N':'')),h('label',null,t.colour,h('input',{type:'color',value:finish.colour||'#9d282b',onChange:event=>change(event.target.value),'aria-label':t.colour}))),
      h('div',{className:'rf-colour-modes'},[false,true].map(opaque=>h('button',{type:'button',key:String(opaque),disabled:!finish.colour,'aria-pressed':finish.opaque===opaque,onClick:()=>props.onChange((opaque?'solid ':'transparent ')+finish.colour)},opaque?t.solid:t.transparent)))
    );
  }
  return {configureTestOptions,scene, renderSvg, parseColour, wood, copy, Component, ColourControls, BindruneExamples, OvalExample, PickupExample, pickupStatus, ovalMark};
}));
