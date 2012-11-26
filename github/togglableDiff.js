// ==UserScript==
// @name            GitHub toggle diff visibility per file in the commit
// @description     Useful to review commits with lots of files changed.
// @icon            https://github.com/favicon.ico
// @version         0.1
// @namespace       http://jakub-g.github.com/
// @author          http://jakub-g.github.com/
// @downloadURL     https://raw.github.com/jakub-g/greasemonkey-userscripts/master/github/togglableDiff.js
// @userscriptsOrg  http://userscripts.org/scripts/show/...
// @grant           none
// @include         http*://github.com/*/*/commit/*
// ==/UserScript==

// ============================= CONFIG ================================

// If there's more than N commits in the diff, automatically hide them all.
// Use 0 to disable that feature.
let hideAllWhenMoreThanCommits = 5;

// ============================== CODE =================================

let mainDiffDiv = document.getElementById('files');
let children = mainDiffDiv.children;
let nbOfCommits = children.length;
let hideMode = false;

if(hideAllWhenMoreThanCommits > 0 && nbOfCommits > hideAllWhenMoreThanCommits){
    hideMode = true;
}

// dev note: let vs var is crucial below here in the loop, as 'children' is a live collection...
for(var i=0, ii = nbOfCommits; i<ii; i++) {
    let child = children[i];
    if(child.id && child.id.indexOf('diff-') == -1){
        continue;
    }
    let diffContainer = child; // document.getElementById('diff-1');
    console.log(diffContainer);
    let diffContainerHeader = diffContainer.children[0];
    let diffContainerBody = diffContainer.children[1];

    diffContainer.style.cursor = 'pointer';

    diffContainerHeader.addEventListener('click', function(){
        let currDisplay = diffContainerBody.style.display;
        //console.log(currDisplay);
        if(currDisplay === 'none'){
            //diffContainerBody.style.border = '2px solid red';
            diffContainerBody.style.display = 'block';
        }
        else{
            //diffContainerBody.style.border = '2px solid blue';
            diffContainerBody.style.display = 'none';
         }
    });

    if(hideMode) {
        diffContainerBody.style.display = 'none';
    }
}
