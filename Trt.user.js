// ==UserScript==
// @name         Pre-PG Question Screen Fit
// @namespace    prepg-screen-fit
// @version      1.0
// @description  Fits Pre-PG questions and options neatly on the iPhone screen
// @match        https://pre-pg.com/\
// @match        https://www.pre-pg.com/\
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('lens-shrink')) return;

    var style = document.createElement('style');
    style.id = 'lens-shrink';

    style.textContent = `
        header,
        [class*="header"],
        [class*="top"] {
            display: none !important;
        }

        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: auto !important;
        }

        body {
            zoom: 0.82 !important;
        }
    `;

    (document.head || document.documentElement).appendChild(style);
    window.scrollTo(0, 0);
})();
