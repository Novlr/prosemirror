"use strict";

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

function t(name, doc, expect) {
  (0, _tests.defTest)("slice_" + name, function () {
    if (doc.tag.a && doc.tag.b) (0, _cmp.cmpNode)(doc.sliceBetween(doc.tag.a, doc.tag.b), expect);else if (doc.tag.a) (0, _cmp.cmpNode)(doc.sliceBetween(null, doc.tag.a), expect);else (0, _cmp.cmpNode)(doc.sliceBetween(doc.tag.b, null), expect);
  });
}

t("before", (0, _build.doc)((0, _build.p)("hello<a> world")), (0, _build.doc)((0, _build.p)("hello")));
t("before_everything", (0, _build.doc)((0, _build.p)("hello<a>")), (0, _build.doc)((0, _build.p)("hello")));
t("before_rest", (0, _build.doc)((0, _build.p)("hello<a> world"), (0, _build.p)("rest")), (0, _build.doc)((0, _build.p)("hello")));
t("before_styled", (0, _build.doc)((0, _build.p)("hello ", (0, _build.em)("WOR<a>LD"))), (0, _build.doc)((0, _build.p)("hello ", (0, _build.em)("WOR"))));
t("before_2nd", (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b<a>")), (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")));

t("after", (0, _build.doc)((0, _build.p)("hello<b> world")), (0, _build.doc)((0, _build.p)(" world")));
t("after_everythin", (0, _build.doc)((0, _build.p)("<b>hello")), (0, _build.doc)((0, _build.p)("hello")));
t("after_rest", (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("bar<b>baz")), (0, _build.doc)((0, _build.p)("baz")));
t("after_styled", (0, _build.doc)((0, _build.p)("a sentence with an ", (0, _build.em)("emphasized ", (0, _build.a)("li<b>nk")), " in it")), (0, _build.doc)((0, _build.p)((0, _build.em)((0, _build.a)("nk")), " in it")));
t("after_among_styled", (0, _build.doc)((0, _build.p)("a ", (0, _build.em)("sentence"), " wi<b>th ", (0, _build.em)("text"), " in it")), (0, _build.doc)((0, _build.p)("th ", (0, _build.em)("text"), " in it")));

t("between", (0, _build.doc)((0, _build.p)("hell<a>o wo<b>rld")), (0, _build.doc)((0, _build.p)("o wo")));
t("between_paragraphs", (0, _build.doc)((0, _build.p)("on<a>e"), (0, _build.p)("t<b>wo")), (0, _build.doc)((0, _build.p)("e"), (0, _build.p)("t")));
t("between_across_inline", (0, _build.doc)((0, _build.p)("here's noth<a>ing and ", (0, _build.em)("here's e<b>m"))), (0, _build.doc)((0, _build.p)("ing and ", (0, _build.em)("here's e"))));
t("between_different_depth", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("hello")), (0, _build.li)((0, _build.p)("wo<a>rld")), (0, _build.li)((0, _build.p)("x"))), (0, _build.p)((0, _build.em)("bo<b>o"))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("rld")), (0, _build.li)((0, _build.p)("x"))), (0, _build.p)((0, _build.em)("bo"))));