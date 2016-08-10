"use strict";

var _replace = require("../transform/replace");

var _map = require("../transform/map");

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

function test(name, doc, insert, expected, moved) {
     (0, _tests.defTest)("replace_inner_" + name, function () {
          var sliced = insert.sliceBetween(insert.tag.a, insert.tag.b);
          var repl = void 0;
          for (var left = insert.tag.a, right = insert.tag.b, i = 0, node = sliced;; i++) {
               if (i == left.path.length || i == right.path.length || left.path[i] != right.path[i] || insert.tag.root && i == insert.tag.root.path.length) {
                    repl = { content: node.content, openLeft: left.path.length - i, openRight: right.path.length - i };
                    break;
               }
               node = node.child(left.path[i]);
          }
          var result = (0, _replace.replace)(doc, doc.tag.a, doc.tag.b, doc.tag.root.path, repl);
          (0, _cmp.cmpNode)(result.doc, expected);
          if (moved) (0, _cmp.cmpStr)("\n" + result.moved.join("\n"), "\n" + moved.join("\n"));
     });
}

test("delete_join", (0, _build.doc)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")), (0, _build.doc)("<a><b>"), (0, _build.doc)((0, _build.p)("onwo")), [new _map.MovedRange((0, _cmp.P)(2), 0, new _cmp.P(1)), new _map.MovedRange((0, _cmp.P)(1, 1), 2, (0, _cmp.P)(0, 2))]);

test("merge_simple", (0, _build.doc)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.p)("xx<a>xx"), (0, _build.p)("yy<b>yy")), (0, _build.doc)((0, _build.p)("onxx"), (0, _build.p)("yywo")), [new _map.MovedRange((0, _cmp.P)(1, 1), 2, (0, _cmp.P)(1, 2))]);

test("not_open", (0, _build.doc)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")), (0, _build.doc)("<a>", (0, _build.p)("x"), (0, _build.p)("y"), "<b>"), (0, _build.doc)((0, _build.p)("on"), (0, _build.p)("x"), (0, _build.p)("y"), (0, _build.p)("wo")), [new _map.MovedRange((0, _cmp.P)(2), 0, (0, _cmp.P)(4)), new _map.MovedRange((0, _cmp.P)(1, 1), 2, (0, _cmp.P)(3, 0))]);

test("replace_with_text", (0, _build.doc)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")), (0, _build.doc)("<root>", (0, _build.p)("<a>H<b>")), (0, _build.doc)((0, _build.p)("onHwo")), [new _map.MovedRange((0, _cmp.P)(2), 0, (0, _cmp.P)(1)), new _map.MovedRange((0, _cmp.P)(1, 1), 2, (0, _cmp.P)(0, 3))]);

test("non_matching", (0, _build.doc)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")), (0, _build.doc)("<root>", (0, _build.h1)("<a>H<b>")), (0, _build.doc)((0, _build.p)("on"), (0, _build.h1)("H"), (0, _build.p)("wo")), [new _map.MovedRange((0, _cmp.P)(2), 0, (0, _cmp.P)(3)), new _map.MovedRange((0, _cmp.P)(1, 1), 2, (0, _cmp.P)(2, 0))]);

test("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("on<a>e"), "<root>", (0, _build.p)("t<b>wo")))), (0, _build.doc)("<root>", (0, _build.p)("<a>H<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("onHwo")))), [new _map.MovedRange((0, _cmp.P)(0, 0, 2), 0, (0, _cmp.P)(0, 0, 1)), new _map.MovedRange((0, _cmp.P)(0, 0, 1, 1), 2, (0, _cmp.P)(0, 0, 0, 3))]);

test("same_block", (0, _build.doc)((0, _build.p)("a<a><root>bc<b>d")), (0, _build.doc)((0, _build.p)("x<a>y<b>z")), (0, _build.doc)((0, _build.p)("ayd")), [new _map.MovedRange((0, _cmp.P)(0, 3), 1, (0, _cmp.P)(0, 2))]);

test("deep_lopsided", (0, _build.doc)((0, _build.blockquote)("<root>", (0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("two"), "<b>", (0, _build.p)("three")))), (0, _build.doc)("<root>", (0, _build.blockquote)((0, _build.p)("aa<a>aa"), (0, _build.p)("bb"), (0, _build.p)("cc"), "<b>", (0, _build.p)("dd"))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("onaa"), (0, _build.p)("bb"), (0, _build.p)("cc"), (0, _build.p)("three")))), [new _map.MovedRange((0, _cmp.P)(0, 0, 2), 1, (0, _cmp.P)(0, 0, 3))]);

test("deep_lopsided_mismatched", (0, _build.doc)((0, _build.blockquote)("<root>", (0, _build.blockquote)((0, _build.p)("one"), "<a>", (0, _build.p)("two"), (0, _build.p)("th<b>ree")))), (0, _build.doc)("<root>", (0, _build.blockquote)((0, _build.p)("aa<a>aa"), (0, _build.p)("bb"), (0, _build.p)("cc"), "<b>", (0, _build.p)("dd"))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("one"), (0, _build.p)("aa"), (0, _build.p)("bb"), (0, _build.p)("cc"), (0, _build.p)("ree")))), [new _map.MovedRange((0, _cmp.P)(0, 0, 3), 0, (0, _cmp.P)(0, 0, 5)), new _map.MovedRange((0, _cmp.P)(0, 0, 2, 2), 3, (0, _cmp.P)(0, 0, 4, 0))]);