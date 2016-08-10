"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var _tests = require("../tests");

var _input = require("../../edit/input");

var _edit = require("../../edit");

var _model = require("../../model");

function trace(prop) {
  return function (pm) {
    return pm.mod[prop] = (pm.mod[prop] || 0) + 1;
  };
}

var extraMap = new _edit.Keymap({
  "'B'": trace("b"),
  "Ctrl-X C": trace("c"),
  "Ctrl-A": trace("a")
});

var test = (0, _def.namespace)("keys", {
  doc: (0, _build.doc)((0, _build.p)("foo"))
});

var event = { preventDefault: function preventDefault() {
    return null;
  } };
function dispatch(pm, key) {
  (0, _input.dispatchKey)(pm, key, event);
}

test("basic", function (pm) {
  pm.addKeymap(extraMap);
  dispatch(pm, "'B'");
  dispatch(pm, "'B'");
  (0, _cmp.cmp)(pm.mod.b, 2);
});

test("multi", function (pm) {
  pm.addKeymap(extraMap);
  dispatch(pm, "Ctrl-X");
  dispatch(pm, "C");
  dispatch(pm, "Ctrl-X");
  dispatch(pm, "C");
  (0, _cmp.cmp)(pm.mod.c, 2);
});

test("addKeymap", function (pm) {
  pm.addKeymap(extraMap);
  var map = new _edit.Keymap({ "Ctrl-A": trace("a2") });
  pm.addKeymap(map, 10);
  dispatch(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a, undefined);
  (0, _cmp.cmp)(pm.mod.a2, 1);
  pm.removeKeymap(map);
  dispatch(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a, 1);
  (0, _cmp.cmp)(pm.mod.a2, 1);
});

test("addKeymap_bottom", function (pm) {
  pm.addKeymap(extraMap);
  var mapTop = new _edit.Keymap({ "Ctrl-A": trace("a2") });
  var mapBot = new _edit.Keymap({ "Ctrl-A": trace("a3"), "Ctrl-D": trace("d") });
  pm.addKeymap(mapTop, 10);
  pm.addKeymap(mapBot, 60);
  dispatch(pm, "Ctrl-A");
  (0, _cmp.cmp)(pm.mod.a2, 1);
  (0, _cmp.cmp)(pm.mod.a3, undefined);
  dispatch(pm, "Ctrl-D");
  (0, _cmp.cmp)(pm.mod.d, 1);
  pm.removeKeymap(mapBot);
  dispatch(pm, "Ctrl-D");
  (0, _cmp.cmp)(pm.mod.d, 1);
});

test("multiBindings", function (pm) {
  dispatch(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)("foo")));
  pm.setTextSelection(new _model.Pos([1, 0, 0], 3));
  dispatch(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def")), (0, _build.li)((0, _build.p)())), (0, _build.p)("foo")));
  dispatch(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)(), (0, _build.p)("foo")));
  pm.setTextSelection(new _model.Pos([3], 1));
  dispatch(pm, "Enter");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.pre)("\nabc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)(), (0, _build.p)("f"), (0, _build.p)("oo")));
}, {
  doc: (0, _build.doc)((0, _build.pre)("abc"), (0, _build.ul)((0, _build.li)((0, _build.p)("def"))), (0, _build.p)("foo"))
});

(0, _tests.defTest)("keys_add_inconsistent", function () {
  var map = new _edit.Keymap({ "Ctrl-A": "foo", "Ctrl-B Ctrl-C": "quux" });
  try {
    map.addBinding("Ctrl-A", "bar");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-A Ctrl-X", "baz");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
  try {
    map.addBinding("Ctrl-B", "bak");
    (0, _cmp.is)(false);
  } catch (e) {
    if (!/Inconsistent/.test(e.toString())) throw e;
  }
});

(0, _tests.defTest)("keys_add_consistent", function () {
  var map = new _edit.Keymap({ "Ctrl-A Ctrl-B": "foo", "Ctrl-A Ctrl-C": "bar" });
  map.removeBinding("Ctrl-A Ctrl-B");
  map.removeBinding("Ctrl-A Ctrl-C");
  map.addBinding("Ctrl-A", "quux");
});