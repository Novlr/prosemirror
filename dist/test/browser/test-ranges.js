"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("ranges", { doc: (0, _build.doc)((0, _build.p)("hello")) });

test("preserve", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 4));
  (0, _cmp.cmpStr)(range.from, (0, _cmp.P)(0, 1));
  (0, _cmp.cmpStr)(range.to, (0, _cmp.P)(0, 4));
  pm.tr.insertText((0, _cmp.P)(0, 0), "A").insertText((0, _cmp.P)(0, 1), "B").apply();
  (0, _cmp.cmpStr)(range.from, (0, _cmp.P)(0, 3));
  (0, _cmp.cmpStr)(range.to, (0, _cmp.P)(0, 6));
  pm.tr.delete((0, _cmp.P)(0, 4), (0, _cmp.P)(0, 5)).apply();
  (0, _cmp.cmpStr)(range.from, (0, _cmp.P)(0, 3));
  (0, _cmp.cmpStr)(range.to, (0, _cmp.P)(0, 5));
});

test("leftInclusive", function (pm) {
  var range1 = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2), { inclusiveLeft: true });
  var range2 = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2), { inclusiveLeft: false });
  pm.tr.insertText((0, _cmp.P)(0, 1), "X").apply();
  (0, _cmp.cmpStr)(range1.from, (0, _cmp.P)(0, 1));
  (0, _cmp.cmpStr)(range2.from, (0, _cmp.P)(0, 2));
});

test("rightInclusive", function (pm) {
  var range1 = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2), { inclusiveRight: true });
  var range2 = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2), { inclusiveRight: false });
  pm.tr.insertText((0, _cmp.P)(0, 2), "X").apply();
  (0, _cmp.cmpStr)(range1.to, (0, _cmp.P)(0, 3));
  (0, _cmp.cmpStr)(range2.to, (0, _cmp.P)(0, 2));
});

test("deleted", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2)),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.tr.insertText((0, _cmp.P)(0, 1), "A").apply();
  (0, _cmp.cmp)(cleared, false);
  pm.tr.delete((0, _cmp.P)(0, 2), (0, _cmp.P)(0, 4)).apply();
  (0, _cmp.cmp)(cleared, true);
  (0, _cmp.cmp)(range.from, null);
});

test("cleared", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2)),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.removeRange(range);
  (0, _cmp.cmp)(cleared, true);
  (0, _cmp.cmp)(range.from, null);
});

test("stay_when_empty", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 2), { removeWhenEmpty: false }),
      cleared = false;
  range.on("removed", function () {
    return cleared = true;
  });
  pm.tr.delete((0, _cmp.P)(0, 0), (0, _cmp.P)(0, 4)).apply();
  (0, _cmp.cmp)(cleared, false);
  (0, _cmp.cmpStr)(range.from, (0, _cmp.P)(0, 0));
  (0, _cmp.cmpStr)(range.to, (0, _cmp.P)(0, 0));
});

test("add_class", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 4), { className: "foo" });
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo").textContent, "ell");
  pm.removeRange(range);
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo"), null);
});

test("add_class_multi_block", function (pm) {
  var range = pm.markRange((0, _cmp.P)(0, 1), (0, _cmp.P)(1, 1, 0, 4), { className: "foo" });
  pm.flush();
  var found = pm.content.querySelectorAll(".foo");
  (0, _cmp.cmp)(found.length, 3);
  (0, _cmp.cmp)(found[0].textContent, "ne");
  (0, _cmp.cmp)(found[1].textContent, "two");
  (0, _cmp.cmp)(found[2].textContent, "thre");
  pm.removeRange(range);
  pm.flush();
  (0, _cmp.cmp)(pm.content.querySelector(".foo"), null);
}, { doc: (0, _build.doc)((0, _build.p)("one"), (0, _build.ul)((0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("three")))) });