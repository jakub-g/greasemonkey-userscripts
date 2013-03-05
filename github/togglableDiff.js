// ==UserScript==
// @name            GitHub code review assistant
// @description     Toggle diff visibility per file in the commit. Mark reviewed files. Useful to review commits with lots of files changed.
// @icon            https://github.com/favicon.ico
// @version         0.5.0-20130305
// @namespace       http://jakub-g.github.com/
// @author          http://jakub-g.github.com/
// @downloadURL     https://raw.github.com/jakub-g/greasemonkey-userscripts/master/github/togglableDiff.js
// @userscriptsOrg  http://userscripts.org/scripts/show/153049
// @grant           none
// @include         http*://github.com/*/*/commit/*
// @include         http*://github.com/*/*/pull/*
// @include         http*://github.com/*/*/compare/*
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
// 0.4.0-20130201
//  accomodated to new GH HTML markup
// 0.4.1-20130212
//  enabled also on /compare/ URLs
// 0.5.0-20130305
//  Works also in Chrome (Tampermonkey) now!

// ============================= CONFIG ================================

// If there's more than N commits in the diff, automatically collapse them all.
// Use 0 to disable that feature.
var hideAllWhenMoreThanFiles = 4;

// Automatically collapse entries that have changed more than N lines.
var hideFileWhenDiffGt = 0;

// Do not do any of above if small number of files changed in that commit
var dontHideUnlessMoreThanFiles = 2;

// Whether to show 'Reviewed' button next to each file
var enableReviewedButton = true;
// ============================== CODE =================================

var freeze = function (collection) {
    return collection;

    //var output = [];
    //for(var i=0; i<collection.length; i++){
    //    output.push(collection[i]);
    //}
    //return output;
};

/**
 * @param elem element to be toggled upon clicking
 * @param bStrictTarget whether the event listener should fire only on its strict target or also children
 */
var getHandler = function(elem, bStrictTarget) {
    return function(evt){
        if(bStrictTarget){
            if (evt.currentTarget != evt.target) {
                // don't want to trigger the event when clicking on "View file" or "Show comment"
                return;
            }
        }

        var currDisplay = elem.style.display;
        if(currDisplay === 'none') {
            elem.style.display = 'block';
        } else {
            elem.style.display = 'none';
        }
    };
};

var attachListeners = function() {

    var mainDiffDiv = document.getElementById('files');
    var children = freeze(mainDiffDiv.children);
    var nbOfCommits = children.length;

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        var child = children[i];
        attachListenersToChild(child);
    }
};

var attachListenersToChild = function (child) {
    if(!child.id || child.id.indexOf('diff-') == -1){
        return;
    }
    var diffContainer = child; // document.getElementById('diff-1');

    // We want the evt to fire on the header and some, but not all of the children...
    var diffContainerHeader = diffContainer.children[0];
    var diffContainerFileNameHeader = diffContainerHeader.children[0];

    var diffContainerBody = diffContainer.children[1];

    var handler1 = getHandler(diffContainerBody, false);
    var handler2 = getHandler(diffContainerBody, true);

    diffContainerFileNameHeader.addEventListener('click', handler1, false);
    diffContainerHeader.addEventListener('click', handler2, true);
    diffContainerHeader.style.cursor = 'pointer';
}

var toggleDisplayAll = function(bVisible) {

    var mainDiffDiv = document.getElementById('files');
    var children = mainDiffDiv.children;
    var nbOfCommits = children.length;

    var newDisplay = bVisible ? 'block' : 'none';

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        var child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }

        var diffContainer = child;
        var diffContainerBody = diffContainer.children[1];

        diffContainerBody.style.display = newDisplay;
    }
};

var hideLong = function(minDiff) {

    var mainDiffDiv = document.getElementById('files');
    var children = freeze(mainDiffDiv.children);
    var nbOfCommits = children.length;

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        var child = children[i];
        if(!child.id || child.id.indexOf('diff-') == -1){
            continue;
        }

        var diffContainer = child;
        var diffContainerBody = diffContainer.children[1];

        var diffStats = parseInt(diffContainer.children[0].children[0].children[0].firstChild.textContent, 10);
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

    var nowHidden = hiddenByDefault; // closure to keep state
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

var XPathTools = {
  getElementByXpath : function(xpath, referenceNode) {
     var xPathResult = document.evaluate (xpath, referenceNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
     return xPathResult.singleNodeValue;
  }
};

var attachReviewedButton = function () {

    var mainDiffDiv = document.getElementById('files');
    var children = freeze(mainDiffDiv.children);
    var nbOfCommits = children.length;

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        var child = children[i];
        attachReviewedButtonChild(child);
    }
};

var attachReviewedButtonChild = function (child) {

    if(!child.id || child.id.indexOf('diff-') == -1){
        return;
    }

    var diffContainer = child;
    var diffContainerHeader = diffContainer.children[0];
    var diffContainerBody = diffContainer.children[1];

    var parent = XPathTools.getElementByXpath('.//div[@class="actions"]/div[@class="button-group"]', diffContainer);

    var newButton = document.createElement('a');
    newButton.className = 'minibutton';
    //newButton.href = '#fakeHash';

    newButton.innerHTML = 'Reviewed';

    var reviewed = false; // closure to keep state
    newButton.addEventListener('click', function(evt) {
        if(reviewed == true){
            reviewed = false;
            diffContainerHeader.style.backgroundImage = '-webkit-linear-gradient(top, #FAFAFA, #EAEAEA)';
            diffContainerHeader.style.backgroundImage = 'linear-gradient(#FAFAFA, #EAEAEA)';
            diffContainerHeader.style.color = '#555555';
        } else {
            reviewed = true;
            diffContainerHeader.style.backgroundImage = '-webkit-linear-gradient(top, #333, #444)';
            diffContainerHeader.style.backgroundImage = 'linear-gradient(#333, #444)';
            diffContainerHeader.style.color = '#FFF';
            diffContainerBody.style.display = 'none';
        }
    });

    parent.insertBefore(newButton, parent.firstChild);
};

var main = function () {

    // read config
    var mainDiffDiv = document.getElementById('files');
    var nbOfFiles = mainDiffDiv.children.length;

    var autoHide = false;
    var autoHideLong = false;
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
