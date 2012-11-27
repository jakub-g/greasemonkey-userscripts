// ==UserScript==
// @name            GitHub code review assistant
// @description     Toggle diff visibility per file in the commit. Mark reviewed files. Useful to review commits with lots of files changed.
// @icon            https://github.com/favicon.ico
// @version         0.3.0
// @namespace       http://jakub-g.github.com/
// @author          http://jakub-g.github.com/
// @downloadURL     https://raw.github.com/jakub-g/greasemonkey-userscripts/master/github/togglableDiff.js
// @userscriptsOrg  http://userscripts.org/scripts/show/...
// @grant           none
// @include         http*://github.com/*/*/commit/*
// @include         http*://github.com/*/*/pull/*
// ==/UserScript==

// Changelog:
// 0.1
//  initial version
// 0.1.2
//  includes pull requests
// 0.1.3
//  do not fire the event on child nodes
// 0.1.4
//  fire intelligently on some child nodes
// 0.2.0
//  'expand all' / 'collapse all' button
//  auto hiding on long diff
//  code refactor
// 0.3.0
//  code review mark button

// ============================= CONFIG ================================

// If there's more than N commits in the diff, automatically collapse them all.
// Use 0 to disable that feature.
var hideAllWhenMoreThanFiles = 10;

// Automatically collapse entries that have changed more than N lines.
var hideFileWhenDiffGt = 30;

// Do not do any of above if small number of files changed in that commit
var dontHideUnlessMoreThanFiles = 2;

// Whether to show 'Reviewed' button next to each file
var enableReviewedButton = true;
// ============================== CODE =================================

var attachListeners = function() {

    /**
     * @param elem element to be toggled upon clicking
     * @param bStrictTarget whether the event listener should fire only on its strict target or also children
     */
    let getHandler = function(elem, bStrictTarget) {
        return function(evt){
            if(bStrictTarget){
                if (evt.currentTarget != evt.target) {
                    // don't want to trigger the event when clicking on "View file" or "Show comment"
                    return;
                }
            }

            let currDisplay = elem.style.display;
            if(currDisplay === 'none') {
                elem.style.display = 'block';
            } else {
                elem.style.display = 'none';
            }
        };
    };

    let mainDiffDiv = document.getElementById('files');
    let children = mainDiffDiv.children;
    let nbOfCommits = children.length;

    // dev note: let vs var is crucial below here in the loop, as 'children' is a live collection...
    for(let i=0, ii = nbOfCommits; i<ii; i++) {
        let child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }
        let diffContainer = child; // document.getElementById('diff-1');

        // We want the evt to fire on the header and some, but not all of the children...
        let diffContainerHeader = diffContainer.children[0];
        let diffContainerFileNameHeader = diffContainerHeader.children[0];

        let diffContainerBody = diffContainer.children[1];

        let handler1 = getHandler(diffContainerBody, false);
        let handler2 = getHandler(diffContainerBody, true);

        diffContainerFileNameHeader.addEventListener('click', handler1, false);
        diffContainerHeader.addEventListener('click', handler2, true);
        diffContainerHeader.style.cursor = 'pointer';
    }
};

var toggleDisplayAll = function(bVisible) {

    let mainDiffDiv = document.getElementById('files');
    let children = mainDiffDiv.children;
    let nbOfCommits = children.length;

    let newDisplay = bVisible ? 'block' : 'none';

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        let child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }

        let diffContainer = child;
        let diffContainerBody = diffContainer.children[1];

        diffContainerBody.style.display = newDisplay;
    }
};

var hideLong = function(minDiff) {

    let mainDiffDiv = document.getElementById('files');
    let children = mainDiffDiv.children;
    let nbOfCommits = children.length;

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        let child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }

        let diffContainer = child;
        let diffContainerBody = diffContainer.children[1];

        let diffStats = parseInt(diffContainer.children[0].children[0].children[0].firstChild.textContent, 10);
        //console.log(diffStats);

        if(diffStats > minDiff){
            diffContainerBody.style.display = 'none';
        }
    }
};

var attachToggleButton = function (hiddenByDefault) {

    var buttonBarContainer = document.querySelector('#toc');
    var buttonBar = buttonBarContainer.children[0];

    var newButton = document.createElement('a');
    newButton.className = 'minibutton';
    newButton.href = '#';

    newButton.innerHTML = hiddenByDefault ? 'Expand all' : 'Collapse all';

    let nowHidden = hiddenByDefault; // closure to keep state
    newButton.addEventListener('click', function(evt) {
        if(nowHidden == true){
            toggleDisplayAll(true);
            nowHidden = false;
            newButton.innerHTML = 'Collapse all';
        } else {
            toggleDisplayAll(false);
            nowHidden = true;
            newButton.innerHTML = 'Expand all';
        }
    });

    buttonBar.appendChild(newButton);
};
var attachReviewedButton = function () {

   var XPathTools = {
      getElementByXpath : function(xpath, referenceNode) {
         var xPathResult = document.evaluate (xpath, referenceNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
         return xPathResult.singleNodeValue;
      }
   };

    let mainDiffDiv = document.getElementById('files');
    let children = mainDiffDiv.children;
    let nbOfCommits = children.length;

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        let child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }

        let diffContainer = child;
        let diffContainerHeader = diffContainer.children[0];
        let diffContainerBody = diffContainer.children[1];

        var parent = XPathTools.getElementByXpath('.//div[@class="actions"]/ul/li', diffContainer);
        console.log(parent);


        var newButton = document.createElement('a');
        newButton.className = 'grouped-button minibutton bigger lighter';
        //newButton.href = '#';

        newButton.innerHTML = 'Reviewed';

        let reviewed = false; // closure to keep state
        newButton.addEventListener('click', function(evt) {
            if(reviewed == true){
                reviewed = false;
                diffContainerHeader.style.backgroundImage = 'linear-gradient(#FAFAFA, #EAEAEA)';
                diffContainerHeader.style.color = '#555555';
            } else {
                reviewed = true;
                diffContainerHeader.style.backgroundImage = 'linear-gradient(#333, #444)';
                diffContainerHeader.style.color = '#FFF';
                diffContainerBody.style.display = 'none';
            }
        });

        parent.insertBefore(newButton, parent.firstChild);
    }
};

var main = function () {

    // read config
    let mainDiffDiv = document.getElementById('files');
    let nbOfFiles = mainDiffDiv.children.length;

    let autoHide = false;
    let autoHideLong = false;
    if(nbOfFiles > dontHideUnlessMoreThanFiles) {
        if(hideAllWhenMoreThanFiles > 0 && nbOfFiles > hideAllWhenMoreThanFiles){
            autoHide = true;
        }else if(hideFileWhenDiffGt > 0) {
            autoHideLong = true;
        }
    }
    // let's go
    attachListeners();
    if(autoHide) {
        toggleDisplayAll(false);
    }else if(autoHideLong) {
        hideLong(hideFileWhenDiffGt);
    }
    attachToggleButton(autoHide);

    if(enableReviewedButton){
        attachReviewedButton();
    }
};

main();
