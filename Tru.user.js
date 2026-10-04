// ==UserScript==
// @name         Pre-PG iOS Full Fix
// @namespace    https://pre-pg.com/
// @version      24.7.0
// @description  Fixes Option D rendering, enables native iOS full-page screenshots, text selection, docked navigation, options positioning, fixes top question clipping, and unlocks explanation scrolling.
// @match        https://pre-pg.com/*
// @match        https://*.pre-pg.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // 1. Root & Document Style Reset
    const style = document.createElement('style');
    style.textContent = `
        /* Enable Text Selection Globally */
        * {
            -webkit-user-select: text !important;
            user-select: text !important;
            -webkit-touch-callout: default !important;
        }

        /* Allow Document Root & Body to Scroll Naturally on iOS */
        html {
            height: auto !important;
            min-height: 100% !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            background-color: #18171f !important;
        }

        body {
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            position: relative !important;
            background-color: #18171f !important;
            color: #ffffff !important;
            padding-top: 8px !important;
            /* Clearance so bottom content is scrollable above fixed dock */
            padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)) !important;
        }

        /* Question Layout Container - Prevents Top Cutoff */
        .ppg-question-wrapper {
            display: flex !important;
            flex-direction: column !important;
            margin-top: 0 !important;
            padding-top: 8px !important;
            min-height: calc(100vh - 160px - env(safe-area-inset-bottom, 0px)) !important;
            min-height: calc(100dvh - 160px - env(safe-area-inset-bottom, 0px)) !important;
            box-sizing: border-box !important;
        }

        /* Options Container - Dynamic Bottom Docking */
        .ppg-options-container {
            margin-bottom: 16px !important;
            padding-top: 12px !important;
            flex: 0 0 auto !important;
        }

        /* Enable Touch Scrolling on Explanation Containers */
        .ppg-explanation-scrollable {
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-y !important;
            max-height: none !important;
        }

        /* Fixed Viewport Bottom Dock */
        .ppg-docked-bar {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            z-index: 2147483647 !important;
            background: rgba(24, 23, 31, 0.98) !important;
            border-top: 1px solid #393643 !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            box-shadow: 0 -5px 18px rgba(0, 0, 0, 0.45) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            backdrop-filter: blur(12px) !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);

    // 2. Clear Copy & Context Menu Traps
    ['selectstart', 'contextmenu', 'copy', 'cut', 'dragstart'].forEach(evt => {
        window.addEventListener(evt, e => e.stopPropagation(), true);
    });

    let observer = null;

    // 3. Main Repair Execution
    function applyAllFixes() {
        if (observer) observer.disconnect();

        dockNavigationBar();
        fixOptionSpacing();
        fixExplanationScroll();
        unclampContainers();

        if (observer && document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // A. Locate & Dock Bottom Bar
    function dockNavigationBar() {
        const candidates = document.querySelectorAll('button, a, span, div');
        let navBar = null;

        for (const el of candidates) {
            const txt = (el.textContent || '').trim().toLowerCase();
            if (txt === 'next question' || txt === 'skip' || (txt.includes('next') && txt.includes('question'))) {
                let parent = el.parentElement;
                while (parent && parent !== document.body) {
                    if (parent.children.length >= 2 && parent.clientHeight > 0 && parent.clientHeight < 160) {
                        navBar = parent;
                        break;
                    }
                    parent = parent.parentElement;
                }
                if (navBar) break;
            }
        }

        if (navBar) {
            if (!navBar.classList.contains('ppg-docked-bar')) {
                navBar.classList.add('ppg-docked-bar');
            }

            let ancestor = navBar.parentElement;
            while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
                const cs = window.getComputedStyle(ancestor);
                if (cs.transform !== 'none') ancestor.style.setProperty('transform', 'none', 'important');
                if (cs.contain !== 'none') ancestor.style.setProperty('contain', 'none', 'important');
                if (cs.filter !== 'none') ancestor.style.setProperty('filter', 'none', 'important');
                if (cs.perspective !== 'none') ancestor.style.setProperty('perspective', 'none', 'important');
                if (cs.willChange !== 'auto') ancestor.style.setProperty('will-change', 'auto', 'important');
                ancestor = ancestor.parentElement;
            }
        }
    }

    // B. Smart Positioning for Options (Near Skip Button on short questions, standard flow on long/explanations)
    function fixOptionSpacing() {
        const elements = document.querySelectorAll('button, div, span');
        const pageText = document.body ? document.body.innerText : '';
        const hasExplanation = pageText.includes('Solution:') || pageText.includes('discuss question with StudyPal');

        for (const el of elements) {
            const txt = (el.textContent || '').trim();
            if (/^A(\s|$)/.test(txt) && txt.length < 150) {
                let parent = el.parentElement;
                while (parent && parent !== document.body) {
                    if (parent.children.length >= 3 && parent.children.length <= 8) {
                        if (!parent.classList.contains('ppg-options-container')) {
                            parent.classList.add('ppg-options-container');
                        }

                        // Set margin based on whether explanation mode is open
                        if (hasExplanation) {
                            parent.style.setProperty('margin-top', '16px', 'important');
                        } else {
                            parent.style.setProperty('margin-top', 'auto', 'important');
                        }

                        let container = parent.parentElement;
                        if (container && container !== document.body) {
                            if (!container.classList.contains('ppg-question-wrapper')) {
                                container.classList.add('ppg-question-wrapper');
                            }
                        }

                        while (container && container !== document.body) {
                            const cs = window.getComputedStyle(container);
                            if (cs.display === 'flex' || cs.display === 'inline-flex') {
                                container.style.setProperty('flex-direction', 'column', 'important');
                                container.style.setProperty('justify-content', 'flex-start', 'important');
                            }
                            container = container.parentElement;
                        }
                        return;
                    }
                    parent = parent.parentElement;
                }
            }
        }
    }

    // C. Unlock Explanation & Solution Panel Scrolling on iOS
    function fixExplanationScroll() {
        const elements = document.querySelectorAll('div, section, article');
        elements.forEach(el => {
            const txt = el.textContent || '';
            if (txt.includes('Solution:') || txt.includes('discuss question with StudyPal')) {
                let parent = el;
                while (parent && parent !== document.body) {
                    if (!parent.classList.contains('ppg-explanation-scrollable')) {
                        parent.classList.add('ppg-explanation-scrollable');
                    }
                    parent = parent.parentElement;
                }
            }
        });
    }

    // D. Unclamp Containers for Full Expansion
    function unclampContainers() {
        const elements = document.querySelectorAll('body *:not(.ppg-docked-bar):not(.ppg-docked-bar *):not(.ppg-explanation-scrollable):not(.ppg-explanation-scrollable *)');

        elements.forEach(el => {
            const tag = el.tagName;
            if (['IMG', 'BUTTON', 'INPUT', 'SPAN', 'SVG', 'PATH', 'A', 'P', 'B', 'I'].includes(tag)) {
                return;
            }

            const cs = window.getComputedStyle(el);
            const isClamped =
                cs.overflowY === 'hidden' ||
                (cs.maxHeight !== 'none' && cs.maxHeight !== '0px') ||
                (cs.height !== 'auto' && el.scrollHeight > el.clientHeight);

            if (isClamped) {
                if (el.style.height !== 'auto') el.style.setProperty('height', 'auto', 'important');
                if (el.style.maxHeight !== 'none') el.style.setProperty('max-height', 'none', 'important');
                if (el.style.overflow !== 'visible') el.style.setProperty('overflow', 'visible', 'important');
                if (el.style.overflowY !== 'visible') el.style.setProperty('overflow-y', 'visible', 'important');
            }
        });
    }

    // 4. Automated Route & Mutation Handling
    applyAllFixes();

    observer = new MutationObserver(applyAllFixes);
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    setInterval(applyAllFixes, 800);
})();
