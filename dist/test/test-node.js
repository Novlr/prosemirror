"use strict";

var _model = require("../model");

var _build = require("./build");

var _failure = require("./failure");

var _tests = require("./tests");

var _cmp = require("./cmp");

function str(name, node, str) {
  (0, _tests.defTest)("node_string_" + name, function () {
    return (0, _cmp.cmpStr)(node, str);
  });
}

str("nesting", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hey"), (0, _build.p)()), (0, _build.li)((0, _build.p)("foo")))), 'doc(bullet_list(list_item(paragraph("hey"), paragraph), list_item(paragraph("foo"))))');

str("inline_element", (0, _build.doc)((0, _build.p)("foo", _build.img, _build.br, "bar")), 'doc(paragraph("foo", image, hard_break, "bar"))');

str("marks", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("bar", (0, _build.strong)("quux")), (0, _build.code)("baz"))), 'doc(paragraph("foo", em("bar"), em(strong("quux")), code("baz")))');

function slice(name, doc, sliced) {
  (0, _tests.defTest)("node_slice_" + name, function () {
    return (0, _cmp.cmpNode)(doc.sliceBetween(doc.tag.a, doc.tag.b), sliced);
  });
}

slice("block", (0, _build.doc)((0, _build.p)("foo"), "<a>", (0, _build.p)("bar"), "<b>", (0, _build.p)("baz")), (0, _build.doc)((0, _build.p)("bar")));

slice("text", (0, _build.doc)((0, _build.p)("0"), (0, _build.p)("foo<a>bar<b>baz"), (0, _build.p)("2")), (0, _build.doc)((0, _build.p)("bar")));

slice("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a"), (0, _build.p)("b<a>c")), (0, _build.li)((0, _build.p)("d")), "<b>", (0, _build.li)((0, _build.p)("e"))), (0, _build.p)("3"))), (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("c")), (0, _build.li)((0, _build.p)("d"))))));

slice("left", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<b>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo"))));

slice("right", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>bar"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("bar"))));

slice("inline", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("ba<a>r", _build.img, (0, _build.strong)("baz"), _build.br), "qu<b>ux", (0, _build.code)("xyz"))), (0, _build.doc)((0, _build.p)((0, _build.em)("r", _build.img, (0, _build.strong)("baz"), _build.br), "qu")));

function append(name, doc, result) {
  (0, _tests.defTest)("node_append_" + name, function () {
    var base = doc.path(doc.tag.to.path);
    var before = base.content.slice(0, doc.tag.to.offset);
    var after = doc.path(doc.tag.from.path).content.slice(doc.tag.from.offset);
    (0, _cmp.cmpNode)(base.copy(before.append(after)), result.nodeAfter(result.tag.here));
  });
}

append("blocks", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("a"), "<to>", (0, _build.p)("b")), (0, _build.blockquote)("<from>", (0, _build.p)("c"))), (0, _build.doc)("<here>", (0, _build.blockquote)((0, _build.p)("a"), (0, _build.p)("c"))));

append("inline", (0, _build.doc)((0, _build.p)("foo<to>bar"), (0, _build.p)("baz<from>quux")), (0, _build.doc)("<here>", (0, _build.p)("fooquux")));

append("inline_styled", (0, _build.doc)((0, _build.p)((0, _build.em)((0, _build.strong)("foo<to>bar"))), (0, _build.p)((0, _build.code)("baz<from>quux"))), (0, _build.doc)("<here>", (0, _build.p)((0, _build.em)((0, _build.strong)("foo")), (0, _build.code)("quux"))));

function between(name, doc) {
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    nodes[_key - 2] = arguments[_key];
  }

  (0, _tests.defTest)("node_between_" + name, function () {
    var i = 0;
    doc.nodesBetween(doc.tag.a, doc.tag.b, function (node, path) {
      if (i == nodes.length) throw new _failure.Failure("More nodes iterated than listed (" + node.type.name + ")");
      var compare = node.isText ? node.text : node.type.name;
      if (compare != nodes[i++]) throw new _failure.Failure("Expected " + JSON.stringify(nodes[i - 1]) + ", got " + JSON.stringify(compare));
      if (doc.path(path).type != node.type) throw new _failure.Failure("Path " + path.join("/") + " does not go to node " + compare);
    });
  });
}

between("text", (0, _build.doc)((0, _build.p)("foo<a>bar<b>baz")), "doc", "paragraph", "bar");

