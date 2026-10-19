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
    }
  };
}));
