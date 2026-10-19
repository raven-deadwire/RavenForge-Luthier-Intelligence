/* RavenForge-owned concept outlines. Display coordinates, never machining data.
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
      transform: 'translate(25 780) rotate(-90)',
      views: { full: '0 0 1120 460', body: '565 55 540 390', neck: '170 175 640 160', head: '35 175 220 170' },
      body: 'M507 674 C490 704 453 673 449 596 C449 551 423 562 414 597 C398 656 433 738 430 789 C426 853 377 891 380 943 C382 1011 430 1047 502 1053 C574 1062 642 1040 677 1000 C714 950 679 883 650 831 C632 794 651 770 662 732 C674 698 658 675 645 687 C631 743 614 756 587 752 C570 751 558 736 559 711 Z',
      head: 'M521 195 L497 174 L507 119 L529 36 Q539 13 551 30 L575 66 L568 118 L584 157 L562 177 L557 195 Z',
      board: [[521,198],[557,198],[564,768],[504,768]],
      bridge: [[501,1012],[574,1012]],
      pickups: [{x:490,y:805,w:100,h:49},{x:489,y:909,w:101,h:49}],
      controls: [[633,883],[650,919],[656,954],[643,989]],
      bodyCenter: 538
    },
    EMBLA: {
      source: 'assets/optimized/embla-prototype.webp', status: 'prototype', strings: 5,
      transform: 'translate(10 870) rotate(-90)',
      views: { full: '0 0 1160 510', body: '555 5 595 500', neck: '135 175 680 180', head: '35 160 175 200' },
      body: 'M561 674 C530 702 477 654 474 579 C473 542 453 552 441 574 C421 622 455 704 472 746 C469 815 417 865 400 919 C371 1002 406 1062 491 1089 C579 1117 694 1126 768 1094 C848 1060 849 1020 823 966 C799 916 757 871 753 830 C747 795 777 758 780 726 C784 692 766 686 754 705 C728 768 685 771 660 736 Z',
      head: 'M602 139 L581 130 L594 96 L602 55 Q622 33 652 53 L663 83 L682 124 L657 140 Z',
      board: [[602,142],[656,142],[666,751],[560,751]],
      bridge: [[540,1035],[672,1035]],
      pickups: [{x:530,y:850,w:155,h:42},{x:528,y:910,w:157,h:43}],
      controls: [[752,897],[774,936],[799,979],[792,1026],[747,1060]], bodyCenter: 611
    },
    ASKR: {
      source: 'assets/optimized/askr-prototype.webp', status: 'prototype', strings: 5,
      transform: 'translate(10 860) rotate(-90)',
      views: { full: '0 0 1160 440', body: '585 55 555 350', neck: '165 160 710 170', head: '40 165 185 160' },
      body: 'M590 766 C555 767 521 733 530 648 L535 612 C508 638 490 684 498 714 C505 754 528 792 531 835 C529 883 485 933 480 984 C474 1045 506 1092 565 1112 C622 1133 707 1126 745 1094 C796 1054 786 1013 758 966 C725 912 714 895 729 847 C738 815 752 794 768 783 C739 782 720 805 699 812 C676 818 664 807 659 789 Z',
      head: 'M607 182 L585 166 L597 127 L601 53 Q599 43 615 49 L654 69 L658 124 L669 167 L645 183 Z',
      board: [[606,184],[644,184],[658,814],[593,840]],
      bridge: [[587,1070],[668,1030]],
      pickups: [{x:575,y:872,w:103,h:43},{x:574,y:941,w:105,h:43}],
      controls: [[728,975],[706,1010],[750,1013],[733,1046]], bodyCenter: 625
    },
    GRAMR: {
      source: 'assets/optimized/gramr-superstrat-24f.webp', status: 'concept', strings: 6, horizontal: true,
      transform: 'translate(0 0)',
      views: { full: '20 255 770 280', body: '380 255 410 280', neck: '160 330 370 95', head: '25 315 160 115' },
      body: 'M490 358 C505 331 481 311 449 306 C429 304 430 289 453 283 C503 269 536 307 566 307 C601 308 620 271 670 272 C718 269 750 297 756 333 C768 392 765 451 741 483 C719 509 677 512 644 500 C594 483 575 454 535 457 C495 462 454 484 420 476 C397 474 388 462 398 452 C410 442 441 449 452 433 C465 417 461 405 463 397 Z',
      head: 'M170 359 L121 349 C90 359 72 352 68 333 L53 331 C33 333 32 357 40 368 L72 374 L126 400 L158 398 L170 390 Z',
      board: [[170,359],[170,390],[510,399],[510,360]],
      bridge: [[656,361],[656,410]],
      pickups: [{x:526,y:356,w:34,h:51},{x:598,y:356,w:34,h:51}],
      controls: [[630,340],[649,315]], bodyCenter: 620
    }
  };
}));