between("deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("f<a>oo")), (0, _build.p)("b"), "<b>"), (0, _build.p)("c"))), "doc", "blockquote", "bullet_list", "list_item", "paragraph", "oo", "paragraph", "b");

between("inline", (0, _build.doc)((0, _build.p)("f<a>oo", (0, _build.em)("bar", _build.img, (0, _build.strong)("baz"), _build.br), "quux", (0, _build.code)("xy<b>z"))), "doc", "paragraph", "oo", "bar", "image", "baz", "hard_break", "quux", "xy");

function testIter(iter, results) {
  for (var i = 0;; i += 2) {
    if (i == results.length) {
      if (iter.atEnd()) return;
      throw new _failure.Failure("More iter results than expected");
    } else if (iter.atEnd()) {
      throw new _failure.Failure("Less iter results than expected");
    }
    var node = iter.next();
    var compare = node.isText ? node.text : node.type.name;
    if (results[i] != compare) throw new _failure.Failure("Unexpected iter result: " + JSON.stringify(compare) + " instead of " + JSON.stringify(results[i]));
    if (results[i + 1] != iter.offset) throw new _failure.Failure("Unexpected iter offset: " + iter.offset + " instead of " + results[i + 1]);
  }
}

function iter(name, doc) {
  for (var _len2 = arguments.length, results = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    results[_key2 - 2] = arguments[_key2];
  }

  (0, _tests.defTest)("node_iter_" + name, function () {
    var target = doc.path(doc.tag.a.path);
    testIter(target.iter(doc.tag.a.offset, doc.tag.b && doc.tag.b.offset), results);
  });
}

function riter(name, doc) {
  for (var _len3 = arguments.length, results = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
    results[_key3 - 2] = arguments[_key3];
  }

  (0, _tests.defTest)("node_riter_" + name, function () {
    var target = doc.path(doc.tag.a.path);
    testIter(target.reverseIter(doc.tag.a.offset, doc.tag.b && doc.tag.b.offset), results);
  });
}

iter("block", (0, _build.doc)("<a>", (0, _build.p)("foo"), (0, _build.blockquote)((0, _build.p)("bar"))), "paragraph", 1, "blockquote", 2);
riter("block", (0, _build.doc)((0, _build.p)("foo"), (0, _build.blockquote)((0, _build.p)("bar")), "<a>"), "blockquote", 1, "paragraph", 0);

iter("block_partial", (0, _build.doc)((0, _build.p)("foo"), "<a>", (0, _build.p)("bar"), (0, _build.h1)("baz"), "<b>", (0, _build.p)("quux")), "paragraph", 2, "heading", 3);
riter("block_partial", (0, _build.doc)((0, _build.p)("foo"), "<b>", (0, _build.p)("bar"), (0, _build.h1)("baz"), "<a>", (0, _build.p)("quux")), "heading", 2, "paragraph", 1);

iter("inline", (0, _build.doc)((0, _build.p)("<a>foo", _build.img, (0, _build.em)("bar", (0, _build.strong)("baz")), "quux")), "foo", 3, "image", 4, "bar", 7, "baz", 10, "quux", 14);
riter("inline", (0, _build.doc)((0, _build.p)("foo", _build.img, (0, _build.em)("bar", (0, _build.strong)("baz")), "quux<a>")), "quux", 10, "baz", 7, "bar", 4, "image", 3, "foo", 0);

iter("inline_partial", (0, _build.doc)((0, _build.p)("foo", _build.img, (0, _build.em)("ba<a>r", _build.img, (0, _build.strong)("baz")), "qu<b>ux")), "r", 7, "image", 8, "baz", 11, "qu", 13);
riter("inline_partial", (0, _build.doc)((0, _build.p)("fo<b>o", _build.img, (0, _build.em)("bar", (0, _build.strong)("ba<a>z")), "quux")), "ba", 7, "bar", 4, "image", 3, "o", 2);

iter("inline_contained", (0, _build.doc)((0, _build.p)("foo<a>bar<b>baz")), "bar", 6);
riter("inline_contained", (0, _build.doc)((0, _build.p)("foo<b>bar<a>baz")), "bar", 3);

function from(name, arg, expect) {
  (0, _tests.defTest)("node_fragment_from_" + name, function () {
    var result = _model.Fragment.from(arg),
        i = 0;
    for (var it = result.iter(), cur; cur = it.next().value; i++) {
      if (i == expect.length) {
        i++;break;
      }
      (0, _cmp.cmpNode)(cur, expect[i], "child " + i);
    }
    (0, _cmp.is)(i == expect.length, "same size");
  });
}

from("single", _model.defaultSchema.node("paragraph"), [_model.defaultSchema.node("paragraph")]);

from("array", [_model.defaultSchema.node("hard_break"), _model.defaultSchema.text("foo")], [_model.defaultSchema.node("hard_break"), _model.defaultSchema.text("foo")]);

from("fragment", (0, _build.doc)((0, _build.p)("foo")).content, [_model.defaultSchema.node("paragraph", null, [_model.defaultSchema.text("foo")])]);

from("null", null, []);

from("append", [_model.defaultSchema.text("a"), _model.defaultSchema.text("b")], [_model.defaultSchema.text("ab")]);