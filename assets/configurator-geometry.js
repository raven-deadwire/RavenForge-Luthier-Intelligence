/* Masks over the unchanged RavenForge sample renders. Display coordinates, never machining data.
 * Provenance and deliberately unrendered details: docs/CONFIGURATOR_PREVIEW.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RavenForgeGeometry = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
    EDDA: {
      source: 'assets/optimized/edda-prototype.webp', status: 'prototype', strings: 4,
      imageSize: [1080,1080], luminance: [.30,.59,.11], exposure: 1.7,
      portrait: { full:'300 0 480 1090', body:'350 540 380 540', neck:'490 180 100 610', head:'460 10 145 200' },
      hardware: 'M485 986 L585 982 L588 1040 L486 1041 Z',
      tunerMask: 'M495 44 L527 42 L529 74 L500 78 Z M489 83 L518 82 L519 106 L488 107 Z M478 117 L508 117 L509 139 L478 141 Z M468 144 L500 141 L504 174 L477 176 Z',
      transform: 'translate(25 780) rotate(-90)',
      views: { full: '0 0 1120 460', body: '565 55 540 390', neck: '170 175 640 160', head: '35 175 220 170' },
      body: 'M507 674 C486 708 448 675 447 602 C446 572 443 563 434 567 C402 580 412 632 421 671 C436 720 443 763 431 803 C418 851 390 894 381 941 C366 1019 426 1048 505 1055 C586 1060 652 1041 675 1009 C712 962 686 904 666 857 C645 811 637 787 652 754 C664 723 665 696 651 687 C640 682 640 707 629 729 C611 768 574 755 562 731 L560 712 Z',
      head: 'M521 195 L497 174 L507 119 L529 36 Q539 13 551 30 L575 66 L568 118 L584 157 L562 177 L557 195 Z',
      board: [[521,198],[557,198],[564,768],[504,768]],
      bridge: [[501,1012],[574,1012]],
      pickups: [{x:490,y:805,w:100,h:49},{x:489,y:909,w:101,h:49}],
      controls: [[633,883],[650,919],[656,954],[643,989]],
      bodyCenter: 538
    },
    EMBLA: {
      source: 'assets/optimized/embla-prototype.webp', status: 'prototype', strings: 5,
      imageSize: [1254,1254], luminance: [.05,.45,.50], exposure: 1.25,
      portrait: { full:'340 15 560 1160', body:'365 530 510 640', neck:'535 130 150 650', head:'530 25 200 135' },
      hardware: 'M529 987 L685 989 L683 1062 L520 1060 Z',
      tunerMask: 'M569 64 L602 68 L602 89 L566 91 Z M552 89 L597 94 L596 112 L550 116 Z M544 114 L592 116 L591 136 L547 137 Z M657 74 L699 73 L705 101 L661 97 Z M661 98 L707 96 L714 115 L663 119 Z M668 118 L715 116 L716 143 L671 139 Z',
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
      source: 'assets/optimized/askr-prototype.webp', status: 'prototype', strings: 5,
      imageSize: [1254,1254], luminance: [.85,.10,.05], exposure: 1.1,
      portrait: { full:'395 20 450 1145', body:'445 580 360 565', neck:'575 170 100 685', head:'555 35 140 165' },
      hardware: 'M577 1043 L657 1005 L675 1011 L675 1062 L594 1097 L578 1083 Z',
      tunerMask: 'M570 87 L602 85 L600 106 L568 109 Z M562 113 L595 113 L593 139 L561 141 Z M655 90 L683 93 L685 123 L661 123 Z M663 122 L688 122 L690 154 L666 156 Z',
      transform: 'translate(10 860) rotate(-90)',
      views: { full: '0 0 1160 440', body: '585 55 555 350', neck: '165 160 710 170', head: '40 165 185 160' },
      body: 'M590 766 C555 767 521 733 530 648 L535 612 C508 638 490 684 498 714 C505 754 528 792 531 835 C529 883 485 933 480 984 C474 1045 506 1092 565 1112 C622 1133 707 1126 745 1094 C796 1054 786 1013 758 966 C725 912 714 895 729 847 C738 815 752 794 768 783 C739 782 720 805 699 812 C676 818 664 807 659 789 Z',
      head: 'M607 182 L585 166 L597 127 L601 53 Q599 43 615 49 L654 69 L658 124 L669 167 L645 183 Z',
      board: [[606,184],[644,184],[658,814],[593,840]],
      bridge: [[587,1070],[668,1030]],
      pickups: [{x:575,y:872,w:103,h:43,angle:-10},{x:574,y:941,w:105,h:43,angle:-10}],
      controls: [[728,975],[706,1010],[750,1013],[733,1046]], bodyCenter: 625
    },
    GRAMR: {
      source: 'assets/optimized/gramr-superstrat-24f.webp', status: 'concept', strings: 6, horizontal: true,
      imageSize: [1672,941], luminance: [.85,.10,.05], exposure: 1.15,
      portraitTransform: 'translate(680 -10) rotate(90)',
      portrait: { full:'145 0 320 780', body:'160 375 275 405', neck:'265 160 90 370', head:'265 20 100 160' },
      hardware: 'M640 350 L678 350 L678 416 L640 416 Z M671 301 Q686 282 703 296 Q725 304 706 328 Q691 351 676 338 Z',
      tunerMask: 'M43 372 L164 392 L160 418 L40 390 Z',
      transform: 'translate(0 0)',
      views: { full: '20 255 770 280', body: '380 255 410 280', neck: '160 330 370 95', head: '25 315 160 115' },
      body: 'M490 358 C505 331 481 311 449 306 C429 304 430 289 453 283 C503 269 536 307 566 307 C601 308 620 271 670 272 C718 269 750 297 756 333 C768 392 765 451 741 483 C719 509 677 512 644 500 C594 483 575 454 535 457 C495 462 454 484 420 476 C397 474 388 462 398 452 C410 442 441 449 452 433 C465 417 461 405 463 397 Z',
      pickguard: 'M514 359 L550 351 Q584 344 582 322 Q628 293 665 290 Q680 289 675 299 L642 340 L637 409 Q638 437 615 438 Q579 434 556 421 L511 418 Z',
      head: 'M170 359 L121 349 C90 359 72 352 68 333 L53 331 C33 333 32 357 40 368 L72 374 L126 400 L158 398 L170 390 Z',
      board: [[170,359],[170,390],[510,399],[510,360]],
      bridge: [[656,361],[656,410]],
      pickups: [{x:526,y:356,w:34,h:51},{x:598,y:356,w:34,h:51}],
      controls: [[630,340],[649,315]], bodyCenter: 620
    }
  };
}));
