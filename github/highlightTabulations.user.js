// ==UserScript==
// @name            GitHub show tabulations
// @description     Highlights tabulations in files and pull requests, to distinguish them from spaces
// @icon            https://github.com/favicon.ico
// @version         0.1.0.20140224
// @namespace       http://jakub-g.github.io/
// @author          http://jakub-g.github.io/
// @downloadURL     https://raw.github.com/jakub-g/greasemonkey-userscripts/master/github/highlightTabulations.user.js
// @userscriptsOrg  http://userscripts.org/scripts/show/....
// @grant           none
// @include         https://github.com/*/*/commit/*
// @include         https://github.com/*/*/pull/*
// @include         https://github.com/*/*/compare/*
// @include         https://github.com/*/*/blob/*
// ==/UserScript==

// let it be a little bit darker than github highlighting (255/170)
// which is used to show the whitespace-diff sometimes
var cfg = {
    onWhite : "rgb(221, 221, 221)",
    onGreen : "rgb(130, 225, 130)",
    onRed   : "rgb(225, 130, 130)"
};

function addCss(sCss) {
    var dStyle = document.createElement('style');
    dStyle.type = 'text/css';
    dStyle.appendChild(document.createTextNode(sCss));
    document.getElementsByTagName('head')[0].appendChild(dStyle);
}

function replaceTabs(withHtml) {
    var items = document.querySelectorAll('pre');
    [].slice.call(items, 0).forEach(function(item) {
            if(item.innerHTML.match(/\t/)) {
                item.innerHTML = item.innerHTML.replace(/(\t+)/g, "<span class='_tabulation'>$1</span>");
        }
    });
}

function main() {
    addCss("\
            ._tabulation { background-color: " + cfg.onWhite + "; }\
        .gd ._tabulation { background-color: " + cfg.onRed   + "; }\
        .gi ._tabulation { background-color: " + cfg.onGreen + "; }\
    ");
    replaceTabs();
}

main();
