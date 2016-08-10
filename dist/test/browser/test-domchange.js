"use strict";

var _domchange = require("../../edit/domchange");

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var _testSelection = require("./test-selection");

var test = (0, _def.namespace)("domchange", { doc: (0, _build.doc)((0, _build.p)("hello")) });

function apply(pm) {
  (0, _domchange.readDOMChange)(pm).run();
}

test("add_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "heLllo";
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("heLllo")));
});

test("remove_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "heo";
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("heo")));
});

test("add_node", function (pm) {
  var txt = (0, _testSelection.findTextNode)(pm.content, "hello");
  txt.parentNode.appendChild(document.createTextNode("!"));
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello!")));
});

test("add_em_node", function (pm) {
  var txt = (0, _testSelection.findTextNode)(pm.content, "hello");
  txt.parentNode.appendChild(document.createElement("em")).appendChild(document.createTextNode("!"));
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello", (0, _build.em)("!"))));
});

test("kill_node", function (pm) {
  var txt = (0, _testSelection.findTextNode)(pm.content, "hello");
  txt.parentNode.removeChild(txt);
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("add_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hey"));
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hey"), (0, _build.p)("hello")));
});

test("add_duplicate_paragraph", function (pm) {
  pm.content.insertBefore(document.createElement("p"), pm.content.firstChild).appendChild(document.createTextNode("hello"));
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello"), (0, _build.p)("hello")));
});

test("add_repeated_text", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "helhello";
  apply(pm);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("helhello")));
});

test("detect_enter", function (pm) {
  (0, _testSelection.findTextNode)(pm.content, "hello").nodeValue = "hel";
  pm.content.appendChild(document.createElement("p")).innerHTML = "lo";
  var change = (0, _domchange.readDOMChange)(pm);
  (0, _cmp.cmp)(change && change.type, "enter");
});