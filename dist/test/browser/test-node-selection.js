"use strict";

var _def = require("./def");

var _build = require("../build");

var _cmp = require("../cmp");

var test = (0, _def.namespace)("nodeselection");

test("parent_block", function (pm) {
  pm.setTextSelection((0, _cmp.P)(0, 0, 1, 1));
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 0, 1), "to paragraph");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 0), "to list item");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "to list");
  pm.execCommand("selectParentNode");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "stop at toplevel");
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("foo"), (0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")))) });

test("through_inline_node", function (pm) {
  pm.setTextSelection((0, _cmp.P)(0, 3));
  pm.execCommand("selectNodeRight");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 3), "moved right onto image");
  pm.execCommand("selectNodeRight");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 4), "moved right past");
  (0, _cmp.cmpStr)(pm.selection.anchor, (0, _cmp.P)(0, 4), "moved right past'");
  pm.execCommand("selectNodeLeft");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 3), "moved left onto image");
  pm.execCommand("selectNodeLeft");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 3), "moved left past");
  (0, _cmp.cmpStr)(pm.selection.anchor, (0, _cmp.P)(0, 3), "moved left past'");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar")) });

test("onto_block", function (pm) {
  pm.setTextSelection((0, _cmp.P)(0, 5));
  pm.execCommand("selectNodeDown");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "moved down onto hr");
  pm.setTextSelection((0, _cmp.P)(2, 0, 0, 0));
  pm.execCommand("selectNodeUp");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "moved up onto hr");
}, { doc: (0, _build.doc)((0, _build.p)("hello"), _build.hr, (0, _build.ul)((0, _build.li)((0, _build.p)("there")))) });

test("through_double_block", function (pm) {
  pm.setTextSelection((0, _cmp.P)(0, 0, 5));
  pm.execCommand("selectNodeDown");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "moved down onto hr");
  pm.execCommand("selectNodeDown");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(2), "moved down onto second hr");
  pm.setTextSelection((0, _cmp.P)(3, 0));
  pm.execCommand("selectNodeUp");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(2), "moved up onto second hr");
  pm.execCommand("selectNodeUp");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "moved up onto hr");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hello")), _build.hr, _build.hr, (0, _build.p)("there")) });

test("horizontally_through_block", function (pm) {
  pm.setTextSelection((0, _cmp.P)(0, 3));
  pm.execCommand("selectNodeRight");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "right into first hr");
  pm.execCommand("selectNodeRight");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(2), "right into second hr");
  pm.execCommand("selectNodeRight");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(3, 0), "right out of hr");
  pm.execCommand("selectNodeLeft");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(2), "left into second hr");
  pm.execCommand("selectNodeLeft");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "left into first hr");
  pm.execCommand("selectNodeLeft");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 3), "left out of hr");
}, { doc: (0, _build.doc)((0, _build.p)("foo"), _build.hr, _build.hr, (0, _build.p)("bar")) });

test("block_out_of_image", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 3));
  pm.execCommand("selectNodeDown");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "down into hr");
  pm.setNodeSelection((0, _cmp.P)(2, 0));
  pm.execCommand("selectNodeUp");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "up into hr");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img), _build.hr, (0, _build.p)(_build.img, "bar")) });

test("lift_preserves", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 0, 0, 0));
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hi")))), "lifted");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 0, 0), "preserved selection");
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("hi")), "lifted again");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "preserved selection again");
}, { doc: (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.blockquote)((0, _build.p)("hi"))))) });

test("lift_at_selection_level", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 0));
  pm.execCommand("lift");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b")))), "lifted list");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "preserved selection");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b"))))) });

test("join_precisely_down", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 0));
  (0, _cmp.cmp)(pm.execCommand("joinDown"), false, "don't join parent");
  pm.setNodeSelection((0, _cmp.P)(0));
  pm.execCommand("joinDown");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("bar"))), "joined");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "selected joined node");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))) });

