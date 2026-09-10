/* Concept Lab renderer. Source entries live in #concept-lab-data; project supplements may be defined here. */
(() => {
  'use strict';

  const supplementalEntries = [
    {
      id: 'gram-superstrat-24f',
      image: 'assets/concepts/gram-superstrat-24f.webp',
      kind: 'concept',
      date: '2026-09-11',
      title: { ko: 'GRAM â€” Heritage, Reforged.', en: 'GRAM â€” Heritage, Reforged.', de: 'GRAM â€” Heritage, Reforged.' },
      description: {
        ko: 'GRAMì€ ê¸°ì¡´ Superstratì˜ ì–¸ì–´ë¥¼ ê·¸ëŒ€ë¡œ ë°˜ë³µí•˜ì§€ ì•Šê³ , RavenForgeì˜ êµ¬ì¡°ì  ê´€ì ìœ¼ë¡œ ë‹¤ì‹œ ë²¼ë¦° 24í”„ë › ê¸°íƒ€ ì»¨ì…‰ìž…ë‹ˆë‹¤. 25.5ì¸ì¹˜ ìŠ¤ì¼€ì¼ê³¼ 24í”„ë ›ì´ë¼ëŠ” ìµìˆ™í•œ ê¸°ì¤€ ìœ„ì— 2í”¼ìŠ¤ ìŠ¤ì›œí”„ ì• ì‰¬ ë°”ë””, 5í”¼ìŠ¤ ë¼ë¯¸ë„¤ì´íŠ¸ ë„¥, í”Œë ˆì´íŠ¸ ì—†ëŠ” 2-2-1 ë°°ì—´ì˜ 5ë³¼íŠ¸ ë”¥ í…Œë„Œ ì¡°ì¸íŠ¸ë¥¼ ê²°í•©í–ˆìŠµë‹ˆë‹¤.\n\në°”ë””ëŠ” 2í”¼ìŠ¤ ìŠ¤ì›œí”„ ì• ì‰¬ì˜ ê²°ì„ ê°ì¶”ì§€ ì•ŠëŠ” grain-filled Inferno Red ë§ˆê°ìœ¼ë¡œ ê³„íší•˜ê³ , AAAê¸‰ ì¸ë””ì•ˆ ë¡œì¦ˆìš°ë“œ ì§€íŒì—ëŠ” ì „ë©´ ì¸ë ˆì´ë¥¼ ë‘ì§€ ì•ŠìŠµë‹ˆë‹¤. ë„¥ì€ Northern Hard Maple ì™¸ì¸¡ ìœ™, Wenge ìŠ¤íŠ¸ë¼ì´í”„, Purpleheart ì½”ì–´ì˜ 5í”¼ìŠ¤ êµ¬ì¡°ì´ë©° í›„ë©´ ì—­ì‹œ íˆ¬ëª… ë ˆë“œë¡œ ë§ˆê°í•´ ë¼ë¯¸ë„¤ì´íŠ¸ë¥¼ ë“œëŸ¬ëƒ…ë‹ˆë‹¤.\n\nì „ìžê³„ëŠ” Lundgren M6 ì˜¤í”ˆì½”ì¼ í—˜ë²„ì»¤ 2ê°œ, 1 Volume / 1 Tone / 5-way bladeë¥¼ ê¸°ë³¸ìœ¼ë¡œ í•˜ë©° CTS 500 kÎ© D-curve í¬íŠ¸ì™€ Zuta Core ì ìš©ì„ ê³„íší•˜ê³  ìžˆìŠµë‹ˆë‹¤. ê³µê°œ ì´ë¯¸ì§€ëŠ” ì»¨ì…‰ ì‹œê°í™”ì´ë©°, ì œìž‘ ì „ CAD ê²€ì¦ê³¼ í•˜ë“œì›¨ì–´ ì‹¤ì¸¡ì— ë”°ë¼ ì„¸ë¶€ ì‚¬ì–‘ì€ ì¡°ì •ë  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.',
        en: 'GRAM is a 24-fret guitar concept that reforges the familiar Superstrat language through RavenForgeâ€™s structural approach rather than simply repeating it. A conventional 25.5-inch scale and 24-fret layout are paired with a two-piece swamp-ash body, a five-piece laminated neck, and a plate-less 2-2-1 five-bolt deep-tenon joint.\n\nThe body is planned in grain-filled Inferno Red that keeps the two-piece swamp-ash grain visible. The AAA-grade Indian rosewood fingerboard carries no face inlays. The neck combines Northern Hard Maple outer wings, Wenge stripes, and a Purpleheart core, with a transparent red rear finish that leaves the lamination visually legible.\n\nElectronics center on two open-coil Lundgren M6 humbuckers with 1 Volume / 1 Tone / 5-way blade control, CTS 500 kÎ© D-curve pots, and planned Zuta Core integration. The published image is a concept visualization; final details remain subject to CAD validation and measured hardware clearances before construction.',
        de: 'GRAM ist ein 24-bÃ¼ndiges Gitarrenkonzept, das die vertraute Sprache der Superstrat nicht bloÃŸ wiederholt, sondern aus der konstruktiven Perspektive von RavenForge neu schmiedet. Eine klassische 25,5-Zoll-Mensur mit 24 BÃ¼nden wird mit einem zweiteiligen Swamp-Ash-Korpus, einem fÃ¼nfteilig laminierten Hals und einer plattenlosen 2-2-1-FÃ¼nfschraubenverbindung mit tiefem Zapfen kombiniert.\n\nDer Korpus ist in einem porenfÃ¼llenden Inferno-Red-Finish geplant, das die Maserung der zweiteiligen Swamp Ash sichtbar lÃ¤sst. Das Griffbrett aus AAA Indian Rosewood bleibt ohne Einlagen auf der Vorderseite. Der Hals besteht aus Ã¤uÃŸeren Northern-Hard-Maple-FlÃ¼geln, Wenge-Streifen und einem Purpleheart-Kern; eine transparente rote RÃ¼ckseitenlackierung lÃ¤sst die Laminierung weiterhin erkennen.\n\nDie Elektronik basiert auf zwei offenen Lundgren-M6-Humbuckern mit 1 Volume / 1 Tone / 5-Wege-Klingenschalter, CTS-500-kÎ©-Potis mit D-Kennlinie und geplanter Zuta-Core-Integration. Die verÃ¶ffentlichte Darstellung ist eine Konzeptvisualisierung; Details kÃ¶nnen sich nach CAD-PrÃ¼fung und realer Hardwarevermessung vor dem Bau noch Ã¤ndern.'
      },
      alt: {
        ko: 'Inferno Red ê·¸ë ˆì¸í•„ 2í”¼ìŠ¤ ìŠ¤ì›œí”„ ì• ì‰¬ ë°”ë””, ê³¨ë“œ í•˜ë“œì›¨ì–´, ë¸”ëž™ í”½ê°€ë“œì™€ Lundgren M6 ë‘ ê°œë¥¼ ì ìš©í•œ RavenForge GRAM Superstrat 24F ì»¨ì…‰ ë³´ë“œ',
        en: 'RavenForge GRAM Superstrat 24F concept board with grain-filled Inferno Red two-piece swamp ash, gold hardware, black pickguard, and two Lundgren M6 pickups',
        de: 'Konzepttafel der RavenForge GRAM Superstrat 24F mit zweiteiliger Swamp Ash in porengefÃ¼lltem Inferno Red, goldener Hardware, schwarzem Pickguard und zwei Lundgren-M6-Tonabnehmern'
      },
      specifications: [
        { label: {ko:'ëª¨ë¸',en:'Model',de:'Modell'}, value: 'RavenForge GRAM â€” Superstrat 24F' },
        { label: {ko:'ìŠ¤ì¼€ì¼',en:'Scale length',de:'Mensur'}, value: '25.5â€³ / 648 mm' },
        { label: {ko:'í”„ë ›',en:'Frets',de:'BÃ¼nde'}, value: {ko:'24 / Extra Jumbo / 18% ë‹ˆì¼ˆì‹¤ë²„',en:'24 / Extra Jumbo / 18% Nickel-Silver',de:'24 / Extra Jumbo / 18 % Neusilber'} },
        { label: {ko:'ë°”ë””',en:'Body',de:'Korpus'}, value: {ko:'2í”¼ìŠ¤ Solid Swamp Ash / Center-jointed',en:'2-piece solid Swamp Ash / center-jointed',de:'Zweiteilige massive Swamp Ash / mittig verleimt'} },
        { label: {ko:'ë°”ë”” ë‘ê»˜',en:'Body thickness',de:'KorpusstÃ¤rke'}, value: '45.0 mm' },
        { label: {ko:'ë°”ë”” ì»¨íˆ¬ì–´',en:'Body contours',de:'Korpuskonturen'}, value: {ko:'Forearm bevel / Rear tummy cut / Sculpted heel trim-cut',en:'Forearm bevel / rear tummy cut / sculpted heel trim-cut',de:'Unterarmfase / rÃ¼ckseitige Bauchkontur / geformter Heel-Trim-Cut'} },
        { label: {ko:'ë§ˆê°',en:'Finish',de:'Finish'}, value: {ko:'Transparent Inferno Red / Grain-filled / High gloss',en:'Transparent Inferno Red / grain-filled / high gloss',de:'Transparent Inferno Red / porengefÃ¼llt / Hochglanz'} },
        { label: {ko:'ë„¥',en:'Neck',de:'Hals'}, value: {ko:'5í”¼ìŠ¤ Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple',en:'5-piece Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple',de:'5-teilig Northern Hard Maple / Wenge / Purpleheart / Wenge / Northern Hard Maple'} },
        { label: {ko:'ë„¥ ë§ˆê°',en:'Neck finish',de:'Halsfinish'}, value: {ko:'Transparent Inferno Red / ë¼ë¯¸ë„¤ì´íŠ¸ ë…¸ì¶œ',en:'Transparent Inferno Red / lamination visible',de:'Transparent Inferno Red / Laminierung sichtbar'} },
        { label: {ko:'ë„¥ ì¡°ì¸íŠ¸',en:'Neck joint',de:'Halsverbindung'}, value: {ko:'Extended bolt-on deep tenon / 5ë³¼íŠ¸ 2-2-1 / í”Œë ˆì´íŠ¸ ì—†ìŒ / ì¸ì„œíŠ¸ ì²´ê²°',en:'Extended bolt-on deep tenon / 5-bolt 2-2-1 / no neck plate / threaded inserts',de:'VerlÃ¤ngerter Bolt-on Deep Tenon / 5 Schrauben 2-2-1 / ohne Halsplatte / GewindeeinsÃ¤tze'} },
        { label: {ko:'ì§€íŒ',en:'Fingerboard',de:'Griffbrett'}, value: {ko:'AAA Indian Rosewood / 16â€³ / ì „ë©´ ì¸ë ˆì´ ì—†ìŒ',en:'AAA Indian Rosewood / 16â€³ / no face inlays',de:'AAA Indian Rosewood / 16â€³ / ohne Front-Inlays'} },
        { label: {ko:'ë„ˆíŠ¸',en:'Nut',de:'Sattel'}, value: '43.0 mm Buffalo Bone' },
        { label: {ko:'í”½ì—…',en:'Pickups',de:'Tonabnehmer'}, value: 'Lundgren M6 Neck + Bridge / black open-coil' },
        { label: {ko:'ì»¨íŠ¸ë¡¤',en:'Controls',de:'Bedienung'}, value: '1 Volume / 1 Tone / 5-way blade' },
        { label: {ko:'í¬íŠ¸',en:'Pots',de:'Potis'}, value: 'CTS 500 kÎ© D-curve' },
        { label: {ko:'í†¤ ìºíŒ¨ì‹œí„°',en:'Tone capacitor',de:'Ton-Kondensator'}, value: '0.022 ÂµF' },
        { label: {ko:'ì „ìžê³„',en:'Planned electronics',de:'Geplante Elektronik'}, value: 'Zuta Core' },
        { label: {ko:'ë¸Œë¦¬ì§€',en:'Bridge',de:'BrÃ¼cke'}, value: 'Gotoh 510T-FE1 Gold / right-hand / 42 mm block' },
        { label: {ko:'íŠœë„ˆ',en:'Tuners',de:'Mechaniken'}, value: 'Gotoh SG381-07-MGT Gold / 6-in-line / staggered' },
        { label: {ko:'í”½ê°€ë“œ',en:'Pickguard',de:'Pickguard'}, value: {ko:'xí”¼ë¦¬ ë¸”ëž™ B/W/B / ì•½ 2.3 mm',en:'3-ply black B/W/B / approx. 2.3 mm',de:'3-lagig Schwarz B/W/B / ca. 2.3 mm'} },
        { label: {ko:'ì•„ì›ƒí‘¬ìˆ˜ ìž«',en:'Output jack',de:'Ausgangsbuchse'}, value: {ko:'Recessed Strat-type top jack / Gold',en:'Recessed Strat-type top jack / Gold',de:'Versenkte Strat-Art-Buchse / Gold'} },
        { label: {ko:'íŠ¸ëž© ë˜ í•˜ë“œì›¨ì–´',en:'Strap Hardware',de:'Gurthardware'}, value: 'Schaller S-Lock / Gold' }
      ]
    }
  ];

  const copy = {
    en: { count:n=>`${n} ${n===1?'entry':'entries'}`, sketch:'Sketch', concept:'Concept art', study:'Form study', open:'View artwork', close:'Close', imageError:'This image could not be loaded.', dataError:'The concept archive could not be loaded.', specifications:'Provisional specifications', item:'Item', specification:'Concept specification' },
    de: { count:n=>`${n} ${n===1?'Eintrag':'EintrÃ¤ge'}`, sketch:'Skizze', concept:'Konzeptkunst', study:'Formstudie', open:'Bild ansehen', close:'SchlieÃŸen', imageError:'Dieses Bild konnte nicht geladen werden.', dataError:'Das Konzeptarchiv konnte nicht geladen werden.', specifications:'VorlÃ¤ufige Spezifikationen', item:'Merkmal', specification:'Konzeptspezifikation' },
    ko: { count:n=>`${n}ê°œì˜ ê¸°ë¡`, sketch:'lŠ¤ì¹€ì¹˜', concept:'ì»¨ì!¬ ì•„íŠ¸', study:'í˜•ìƒœ ì—°êµ¬ ', open:'ì´ë¯¸ì§€ í°ê²Œ ë³´ê¸°', close:'ë‹¤ê¸°', imageError:'ì´ë¯¸ì§€ë¥¼ ë¶ˆëŸ¬ì˜¤ì§€ ë®»í–ˆìŠµë‹ˆë‹¤.', dataError:'ì»¨ì!¬ ëª©ë¡ì„ ë¶ˆëŸ¬ì˜¤ì§€ ë®»í–ˆìŠµë‹ˆë‹¤.', specifications:'ìž ì • ì‚¬ì–“', item:'ÉËÜXÚYšXØ][ÛŽ‰ú­k; àH; «;%¤IÈBˆNÂˆÛÛœÝ^J‹
OO\[ÙˆOOIÜÝš[™ÉÏÝŽË–Û_Ë™[ŸËšÛßË™_	ÉÎÂˆÛÛœÝ[XYÙU\›]OžÈYŠ\[ÙˆˆOOIÜÝš[™Éß]‹š[J
JH™]\›ˆ[Èž^ÈÛÛœÝO[™]ÈT“
‹ØÝ[Y[˜˜\ÙUT’JNÈ™]\›ˆÉÚ‰Ë	ÚÎÉ×Kš[˜ÛY\ÊKœ›ÝØÛÛ
OÝKš™YŽ›[ÈXØ]ÚÜ™]\›ˆ[ßHNÂ‚ˆ[˜Ý[Ûˆ[š]

^ÂˆÛÛœÝØ[\žOYØÝ[Y[™Ù][[Y[žRY
	ØÛÛ˜Ù\YØ[\žIÊK[\OYØÝ[Y[™Ù][[Y[žRY
	ØÛÛ˜Ù\Y[\IÊKÛÝ[YØÝ[Y[™Ù][[Y[žRY
	ØÛÛ˜Ù\XÛÝ[	ÊKÛÝ\˜ÙOYØÝ[Y[™Ù][[Y[žRY
	ØÛÛ˜Ù\[X‹Y]IÊNÂˆYŠYØ[\ž_Y[\_XÛÝ[\ÛÝ\˜ÙJH™]\›ŽÂˆ][šY\ÏV×K[˜[YY˜[ÙKÙ[XÝY[[šYÙÙ\[[ÛÝ™\™›ÝÏIÉÎÂˆž^Âˆ[šY\ÏR”ÓÓ‹œ\œÙJÛÝ\˜ÙK^ÛÛ[
NÂˆYŠP\œ˜^Kš\Ð\œ˜^J[šY\ÊJH›ÝÈ™]È\œ›ÜŠ	Ò[˜[YÛÛ˜Ù\™XÛÜ™	ÊNÂˆ[šY\ÏVË‹‹™[šY\Ë‹‹œÝ\[Y[[[šY\×NÂˆYŠ[šY\ËœÛÛYJOOˆY_Z[XYÙU\›
Kš[XYÙJ_]^
K]K	Ù[‰ÊJJH›ÝÈ™]È\œ›ÜŠ	Ò[˜[YÛÛ˜Ù\™XÛÜ™	ÊNÂˆXØ]ÚÈ[˜[Y]YNÈ[šY\ÏV×NÈBˆÛÛœÝ[™ÏJ
OO˜ÛÜVÙØÝ[Y[™ØÝ[Y[[[Y[›[™×OÙØÝ[Y[™ØÝ[Y[[[Y[›[™Î‰Ù[‰ÎÂ‚ˆÛÛœÝX[ÙÏYØÝ[Y[˜Ü™X]Q[[Y[
	ÙX[ÙÉÊNÈX[ÙË˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\YX[ÙÉÎÈX[ÙËœÙ]]šX]J	Ø\šXK[X™[YžIË	ØÛÛ˜Ù\YX[ÙË]]IÊNÂˆÛÛœÝXY\YØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÈXY\‹˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\YX[ÙËZXY\‰ÎÂˆÛÛœÝ]OYØÝ[Y[˜Ü™X]Q[[Y[
	ÚÉÊNÈ]KšYIØÛÛ˜Ù\YX[ÙË]]IÎÂˆÛÛœÝÛÜÙOYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNÈÛÜÙK\OIØ]Û‰ÎÈÛÜÙK˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO™X[ÙË˜ÛÜÙJ
JNÈXY\‹˜\[™
]KÛÜÙJNÂˆÛÛœÝšYÝ\™OYØÝ[Y[˜Ü™X]Q[[Y[
	ÙšYÝ\™IÊK[YÏYØÝ[Y[˜Ü™X]Q[[Y[
	Ú[YÉÊK[XYÙQ\œ›ÜYØÝ[Y[˜Ü™X]Q[[Y[
	Ü	ÊKØ\[ÛYØÝ[Y[˜Ü™X]Q[[Y[
	ÙšYØØ\[Û‰ÊNÂˆ[XYÙQ\œ›Ü‹˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\Z[XYÙKY\œ›Ü‰ÎÈ[XYÙQ\œ›Ü‹šY[]YNÈ[XYÙQ\œ›Ü‹œÙ]]šX]J	Ü›ÛIË	ÜÝ]\ÉÊNÂˆ[YË˜Y]™[\Ý[™\Š	Ù\œ›Ü‰Ë

OOžÚ[YËšY[]YNÚ[XYÙQ\œ›Ü‹šY[Y˜[ÙNßJNÈšYÝ\™K˜\[™
[YË[XYÙQ\œ›Ü‹Ø\[ÛŠNÈX[ÙË˜\[™
XY\‹šYÝ\™JNÈØÝ[Y[˜›ÙK˜\[™
X[ÙÊNÂˆX[ÙË˜Y]™[\Ý[™\Š	ØÛXÚÉËOOžÚYŠK\™Ù]OOYX[ÙÊYX[ÙË˜ÛÜÙJ
NßJNÈX[ÙË˜Y]™[\Ý[™\Š	ØÛÜÙIË

OOžÙØÝ[Y[˜›ÙKœÝ[K›Ý™\™›ÝÏ[ÛÝ™\™›ÝÎÜÙ[XÝY[[ÚYŠšYÙÙ\Ëš\ÐÛÛ›™XÝY
]šYÙÙ\‹™›ØÝ\Ê
NßJNÂˆÚ[™ÝË˜Y]™[\Ý[™\Š	ÜÜÝ]IË

OOžÚYŠX[ÙË›Ü[ŠYX[ÙË˜ÛÜÙJ
NßJNÈÚ[™ÝË˜Y]™[\Ý[™\Š	Ú\ÚÚ[™ÙIË

OOžÚYŠX[ÙË›Ü[ŠYX[ÙË˜ÛÜÙJ
NßJNÂˆ[˜Ý[Ûˆ™[™\‘X[ÙÊ
^ÈYŠ\Ù[XÝY
\™]\›ŽÈ]K^ÛÛ[]^
Ù[XÝY]K[™Ê
JNÈØ\[Û‹^ÛÛ[]^
Ù[XÝY™\ØÜš\[Û‹[™Ê
JNÈØ\[Û‹šY[HXØ\[Û‹^ÛÛ[È[YË˜[]^
Ù[XÝY˜[[™Ê
J_^
Ù[XÝY]K[™Ê
JNÈÛÜÙK^ÛÛ[XÛÜVÛ[™Ê
WK˜ÛÜÙNÈ[XYÙQ\œ›Ü‹^ÛÛ[XÛÜVÛ[™Ê
WKš[XYÙQ\œ›ÜŽÈBˆ[˜Ý[ÛˆÜ[Š[žK]ÛŠ^ÈÙ[XÝYY[žNÝšYÙÙ\X]ÛŽÚ[YËšY[Y˜[ÙNÚ[XYÙQ\œ›Ü‹šY[]YNÚ[YËœÜ˜ÏZ[XYÙU\›
[žKš[XYÙJNÜ™[™\‘X[ÙÊ
NÛÛÝ™\™›ÝÏYØÝ[Y[˜›ÙKœÝ[K›Ý™\™›ÝÎÙX[ÙËœÚÝÓ[Ù[

NÙØÝ[Y[˜›ÙKœÝ[K›Ý™\™›ÝÏIÚY[‰ÎÈBˆ[˜Ý[Ûˆ™[™\Š
^ÂˆÛÛœÝÝ\œ™[[[™Ê
KXÛÜVØÝ\œ™[NÈÛÝ[^ÛÛ[Z[˜[YÝ™]Q\œ›ÜŽ˜ÛÝ[
[šY\Ë›[™Ý
NÈ[\KšY[Z[˜[Y[šY\Ë›[™ÝŒÈØ[\žKœ™\XÙPÚ[™[Š
NÂˆ[šY\Ë™›Ü‘XXÚ
[žOOžÂˆÛÛœÝ\XÛOYØÝ[Y[˜Ü™X]Q[[Y[
	Ø\XÛIÊNØ\XÛK˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\XØ\™	ÎÈÛÛœÝ]ÛYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNØ]Û‹˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\Z[XYÙKX]Û‰ÎØ]Û‹\OIØ]Û‰ÎØ]Û‹œÙ]]šX]J	Ø\šXK[X™[	Ë	Ý›Ü[ŸNˆ	Ý^
[žK]KÝ\œ™[
_X
NØ]Û‹˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO›Ü[Š[žK]ÛŠJNÂˆÛÛœÝ[XYÙOYØÝ[Y[˜Ü™X]Q[[Y[
	Ú[YÉÊNÚ[XYÙK˜[]^
[žK˜[Ý\œ™[
_^
[žK]KÝ\œ™[
NÚ[XYÙK›ØY[™ÏIÛ^žIÎÚ[XYÙK™XÛÙ[™ÏIØ\Þ[˜ÉÎÚ[XYÙKœÜ˜ÏZ[XYÙU\›
[žKš[XYÙJNÚ[XYÙK˜Y]™[\Ý[™\Š	Ù\œ›Ü‰Ë

OOžÚ[XYÙKšY[]YNØÛÛœÝ\œYØÝ[Y[˜Ü™X]Q[[Y[
	Ü	ÊNÙ\œ‹˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\Z[XYÙKY\œ›Ü‰ÎÙ\œ‹^ÛÛ[]š[XYÙQ\œ›ÜŽØ]Û‹˜\[™
\œŠNßKÛÛ˜ÙNY_JNØ]Û‹˜\[™
[XYÙJNÂˆÛÛœÝY]OYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÛY]K˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\XØ\™[Y]IÎØÛÛœÝÚ[™YØÝ[Y[˜Ü™X]Q[[Y[
	ÜÜ[‰ÊNÚÚ[™^ÛÛ[VÉÜÚÙ]Ú	Ë	ØÛÛ˜Ù\	Ë	ÜÝYI×Kš[˜ÛY\Ê[žKšÚ[™
OÝÙ[žKšÚ[™N˜ÛÛ˜Ù\ÛY]K˜\[™
Ú[™
NÂˆYŠ\[Ùˆ[žK™]OOOIÜÝš[™ÉÉ‰‹×—ÍKWÌŸKWÌŸIË\Ý
[žK™]JJ^ØÛÛœÝ\œÙY[™]È]J	Ù[žK™]_UŒŒ˜
NÚYŠS[X™\‹š\Ó˜SŠ\œÙY˜[YSÙŠ
JI‰œ\œÙYÒTÓÔÝš[™Ê
KœÛXÙJL
OOOY[žK™]J^ØÛÛœÝ]OYØÝ[Y[˜Ü™X]Q[[Y[
	Ý[YIÊNÙ]K™]U[YOY[žK™]NÙ]K^ÛÛ[[™]È[‘]U[YQ›Ü›X]
Ý\œ™[ÞYX\Ž‰Û[Y\šXÉË[Û‰ÜÚÜ	Ë^N‰Û[Y\šXÉË[YV›Û™N‰ÕUÉßJK™›Ü›X]
\œÙY
NÛY]K˜\[™
]JNß_BˆÛÛœÝXY[™ÏYØÝ[Y[˜Ü™X]Q[[Y[
	ÚÉÊNÚXY[™Ë^ÛÛ[]^
[žK]KÝ\œ™[
NØÛÛœÝÛÛ[YØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNØÛÛ[˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\XØ\™XÛÜIÎØÛÛ[˜\[™
Y]KXY[™ÊNØÛÛœÝ\ØÜš\[Û]^
[žK™\ØÜš\[Û‹Ý\œ™[
NÚYŠ\ØÜš\[ÛŠ^ØÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ü	ÊNÜ˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\XØ\™Y\ØÜš\[Û‰ÎÜ^ÛÛ[Y\ØÜš\[ÛŽØÛÛ[˜\[™

NßX\XÛK˜\[™
]Û‹ÛÛ[
NÂˆYŠ\œ˜^Kš\Ð\œ˜^J[žKœÜXÚYšXØ][ÛœÊI‰™[žKœÜXÚYšXØ][ÛœË›[™Ý
^ØÛÛœÝ›ÞYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNØ›Þ˜Û\ÜÓ˜[YOIÜ™‹XÛÛ˜Ù\\ÜXÚYšXØ][ÛœÉÎØÛÛœÝX›OYØÝ[Y[˜Ü™X]Q[[Y[
	ÝX›IÊKØ\YØÝ[Y[˜Ü™X]Q[[Y[
	ØØ\[Û‰ÊNØØ\^ÛÛ[X	Ý^
[žK]KÝ\œ™[
_H0­È	ÝœÜXÚYšXØ][ÛœßXØÛÛœÝXYYØÝ[Y[˜Ü™X]Q[[Y[
	ÝXY	ÊKYØÝ[Y[˜Ü™X]Q[[Y[
	Ý‰ÊNÖÝš][KœÜXÚYšXØ][Û—K™›Ü‘XXÚ
X™[OžØÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ý	ÊNÝœØÛÜOIØÛÛ	ÎÝ^ÛÛ[[X™[Ú‹˜\[™

NßJNÝXY˜\[™
ŠNØÛÛœÝ›ÙOYØÝ[Y[˜Ü™X]Q[[Y[
	Ý›ÙIÊNÙ[žKœÜXÚYšXØ][ÛœË™›Ü‘XXÚ
ÜXÏOžØÛÛœÝX™[]^
ÜXÏË›X™[Ý\œ™[
K˜[YO]^
ÜXÏË˜[YKÝ\œ™[
NÚYŠ[X™[]˜[YJ\™]\›ŽØÛÛœÝ›ÝÏYØÝ[Y[˜Ü™X]Q[[Y[
	Ý‰ÊK˜[YOYØÝ[Y[˜Ü™X]Q[[Y[
	Ý	ÊK]Z[YØÝ[Y[˜Ü™X]Q[[Y[
	Ý	ÊNÛ˜[YKœØÛÜOIÜ›ÝÉÎÛ˜[YK^ÛÛ[[X™[Ù]Z[^ÛÛ[]˜[YNÜ›ÝË˜\[™
˜[YK]Z[
NÝ›ÙK˜\[™
›ÝÊNßJNÝX›K˜\[™
Ø\XY›ÙJNØ›Þ˜\[™
X›JNØ\XÛK˜\[™
›Þ
NßBˆØ[\žK˜\[™
\XÛJNÂˆJNÈ™[™\‘X[ÙÊ
NÂˆBˆ™]È]]][Û“ØœÙ\™\Š™[™\ŠK›ØœÙ\™JØÝ[Y[™ØÝ[Y[[[Y[Ø]šX]\ÎYK]šX]Qš[\Ž–ÉÛ[™É×_JNÈ™[™\Š
NÂˆBˆYŠØÝ[Y[œ™XYTÝ]OOOIÛØY[™ÉÊYØÝ[Y[˜Y]™[\Ý[™\Š	ÑÓPÛÛ[ØYY	Ë[š]
NÙ[ÙH[š]

NÂŸJJ
NÂ