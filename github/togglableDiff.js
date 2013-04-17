// ==UserScript==
// @name            GitHub code review assistant
// @description     Toggle diff visibility per file in the commit. Mark reviewed files. Useful to review commits with lots of files changed.
// @icon            https://github.com/favicon.ico
// @version         0.6.1.20130417
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
// 0.6.0-20130404
//  Added sidebar and footer to quickly go to the beginning of the current file.
//  Added additional button to mark file as problematic (OK / Fail).
//  After clicking "Reviewed" on file n, scroll to file n, and make the file n+1 expanded.
// 0.6.1.20130417
//  Fix the ugly text shadow on marked files

// ============================= CONFIG ================================

var CONFIG = {};
// If there's more than N commits in the diff, automatically collapse them all.
// Use 0 to disable that feature.
CONFIG.hideAllWhenMoreThanFiles = 4;

// Automatically collapse entries that have changed more than N lines.
CONFIG.hideFileWhenDiffGt = 0;

// Do not do any of above if small number of files changed in that commit
CONFIG.dontHideUnlessMoreThanFiles = 2;

// Whether to show 'Reviewed' button next to each file
CONFIG.enableReviewedButton = true;

// Whether to show sidebar and footer that scroll to the top of the file on click.
// Below related look'n'feel config
CONFIG.enableDiffSidebarAndFooter = true;
CONFIG.sidebarSize = 12; // in pixels
CONFIG.footerSize = 8;
CONFIG.sidebarColor1 = '#eee';
CONFIG.sidebarColor2 = '#aaa';
// ============================== CODE =================================

var L10N = {
    ok: 'Ok',
    fail: 'Fail'
}

var addCss = function (sCss){
    var dStyle = document.createElement('style');
    dStyle.type = 'text/css';
    dStyle.appendChild(document.createTextNode(sCss));
    document.getElementsByTagName('head')[0].appendChild(dStyle);
}

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

var attachPerFileItems = function () {

    var mainDiffDiv = document.getElementById('files');
    var children = freeze(mainDiffDiv.children);
    var nbOfCommits = children.length;

    var css = []; //#EAEAEA, #FAFAFA
    css.push('.ghAssistantButtonStateNormal {\
        background-image: -webkit-linear-gradient(top, #fafafa, #eaeaea) !important;\
        background-image:   linear-gradient(to bottom, #fafafa, #eaeaea) !important;\
        color: #555 !important;\
        text-shadow: none !important;\
    }');
    css.push('.ghAssistantButtonStateOk {\
        background-image: -webkit-linear-gradient(top, #333, #444) !important;\
        background-image:   linear-gradient(to bottom, #333, #444) !important;\
        color: #fff !important;\
        text-shadow: none !important;\
    }');
    css.push('.ghAssistantButtonStateFail {\
        background-image: -webkit-linear-gradient(top, #833, #844) !important;\
        background-image:   linear-gradient(to bottom, #833, #844) !important;\
        color: #fff !important;\
        text-shadow: none !important;\
    }');
    if (CONFIG.enableDiffSidebarAndFooter) {
        css.push('.ghAssistantFileFoot {height: ' + CONFIG.footerSize + 'px; border-top: 1px solid rgb(216, 216, 216);   background-image: linear-gradient(' + CONFIG.sidebarColor1 + ', ' + CONFIG.sidebarColor2 + ');           font-size: 6pt;} ');
        css.push('.ghAssistantFileSide {width: '+ CONFIG.sidebarSize + 'px;  border-right: 1px solid rgb(216, 216, 216); background-image: linear-gradient(to right, ' + CONFIG.sidebarColor2 + ', ' + CONFIG.sidebarColor1 + '); font-size: 6pt; height: 100%; float: left; position: absolute; top:0; left:-' + (CONFIG.sidebarSize+2) + 'px; border-radius:0 0 0 10px;}');

        css.push('.ghAssistantFileFoot:hover {background-image: linear-gradient(' + CONFIG.sidebarColor2 + ', ' + CONFIG.sidebarColor1 + ');} ');
        css.push('.ghAssistantFileSide:hover {background-image: linear-gradient(to right, ' + CONFIG.sidebarColor1 + ', ' + CONFIG.sidebarColor2 + ');}');

        css.push('.ghAssistantFileFoot a {display: block; height:100%;}');
        css.push('.ghAssistantFileSide a {display: block; height:100%;}');

        // override GH's CSS with the "+" button on the side to add the comments
        css.push('#files .add-bubble { margin-left:-'+ (25+CONFIG.sidebarSize)+'px} !important');
    }
    addCss(css.join('\n'));

    for(var i=0, ii = nbOfCommits; i<ii; i++) {
        var child = children[i];
        if (CONFIG.enableReviewedButton) {
            attachRejectedButtonChild(child);
            attachReviewedButtonChild(child);
        }
        if (CONFIG.enableDiffSidebarAndFooter) {
            attachSidebarAndFooter(child);
        }
    }
};

