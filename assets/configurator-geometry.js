/* Masks over the unchanged RavenForge sample renders. Display coordinates, never machining data.
 * Provenance and deliberately unrendered details: docs/CONFIGURATOR_PREVIEW.md. */
(function (root, factory) {
  const drawing = typeof module === 'object' && module.exports ? require('./configurator-gramr-geometry.js') : root.RavenForgeGramrDrawing;
  const rear = typeof module === 'object' && module.exports ? require('./configurator-bass-rear-geometry.js') : root.RavenForgeBassRear;
  const front = typeof module === 'object' && module.exports ? require('./configurator-bass-front-geometry.js') : root.RavenForgeBassFront;
  const api = factory(drawing,rear,front);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgeGeometry = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (drawing,rear,front) {
  'use strict';
  const models = {
    EDDA: {
      source: 'Edda Prototype Design.png', status: 'prototype', strings: 4,
      back: {kind:'rear-concept',source:'assets/configurator-rear/edda-rear-bolton-v6.webp',status:'illustrative-bolt-on',bolts:5},
      imageSize: [1080,1080], luminance: [.30,.59,.11], exposure: 1.7,
      portrait: { full:'300 0 480 1090', body:'350 540 380 540', neck:'490 180 100 610', head:'460 10 145 200' },
      hardware: 'M485 986 L585 982 L588 1040 L486 1041 Z',
      // Visible pickguard traced from the owned EDDA sample: neck pocket,
      // treble horn and control-side scallop. Display reference, not a CNC outline.
      pickguard: 'M507 707 C494 740 478 776 466 810 C455 837 451 854 460 873 C468 890 487 896 511 896 L568 897 Q595 893 613 907 C605 895 608 881 620 874 Q635 865 650 874 L640 846 Q627 817 636 785 L650 745 Q661 719 650 704 C647 728 635 750 613 757 Q579 769 562 744 L564 768 L504 768 Z',
      pickguardProvenance: {kind:'sample-contour',source:'Edda Prototype Design.png',status:'visual-reference-not-machining',optional:true},
      tunerMask: 'M510 47 L520 49 L526 59 L520 69 L511 75 L499 65 L499 59 Z M519 58 L536 62 L534 69 L519 66 Z M499 87 L509 85 L518 91 L517 98 L508 102 L499 99 L489 94 Z M511 91 L534 95 L532 101 L512 98 Z M486 126 Q486 120 499 122 L521 127 L521 133 L497 133 L488 132 Z M481 146 L490 144 L502 151 L504 164 L497 174 L484 173 L472 164 L474 153 Z M496 153 L524 157 L523 164 L498 162 Z',
      transform: 'translate(25 780) rotate(-90)',
      views: { full: '0 0 1120 460', body: '565 55 540 390', neck: '170 175 640 160', head: '35 175 220 170' },
      body: 'M566.768 658.664 Q539.0 639.44 510.52 660.8 Q473.496 688.568 451.424 596.72 Q449.288 549.728 434.336 556.848 C411.552 558.272 396.6 586.04 406.568 633.032 C412.264 667.92 432.2 703.52 439.32 740.544 C449.288 793.944 412.976 845.208 389.48 895.048 C368.832 940.616 378.088 991.88 427.216 1022.496 C471.36 1053.824 606.64 1075.184 667.16 1023.92 C721.272 979.776 701.336 916.408 680.688 875.112 C658.616 828.12 635.12 796.08 652.92 751.224 C675.704 724.88 674.28 692.84 661.464 682.16 C643.664 664.36 637.256 698.536 618.744 719.896 Q585.992 753.36 566.768 719.896 Z',
      head: 'M521 195 L497 174 L507 119 L529 36 Q539 13 551 30 L575 66 L568 118 L584 157 L562 177 L557 195 Z',
      board: [[521,198],[557,198],[564,768],[504,768]],
      bridge: [[501,995],[574,995]],
      pickups: [{x:490,y:805,w:100,h:49},{x:489,y:909,w:101,h:49}],
      controls: [[637,892],[654,925],[657,959],[642,993]],
      frontRegistration: {source:'edda-rear-bolton-v6.webp',kind:'mirrored-concept',scale:.712,axis:525,nutY:275,frontNut:[539,198],status:'visual-reference-not-machining'},
      bodyCenter: 539
    },
    EMBLA: {
      source: 'EMBLA Prototype Design.png', status: 'prototype', strings: 5,
      back: rear.EMBLA,
      imageSize: [1254,1254], luminance: [.05,.45,.50], exposure: 1.25,
      portrait: { full:'340 15 560 1160', body:'365 530 510 640', neck:'535 130 150 650', head:'530 25 200 135' },
      hardware: 'M529 987 L685 989 L683 1062 L520 1060 Z',
      tunerMask: 'M572 66 Q583 71 591 69 L601 75 L601 85 L590 87 Q578 84 569 90 Q565 78 572 66 Z M556 92 Q568 98 581 94 L596 99 L595 108 L579 109 Q564 105 552 114 Q546 103 556 92 Z M551 116 Q563 123 578 117 L592 121 L591 130 L577 131 Q561 126 550 135 Q542 126 551 116 Z M660 81 L676 82 Q687 82 694 75 Q702 79 701 99 Q689 92 676 93 L662 93 Z M662 103 L679 103 Q695 105 704 98 Q712 103 710 115 Q698 110 682 115 L663 116 Z M670 123 L687 125 Q703 124 710 118 Q716 125 713 139 Q704 133 690 133 L671 135 Z',
      transform: 'translate(10 870) rotate(-90)',
      views: { full: '0 0 1160 510', body: '555 5 595 500', neck: '135 175 680 180', head: '35 160 175 200' },
      body: 'M561 677 C521 694 479 643 473 579 C471 550 466 550 454 559 C418 584 441 645 455 690 C468 734 476 771 458 810 C439 853 413 889 402 929 C385 991 409 1047 470 1080 C548 1121 699 1124 767 1095 C823 1071 845 1036 824 984 C803 932 769 890 756 846 C743 811 754 783 769 752 C780 726 781 707 772 700 C757 687 753 705 741 727 C721 768 688 766 660 739 Z',
      head: 'M602 139 L581 130 L594 96 L602 55 Q622 33 652 53 L663 83 L682 124 L657 140 Z',
      board: [[602,142],[656,142],[666,751],[560,751]],
      bridge: [[540,1035],[672,1035]],
      pickups: [{x:530,y:850,w:155,h:42},{x:528,y:910,w:157,h:43}],
      controls: [[752,897],[774,936],[799,979],[792,1026],[747,1060]], bodyCenter: 611
    },
    ASKR: {
      source: 'ASKR Prototype Design.png', status: 'prototype', strings: 5,
      back: rear.ASKR,
      imageSize: [1254,1254], luminance: [.85,.10,.05], exposure: 1.1,
      portrait: { full:'395 20 450 1145', body:'445 580 360 565', neck:'575 170 100 685', head:'555 35 140 165' },
      hardware: 'M577 1043 L657 1005 L675 1011 L675 1062 L594 1097 L578 1083 Z',
      tunerMask: 'M575 88 Q582 94 590 89 L602 91 L600 102 L588 102 Q577 99 571 106 Q566 97 575 88 Z M566 115 Q576 122 585 117 L595 120 L593 130 L583 132 Q572 128 566 138 Q560 129 566 115 Z M656 99 L667 100 Q675 100 679 94 Q683 106 680 119 Q673 114 664 116 L660 115 Z M664 130 L676 131 Q682 131 686 125 Q690 139 686 152 Q679 145 667 147 Z',
      transform: 'translate(10 860) rotate(-90)',
      views: { full: '0 0 1160 440', body: '585 55 555 350', neck: '165 160 710 170', head: '40 165 185 160' },
      body: 'M590 766 C555 767 521 733 530 648 L535 612 C508 638 490 684 498 714 C505 754 528 792 531 835 C529 883 485 933 480 984 C474 1045 506 1092 565 1112 C622 1133 707 1126 745 1094 C796 1054 786 1013 758 966 C725 912 714 895 729 847 C738 815 752 794 768 783 C739 782 720 805 699 812 C676 818 664 807 659 789 Z',
      head: 'M607 182 L585 166 L597 127 L601 53 Q599 43 615 49 L654 69 L658 124 L669 167 L645 183 Z',
      board: [[606,184],[644,184],[658,814],[593,840]],
      bridge: [[587,1070],[668,1030]],
      pickups: [{x:575,y:872,w:103,h:43,angle:-10},{x:574,y:941,w:105,h:43,angle:-10}],
      controls: [[728,975],[706,1010],[750,1013],[733,1046]], bodyCenter: 625
    },
    GRAMR: drawing
  };
  for (const model of ['ASKR','EMBLA']) Object.assign(models[model],front[model],{sampleSource:models[model].source});
  return models;
}));
