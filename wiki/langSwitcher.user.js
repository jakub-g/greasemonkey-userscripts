// ==UserScript==
// @name            Wiki language switcher
// @description     Easily switch Wikipedia language version with a heading link (see the screenshot). Retrieves links to other Wikipedia language versions (user-specified) for given article (if present), and places them beside main article heading on the top of the page. Can be both used as translator and quick link feature.
// @icon            http://en.wikipedia.org/favicon.ico
// @version         2020.02.27 (0.3.5)
// @namespace       qbk
// @author          http://jakub-g.github.com/
// @downloadURL     https://raw.githubusercontent.com/jakub-g/greasemonkey-userscripts/master/wiki/langSwitcher.user.js
// @grant           none
// @include         http*://*.wikipedia.org/wiki/*
// @include         http*://*.wiktionary.org/wiki/*
// @include         http*://*.wikiversity.org/wiki/*
// @include         http*://*.wikisource.org/wiki/*
// @include         http*://*.wikibooks.org/wiki/*
// @include         http*://*.wikiquote.org/wiki/*
// @include         http*://*.wikinews.org/wiki/*
// ==/UserScript==

(function(){

   /////////////// CONFIG
   var asMyLangs = ['en','pl','es','ru', 'fr'];
   var sMyColor = '#e00';
   var asValidDomains = [
      "wikimedia.org", "wikipedia.org", "wiktionary.org", "wikiversity.org",
      "wikisource.org", "wikibooks.org", "wikiquote.org", "wikinews.org"];

   /////////////// DO NOT CHANGE BELOW THIS LINE
   function endsWith(str, suffix) {
       return str.indexOf(suffix, str.length - suffix.length) !== -1;
   }
   function startsWith(str, prefix) {
      return str.indexOf(prefix) === 0;
   }

   var sCurrentPageLangCode = document.URL.match(/([a-z]+)\.[a-z]+\.[a-z]+/)[1];
   var bHttps = startsWith(document.URL, 'https');
   var sProtocol = bHttps ? 'https' : 'http';

   var sRealSecondLevelDomain = null; // from URI
   var sLinkSecondLevelDomain = null; // from 'sRealSecondLevelDomain', but may later change in special case
   var oHeading = document.getElementById('firstHeading'); // will be enriched by inter-language links

   // obtain current domain
   for(var i=0; i<asValidDomains.length; ++i)
   {
      if(endsWith(document.domain,asValidDomains[i])){
         sRealSecondLevelDomain = sLinkSecondLevelDomain = asValidDomains[i];
         break;
      }
   }

   // special case for https://secure.wikimedia.org
   if(bHttps && sLinkSecondLevelDomain === 'wikimedia.org'){
      var sRelativeUrl = document.URL.replace('https://secure.wikimedia.org/','');
      var idxSlash = sRelativeUrl.indexOf('/');
      var sWikiProject = sRelativeUrl.substr(0,idxSlash);
      sLinkSecondLevelDomain = sWikiProject + '.org';
   }
  
   // modify only once: add child nodes to the original heading
   if(!oHeading.children.length && sLinkSecondLevelDomain !== null)
   {
      // get available translations by XPath
      var aTranslations = document.evaluate("//div[@id='p-lang']/div/ul/li/a", document, null, XPathResult.ANY_TYPE,null);
      var bFound = false;
      var sToAdd = '';

      // iterate over translations
      for(var oTranslation; oTranslation = aTranslations.iterateNext(); )
      {
         // iterate over favorite langs to see if there's a match
         for(var sLangCode in asMyLangs){
            if(oTranslation.href.indexOf('://'+asMyLangs[sLangCode]+'.') > -1){ // sProtocol + .. //'.'+sLinkSecondLevelDomain
               sTCurrLangCode = asMyLangs[sLangCode];
               bFound = true;
               break;
            }
         }

         if(bFound && sTCurrLangCode != sCurrentPageLangCode){
            var sTCurrHref = oTranslation.href;
            if(bHttps){
               sTCurrHref = sTCurrHref.replace('http://','https://'); // due to bug in some https wiki versions other than https://secure.wikimedia.org
            }

            var sTCurrText = sTCurrHref.replace(sProtocol+'://'+sTCurrLangCode+'.'+sLinkSecondLevelDomain+'/wiki/','');
            sTCurrText = sTCurrText.replace(/_/g,' ');
            if(sTCurrText == ''){
               sTCurrText = oTranslation.innerHTML; // happens e.g. on main page of Wikiquote
            }else{
               sTCurrText = decodeURIComponent(sTCurrText);
            }

            sToAdd += ' / <span style="font-size:xx-small">('+sTCurrLangCode+')</span><a href="'+sTCurrHref+'"><em style="color:'+sMyColor+';">' + sTCurrText + '</em></a>';
         }

         bFound = false; // for the next iteration
      }

      var oHeading = document.getElementById('firstHeading');
      oHeading.innerHTML += sToAdd;
   }
})();