var attachReviewedButtonChild = function (child) {
    genericAttachReviewedButtonChild(child, L10N.ok);
};
var attachRejectedButtonChild = function (child) {
    genericAttachReviewedButtonChild(child, L10N.fail);
};

var genericAttachReviewedButtonChild = function (child, text /*also cssClassNamePostfix*/) {
    if(!child.id || child.id.indexOf('diff-') == -1){
        return;
    }

    var currentDiffIdx = Number(child.id.replace('diff-',''));
    var diffContainer = child;
    var diffContainerHeader = diffContainer.children[0]; // .meta
    var diffContainerBody = diffContainer.children[1];   // .data

    var parent = XPathTools.getElementByXpath('.//div[@class="actions"]/div[@class="button-group"]', diffContainer);

    var newButton = document.createElement('a');
    newButton.className = 'minibutton';
    //newButton.href = '#fakeHash';

    newButton.innerHTML = text;

    newButton.addEventListener('click', function(evt) {
        var ghaClassName = 'ghAssistantButtonState' + text;
        var ghaClassNameAlt = 'ghAssistantButtonState' + (text === L10N.ok ? L10N.fail : L10N.ok);
        var reviewed = diffContainerHeader.className.indexOf(ghaClassName) > -1;
        if(reviewed == true){
            // remove the added class name for 'Fail' / 'Ok'
            diffContainerHeader.className = diffContainerHeader.className.replace(ghaClassName, '');
        } else {
            // remove 'Ok' if we're setting 'Fail' and the opposite as well
            diffContainerHeader.className = diffContainerHeader.className.replace(ghaClassNameAlt, '');
            // add the class name for 'Fail' / 'Ok'
            diffContainerHeader.className += " " + ghaClassName;

            // scroll the page so that currently reviewed file is in the top
            document.location = '#diff-' + currentDiffIdx;
            // expand the next file if it was hidden
            var next = document.getElementById('diff-' + (currentDiffIdx+1));
            if(next) {
                next.children[1].style.display = 'block';
            }
        }
    });

    parent.insertBefore(newButton, parent.firstChild);
};

var attachSidebarAndFooter = function (child) {
    if(!child.id || child.id.indexOf('diff-') == -1){
        return;
    }

    var diffContainer = child;
    var diffContainerBody = diffContainer.children[1];

    var hLink = '<a title="Click me to scroll to the top of this file" href="#' + diffContainer.id + '">&nbsp;</a>';

    var dfoot = document.createElement('div');
    dfoot.className = 'ghAssistantFileFoot';
    dfoot.innerHTML = hLink;
    diffContainer.appendChild(dfoot);

    var dsidebar = document.createElement('div');
    dsidebar.className = 'ghAssistantFileSide';
    dsidebar.innerHTML = hLink;
    diffContainer.appendChild(dsidebar);
};

var main = function () {

    // read config
    var mainDiffDiv = document.getElementById('files');
    var nbOfFiles = mainDiffDiv.children.length;

    var autoHide = false;
    var autoHideLong = false;
    if(nbOfFiles > CONFIG.dontHideUnlessMoreThanFiles) {
        if(CONFIG.hideAllWhenMoreThanFiles > 0 && nbOfFiles > CONFIG.hideAllWhenMoreThanFiles){
            autoHide = true;
        }else if(CONFIG.hideFileWhenDiffGt > 0) {
            autoHideLong = true;
        }
    }
    // let's go
    attachListeners();
    if(autoHide) {
        toggleDisplayAll(false);
    }else if(autoHideLong) {
        hideLong(CONFIG.hideFileWhenDiffGt);
    }
    attachToggleButton(autoHide);

    attachPerFileItems();
};

main();
