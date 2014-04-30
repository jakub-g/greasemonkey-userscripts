// ==UserScript==
// @name         Aria Templates GitHub repo navigation
// @description  Puts links on entries in $extends and $dependencies to refer to particular classes.
// @namespace    http://jakub-g.github.io
// @include      https://github.com/*/ariatemplates/blob/*
// @icon         http://ariatemplates.com/favicon.ico
// @version      0.1
// @grant        none
// ==/UserScript==

var classpathToPath = function (classpath) {
   var path = classpath.replace(/\./g, "/");
   if (path.slice(0, 4) == "aria") {
      path = "src/" + path;
   }
   return path;
};

var urlPrefix = document.URL.match(/\/\/github\.com\/[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+\//); // /user/repo/blob/branchname/

[].slice.apply(document.querySelectorAll(".s2, .s1")).forEach(function(itm){
 if (itm.previousElementSibling && itm.previousElementSibling.previousElementSibling
    && itm.previousElementSibling.previousElementSibling.textContent == "$classpath") {
    return; // don't put link to itself, this doesn't make sense
 }

 var classpath = itm.textContent.match ( /(test|aria)(\.[a-zA-Z0-9]+)+/ );
 if (classpath) {
   var path = classpathToPath(classpath[0]);
   var link = urlPrefix + path + ".js";
   itm.innerHTML = '<a href="' + link + '">' + itm.innerHTML + '</a>';
   console.log(itm, itm.textContent)
 }
});
