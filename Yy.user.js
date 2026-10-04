// ==UserScript==
// @name         Pre-PG iOS Full Fix
// @namespace    https://pre-pg.com/
// @version      24.5.2
// @description  Fixes Option D rendering, enables native iOS full-page screenshots, text selection, docked navigation, normal bottom buttons, and anchors options dynamically near the bottom dock.
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

        /* Allow Document Root to Expand for iOS Safari Native Full-Page Screenshots */
        html {
            height: auto !important;
            min-height: 100% !important;
            overflow-y: visible !important;
            background-color: #18171f !important;
        }

        body {
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: visible !important;
            overflow-x: hidden !important;
            position: relative !important;
            background-color: #18171f !important;
            color: #ffffff !important;
            /* Clearance for bottom dock bar */
            padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)) !important;
            box-sizing: border-box !important;
        }

        /* Anchors options dynamically at bottom thumb level */
        .ppg-options-container {
            margin-top: auto !important;
            margin-bottom: 24px !important;
            padding-top: 20px !important;
            flex: 0 0 auto !important;
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
        unclampContainers();

        if (observer && document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // A. Locate & Viewport-Dock Bottom Action Bar
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

            // Strip transform/containment traps from parent hierarchy so position: fixed stays bound to screen viewport
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

    // B. Fix Dynamic Spacing Between Question & Options
    function fixOptionSpacing() {
        const elements = document.querySelectorAll('button, div, span');
        for (const el of elements) {
            const txt = (el.textContent || '').trim();
            // Matches A, B, C, or D to detect randomized/shuffled options
            if (/^[A-D](\s|$)/.test(txt) && txt.length < 150) {
                let parent = el.parentElement;
                while (parent && parent !== document.body) {
                    if (parent.children.length >= 3 && parent.children.length <= 8) {
                        if (!parent.classList.contains('ppg-options-container')) {
                            parent.classList.add('ppg-options-container');
                        }

                        // Stretch container height to fill space between header and bottom dock
                        let container = parent.parentElement;
                        if (container && container !== document.body) {
                            container.style.setProperty('display', 'flex', 'important');
                            container.style.setProperty('flex-direction', 'column', 'important');
                            container.style.setProperty('justify-content', 'space-between', 'important');
                            container.style.setProperty('min-height', 'calc(100vh - 180px - env(safe-area-inset-bottom, 0px))', 'important');
                        }
                        return;
                    }
                    parent = parent.parentElement;
                }
            }
        }
    }

    // C. Unclamp Containers for Full Document Expansion
    function unclampContainers() {
        const elements = document.querySelectorAll('body *:not(.ppg-docked-bar):not(.ppg-docked-bar *)');

        elements.forEach(el => {
            const tag = el.tagName;
            if (['IMG', 'BUTTON', 'INPUT', 'SPAN', 'SVG', 'PATH', 'A', 'P', 'B', 'I'].includes(tag)) {
                return;
            }

            const cs = window.getComputedStyle(el);
            const isClamped =
                cs.overflowY === 'auto' ||
                cs.overflowY === 'scroll' ||
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