test("join_precisely_up", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(1, 0));
  (0, _cmp.cmp)(pm.execCommand("joinUp"), false, "don't join parent");
  pm.setNodeSelection((0, _cmp.P)(1));
  pm.execCommand("joinUp");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"), (0, _build.p)("bar"))), "joined");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0), "selected joined node");
}, { doc: (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("bar"))) });

test("delete_block", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0));
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))), "paragraph vanished");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 0, 0, 0), "moved to list");
  pm.setNodeSelection((0, _cmp.P)(0, 0, 0));
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))), "delete whole item");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 0, 0, 0), "to next item");
  pm.setNodeSelection((0, _cmp.P)(0, 1));
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("baz")))), "delete last item");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 0, 0, 3), "back to paragraph above");
  pm.setNodeSelection((0, _cmp.P)(0));
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)()), "delete list");
}, { doc: (0, _build.doc)((0, _build.p)("foo"), (0, _build.ul)((0, _build.li)((0, _build.p)("bar")), (0, _build.li)((0, _build.p)("baz")), (0, _build.li)((0, _build.p)("quux")))) });

test("delete_hr", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(1));
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a"), _build.hr, (0, _build.p)("b")), "deleted first hr");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1), "moved to second hr");
  pm.execCommand("deleteSelection");
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")), "deleted second hr");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(1, 0), "moved to paragraph");
}, { doc: (0, _build.doc)((0, _build.p)("a"), _build.hr, _build.hr, (0, _build.p)("b")) });

test("delete_selection", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 3));
  pm.tr.replaceSelection(null).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar"), (0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("ay")), "deleted img");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 3), "cursor at img");
  pm.setNodeSelection((0, _cmp.P)(1, 0));
  pm.tr.deleteSelection().apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar"), (0, _build.p)("ay")), "deleted blockquote");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(1, 0), "cursor moved past");
  pm.setNodeSelection((0, _cmp.P)(1));
  pm.tr.deleteSelection().apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foobar")), "deleted paragraph");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(0, 6), "cursor moved back");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar"), (0, _build.blockquote)((0, _build.p)("hi")), (0, _build.p)("ay")) });

test("replace_selection_inline", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(0, 3));
  pm.tr.replaceSelection(pm.schema.node("hard_break")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo", _build.br, "bar", _build.img, "baz")), "replaced with br");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 4), "after inserted node");
  (0, _cmp.is)(pm.selection.empty, "empty selection");
  pm.setNodeSelection((0, _cmp.P)(0, 7));
  pm.tr.replaceSelection(pm.schema.text("abc")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("foo", _build.br, "barabcbaz")), "replaced with text");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(0, 10), "after text");
  (0, _cmp.is)(pm.selection.empty, "again empty selection");
  pm.setNodeSelection((0, _cmp.P)(0));
  pm.tr.replaceSelection(pm.schema.text("xyz")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("xyz")), "replaced all of paragraph");
}, { doc: (0, _build.doc)((0, _build.p)("foo", _build.img, "bar", _build.img, "baz")) });

test("replace_selection_block", function (pm) {
  pm.setNodeSelection((0, _cmp.P)(1));
  pm.tr.replaceSelection(pm.schema.node("code_block")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("abc"), (0, _build.pre)(), _build.hr, (0, _build.blockquote)((0, _build.p)("ow"))), "replace with code block");
  (0, _cmp.cmpStr)(pm.selection.from, (0, _cmp.P)(2), "moved to hr");
  (0, _cmp.cmp)(pm.tr.replaceSelection(pm.schema.node("list_item")).apply(), false, "can't replace with non-fitting");
  pm.setNodeSelection((0, _cmp.P)(3));
  pm.tr.replaceSelection(pm.schema.node("paragraph")).apply();
  (0, _cmp.cmpNode)(pm.doc, (0, _build.doc)((0, _build.p)("abc"), (0, _build.pre)(), _build.hr, (0, _build.p)()), "replace with paragraph");
  (0, _cmp.cmpStr)(pm.selection.head, (0, _cmp.P)(3, 0));
}, { doc: (0, _build.doc)((0, _build.p)("abc"), _build.hr, _build.hr, (0, _build.blockquote)((0, _build.p)("ow"))) });