"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("history");

function type(pm, text) {
  pm.tr.insertText(pm.selection.head, text).apply();
}

function cutHistory(pm) {
  pm.history.lastAddedAt = 0;
}

test("undo", function (pm) {
  type(pm, "a");
  type(pm, "b");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("redo", function (pm) {
  type(pm, "a");
  type(pm, "b");
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
});

test("multiple", function (pm) {
  type(pm, "a");
  cutHistory(pm);
  type(pm, "b");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("ab")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a")));
});

test("unsynced", function (pm) {
  type(pm, "hello");
  pm.tr.insertText((0, _cmp.P)(0, 0), "oops").apply({ addToHistory: false });
  pm.tr.insertText((0, _cmp.P)(0, 9), "!").apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("oops!")));
});

test("unsynced_complex", function (pm) {
  type(pm, "hello");
  cutHistory(pm);
  type(pm, "!");
  pm.tr.insertText((0, _cmp.P)(0, 0), "....").apply();
  pm.tr.split((0, _cmp.P)(0, 2)).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)(".."), (0, _build.p)("..hello!")));
  pm.tr.split((0, _cmp.P)(0, 1)).apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("."), (0, _build.p)("...hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("."), (0, _build.p)("...")));
});

test("overlapping", function (pm) {
  type(pm, "hello");
  cutHistory(pm);
  pm.tr.delete((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 5)).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("overlapping_no_collapse", function (pm) {
  pm.history.allowCollapsing = false;
  type(pm, "hello");
  cutHistory(pm);
  pm.tr.delete((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 5)).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("overlapping_unsynced_delete", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  type(pm, "hello");
  pm.tr.delete((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 7)).apply({ addToHistory: false });
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()));
});

test("ping_pong", function (pm) {
  type(pm, "one");
  type(pm, " two");
  cutHistory(pm);
  type(pm, " three");
  pm.tr.insertText((0, _cmp.P)(0, 0), "zero ").apply();
  cutHistory(pm);
  pm.tr.split((0, _cmp.P)(0, 0)).apply();
  pm.setTextSelection((0, _cmp.P)(0, 0));
  type(pm, "top");
  for (var i = 0; i < 6; i++) {
    var re = i % 2;
    for (var j = 0; j < 4; j++) {
      (0, _cmp.cmp)(pm.history[re ? "redo" : "undo"](), j < 3);
    }(0, _cmp.cmpNode)(pm.doc, re ? (0, _build.doc)((0, _build.p)("top"), (0, _build.p)("zero one two three")) : (0, _build.doc)((0, _build.p)()));
  }
});

test("ping_pong_unsynced", function (pm) {
  type(pm, "one");
  type(pm, " two");
  cutHistory(pm);
  pm.tr.insertText(pm.selection.head, "xxx").apply({ addToHistory: false });
  type(pm, " three");
  pm.tr.insertText((0, _cmp.P)(0, 0), "zero ").apply();
  cutHistory(pm);
  pm.tr.split((0, _cmp.P)(0, 0)).apply();
  pm.setTextSelection((0, _cmp.P)(0, 0));
  type(pm, "top");
  pm.tr.insertText((0, _cmp.P)(0, 0), "yyy").apply({ addToHistory: false });
  pm.tr.insertText((0, _cmp.P)(0, 6), "zzz").apply({ addToHistory: false });
  for (var i = 0; i < 6; i++) {
    var re = i % 2;
    for (var j = 0; j < 4; j++) {
      (0, _cmp.cmp)(pm.history[re ? "redo" : "undo"](), j < 3);
    }(0, _cmp.cmpNode)(pm.doc, re ? (0, _build.doc)((0, _build.p)("yyytopzzz"), (0, _build.p)("zero one twoxxx three")) : (0, _build.doc)((0, _build.p)("yyyzzz"), (0, _build.p)("xxx")));
  }
});

test("compressable", function (pm) {
  type(pm, "XY");
  pm.setTextSelection((0, _cmp.P)(0, 1));
  cutHistory(pm);
  type(pm, "one");
  type(pm, "two");
  type(pm, "three");
  pm.tr.insertText((0, _cmp.P)(0, 13), "!").apply({ addToHistory: false });
  pm.history.done.startCompression(pm.doc);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("XonetwothreeY!")));
  pm.execCommand("undo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("XY!")));
  (0, _cmp.cmpStr)(pm.selection.anchor, (0, _cmp.P)(0, 1));
  pm.execCommand("redo");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("XonetwothreeY!")));
  (0, _cmp.cmpStr)(pm.selection.anchor, (0, _cmp.P)(0, 12));
});

test("setDocResets", function (pm) {
  type(pm, "hello");
  pm.setDoc((0, _build.doc)((0, _build.p)("aah")));
  (0, _cmp.cmp)(pm.history.undo(), false);
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("aah")));
}, { doc: (0, _build.doc)((0, _build.p)("okay")) });

test("isAtVersion", function (pm) {
  type(pm, "hello");
  cutHistory(pm);
  var version = pm.history.getVersion();
  type(pm, "ok");
  (0, _cmp.is)(!pm.history.isAtVersion(version), "ahead");
  pm.history.undo();
  (0, _cmp.is)(pm.history.isAtVersion(version), "went back");
  pm.history.undo();
  (0, _cmp.is)(!pm.history.isAtVersion(version), "behind");
  pm.history.redo();
  (0, _cmp.is)(pm.history.isAtVersion(version), "went forward");
});

test("rollback", function (pm) {
  type(pm, "hello");
  var version = pm.history.getVersion();
  type(pm, "ok");
  cutHistory(pm);
  type(pm, "more");
  (0, _cmp.is)(pm.history.backToVersion(version), "rollback");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")), "back to start");
  (0, _cmp.is)(pm.history.backToVersion(version), "no-op rollback");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hello")), "no-op had no effect");
  pm.history.undo();
  (0, _cmp.is)(!pm.history.backToVersion(version), "failed rollback");
});

test("setSelectionOnUndo", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  pm.setTextSelection((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 2));
  var selection = pm.selection;
  pm.tr.replaceWith(selection.from, selection.to, pm.schema.text("hello")).apply();
  var selection2 = pm.selection;
  pm.execCommand("undo");
  (0, _cmp.is)(pm.selection.eq(selection), "failed restoring selection after undo");
  pm.execCommand("redo");
  (0, _cmp.is)(pm.selection.eq(selection2), "failed restoring selection after redo");
});

test("rebaseSelectionOnUndo", function (pm) {
  type(pm, "hi");
  cutHistory(pm);
  pm.setTextSelection((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 2));
  pm.tr.insert((0, _cmp.P)(0, 0), pm.schema.text("hello")).apply();
  pm.tr.insert((0, _cmp.P)(0, 0), pm.schema.text("---")).apply({ addToHistory: false });
  pm.execCommand("undo");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 5));
});