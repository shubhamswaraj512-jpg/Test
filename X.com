// ==UserScript==
// @name         X SwitchApp Trigger
// @match        *://*.x.com/*
// @grant        none
// ==/UserScript==

window.location.href = "shortcuts://run-shortcut?name=SwitchApp";
