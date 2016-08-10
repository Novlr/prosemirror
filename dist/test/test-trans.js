"use strict";

var _model = require("../model");

var _transform = require("../transform");

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

var _testJson = require("./test-json");

function Tr(doc) {
     return new _transform.Transform(doc);
}

function invert(transform) {
     var doc = transform.doc,
         out = Tr(doc);
     for (var i = transform.steps.length - 1; i >= 0; i--) {
          out.step(transform.steps[i].invert(transform.docs[i], transform.maps[i]));
     }return out;
}

function testMapping(maps, pos, newPos, label) {
     var mapped = pos;
     maps.forEach(function (m) {
          return mapped = m.map(mapped, 1).pos;
     });
     (0, _cmp.cmpStr)(mapped, newPos, label);

     var ident = {};
     for (var i = 0; i < maps.length; i++) {
          ident[-i - 1] = i;
     }var remap = new _transform.Remapping(maps.map(function (x) {
          return x.invert();
     }), maps, ident);
     (0, _cmp.cmpStr)(remap.map(newPos, 1).pos, newPos, label + " back");
}

function testTransform(doc, expect, tr) {
     (0, _cmp.cmpNode)(tr.doc, expect);
     var inverted = invert(tr);
     (0, _cmp.cmpNode)(inverted.doc, doc, "inverted");

     (0, _testJson.testStepJSON)(tr);

     for (var tag in expect.tag) {
          testMapping(tr.maps, doc.tag[tag], expect.tag[tag], tag);
     }
}

function add(name, doc, expect, style) {
     (0, _tests.defTest)("addMark_" + name, function () {
          testTransform(doc, expect, Tr(doc).addMark(doc.tag.a, doc.tag.b, style));
     });
}

add("simple", (0, _build.doc)((0, _build.p)("hello <a>there<b>!")), (0, _build.doc)((0, _build.p)("hello ", (0, _build.strong)("there"), "!")), _model.defaultSchema.mark("strong"));
add("double_bold", (0, _build.doc)((0, _build.p)("hello ", (0, _build.strong)("<a>there"), "!<b>")), (0, _build.doc)((0, _build.p)("hello ", (0, _build.strong)("there!"))), _model.defaultSchema.mark("strong"));
add("overlap", (0, _build.doc)((0, _build.p)("one <a>two ", (0, _build.em)("three<b> four"))), (0, _build.doc)((0, _build.p)("one ", (0, _build.strong)("two ", (0, _build.em)("three")), (0, _build.em)(" four"))), _model.defaultSchema.mark("strong"));
add("overwrite_link", (0, _build.doc)((0, _build.p)("this is a ", (0, _build.a)("<a>link<b>"))), (0, _build.doc)((0, _build.p)("this is a ", (0, _build.a2)("link"))), _model.defaultSchema.mark("link", { href: "http://bar" }));
add("code", (0, _build.doc)((0, _build.p)("before"), (0, _build.blockquote)((0, _build.p)("the variable is called <a>i<b>")), (0, _build.p)("after")), (0, _build.doc)((0, _build.p)("before"), (0, _build.blockquote)((0, _build.p)("the variable is called ", (0, _build.code)("i"))), (0, _build.p)("after")), _model.defaultSchema.mark("code"));
add("across_blocks", (0, _build.doc)((0, _build.p)("hi <a>this"), (0, _build.blockquote)((0, _build.p)("is")), (0, _build.p)("a docu<b>ment"), (0, _build.p)("!")), (0, _build.doc)((0, _build.p)("hi ", (0, _build.em)("this")), (0, _build.blockquote)((0, _build.p)((0, _build.em)("is"))), (0, _build.p)((0, _build.em)("a docu"), "ment"), (0, _build.p)("!")), _model.defaultSchema.mark("em"));

function rem(name, doc, expect, style) {
     (0, _tests.defTest)("removeMark_" + name, function () {
          testTransform(doc, expect, Tr(doc).removeMark(doc.tag.a, doc.tag.b, style));
     });
}

rem("gap", (0, _build.doc)((0, _build.p)((0, _build.em)("hello <a>world<b>!"))), (0, _build.doc)((0, _build.p)((0, _build.em)("hello "), "world", (0, _build.em)("!"))), _model.defaultSchema.mark("em"));
rem("nothing_there", (0, _build.doc)((0, _build.p)((0, _build.em)("hello"), " <a>world<b>!")), (0, _build.doc)((0, _build.p)((0, _build.em)("hello"), " <a>world<b>!")), _model.defaultSchema.mark("em"));
rem("from_nested", (0, _build.doc)((0, _build.p)((0, _build.em)("one ", (0, _build.strong)("<a>two<b>"), " three"))), (0, _build.doc)((0, _build.p)((0, _build.em)("one two three"))), _model.defaultSchema.mark("strong"));
rem("unlink", (0, _build.doc)((0, _build.p)("hello ", (0, _build.a)("link"))), (0, _build.doc)((0, _build.p)("hello link")), _model.defaultSchema.mark("link", { href: "http://foo" }));
rem("other_link", (0, _build.doc)((0, _build.p)("hello ", (0, _build.a)("link"))), (0, _build.doc)((0, _build.p)("hello ", (0, _build.a)("link"))), _model.defaultSchema.mark("link", { href: "http://bar" }));
rem("across_blocks", (0, _build.doc)((0, _build.blockquote)((0, _build.p)((0, _build.em)("much <a>em")), (0, _build.p)((0, _build.em)("here too"))), (0, _build.p)("between", (0, _build.em)("...")), (0, _build.p)((0, _build.em)("end<b>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)((0, _build.em)("much "), "em"), (0, _build.p)("here too")), (0, _build.p)("between..."), (0, _build.p)("end")), _model.defaultSchema.mark("em"));
rem("all", (0, _build.doc)((0, _build.p)("<a>hello, ", (0, _build.em)("this is ", (0, _build.strong)("much"), " ", (0, _build.a)("markup<b>")))), (0, _build.doc)((0, _build.p)("<a>hello, this is much markup")), null);

function ins(name, doc, expect, nodes) {
     (0, _tests.defTest)("insert_" + name, function () {
          testTransform(doc, expect, Tr(doc).insert(doc.tag.a, nodes));
     });
}

ins("break", (0, _build.doc)((0, _build.p)("hello<a>there")), (0, _build.doc)((0, _build.p)("hello", _build.br, "<a>there")), _model.defaultSchema.node("hard_break"));
ins("simple", (0, _build.doc)((0, _build.p)("one"), "<a>", (0, _build.p)("two<2>")), (0, _build.doc)((0, _build.p)("one"), (0, _build.p)(), "<a>", (0, _build.p)("two<2>")), _model.defaultSchema.node("paragraph"));
ins("two", (0, _build.doc)((0, _build.p)("one"), "<a>", (0, _build.p)("two<2>")), (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("hi"), _build.hr, "<a>", (0, _build.p)("two<2>")), [_model.defaultSchema.node("paragraph", null, [_model.defaultSchema.text("hi")]), _model.defaultSchema.node("horizontal_rule")]);
ins("end_of_blockquote", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("he<before>y"), "<a>"), (0, _build.p)("after<after>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("he<before>y"), (0, _build.p)()), (0, _build.p)("after<after>")), _model.defaultSchema.node("paragraph"));
ins("start_of_blockquote", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.p)("he<1>y")), (0, _build.p)("after<2>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)(), "<a>", (0, _build.p)("he<1>y")), (0, _build.p)("after<2>")), _model.defaultSchema.node("paragraph"));

function del(name, doc, expect) {
     (0, _tests.defTest)("delete_" + name, function () {
          testTransform(doc, expect, Tr(doc).delete(doc.tag.a, doc.tag.b));
     });
}

del("simple", (0, _build.doc)((0, _build.p)("<1>one"), "<a>", (0, _build.p)("tw<2>o"), "<b>", (0, _build.p)("<3>three")), (0, _build.doc)((0, _build.p)("<1>one"), "<a><2>", (0, _build.p)("<3>three")));
del("only_child", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.p)("hi"), "<b>"), (0, _build.p)("x")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)()), (0, _build.p)("x")));
del("outside_path", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("a"), "<a>", (0, _build.p)("b"), "<b>"), (0, _build.p)("c<1>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("a")), (0, _build.p)("c<1>")));

function txt(name, doc, expect, text) {
     (0, _tests.defTest)("insertText_" + name, function () {
          testTransform(doc, expect, Tr(doc).insertText(doc.tag.a, text));
     });
}

txt("inherit_style", (0, _build.doc)((0, _build.p)((0, _build.em)("he<a>lo"))), (0, _build.doc)((0, _build.p)((0, _build.em)("hello"))), "l");
txt("simple", (0, _build.doc)((0, _build.p)("hello<a>")), (0, _build.doc)((0, _build.p)("hello world<a>")), " world");
txt("simple_inside", (0, _build.doc)((0, _build.p)("he<a>llo")), (0, _build.doc)((0, _build.p)("hej<a>llo")), "j");
txt("left_associative", (0, _build.doc)((0, _build.p)((0, _build.em)("hello<a>"), " world<after>")), (0, _build.doc)((0, _build.p)((0, _build.em)("hello big"), " world<after>")), " big");
txt("paths", (0, _build.doc)((0, _build.p)("<1>before"), (0, _build.p)("<2>here<a>"), (0, _build.p)("after<3>")), (0, _build.doc)((0, _build.p)("<1>before"), (0, _build.p)("<2>here!<a>"), (0, _build.p)("after<3>")), "!");
txt("at_start", (0, _build.doc)((0, _build.p)("<a>one")), (0, _build.doc)((0, _build.p)("two <a>one")), "two ");
txt("after br", (0, _build.doc)((0, _build.p)("hello", _build.br, "<a>you")), (0, _build.doc)((0, _build.p)("hello", _build.br, "...you")), "...");
txt("after_br_nojoin", (0, _build.doc)((0, _build.p)("hello", _build.br, (0, _build.em)("<a>you"))), (0, _build.doc)((0, _build.p)("hello", _build.br, "...<a>", (0, _build.em)("you"))), "...");
txt("before_br", (0, _build.doc)((0, _build.p)("<a>", _build.br, "ok")), (0, _build.doc)((0, _build.p)("ay", _build.br, "ok")), "ay");

function join(name, doc, expect) {
     (0, _tests.defTest)("join_" + name, function () {
          testTransform(doc, expect, Tr(doc).join(doc.tag.a));
     });
}

join("simple", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>a")), "<a>", (0, _build.blockquote)((0, _build.p)("b")), (0, _build.p)("after<after>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>a"), "<a>", (0, _build.p)("b")), (0, _build.p)("after<after>")));
join("deeper", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("a"), (0, _build.p)("b<before>")), "<a>", (0, _build.blockquote)((0, _build.p)("c"), (0, _build.p)("d<after>")))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("a"), (0, _build.p)("b<before>"), "<a>", (0, _build.p)("c"), (0, _build.p)("d<after>")))));
join("lists", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two"))), "<a>", (0, _build.ol)((0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")), "<a>", (0, _build.li)((0, _build.p)("three")))));
join("list_item", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two")), "<a>", (0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two"), "<a>", (0, _build.p)("three")))));
join("inline", (0, _build.doc)((0, _build.p)("foo"), "<a>", (0, _build.p)("bar")), (0, _build.doc)((0, _build.p)("foo<a>bar")));

function split(name, doc, expect, args) {
     (0, _tests.defTest)("split_" + name, function () {
          testTransform(doc, expect, Tr(doc).split(doc.tag.a, args && args.depth, args && args.type && _model.defaultSchema.nodeType(args.type), args && args.attrs));
     });
}

split("simple", (0, _build.doc)((0, _build.p)("foo<a>bar")), (0, _build.doc)((0, _build.p)("foo"), (0, _build.p)("<a>bar")));
split("before_and_after", (0, _build.doc)((0, _build.p)("<1>a"), (0, _build.p)("<2>foo<a>bar<3>"), (0, _build.p)("<4>b")), (0, _build.doc)((0, _build.p)("<1>a"), (0, _build.p)("<2>foo"), (0, _build.p)("<a>bar<3>"), (0, _build.p)("<4>b")));
split("deeper", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("foo<a>bar"))), (0, _build.p)("after<1>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("foo")), (0, _build.blockquote)((0, _build.p)("<a>bar"))), (0, _build.p)("after<1>")), { depth: 2 });
split("and_deeper", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("foo<a>bar"))), (0, _build.p)("after<1>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("foo"))), (0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<a>bar"))), (0, _build.p)("after<1>")), { depth: 3 });
split("at_end", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi<a>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), (0, _build.p)("<a>"))));
split("at_start", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>hi"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)(), (0, _build.p)("<a>hi"))));
split("list_paragraph", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one<1>")), (0, _build.li)((0, _build.p)("two<a>three")), (0, _build.li)((0, _build.p)("four<2>")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one<1>")), (0, _build.li)((0, _build.p)("two"), (0, _build.p)("<a>three")), (0, _build.li)((0, _build.p)("four<2>")))));
split("list_item", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one<1>")), (0, _build.li)((0, _build.p)("two<a>three")), (0, _build.li)((0, _build.p)("four<2>")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one<1>")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)("<a>three")), (0, _build.li)((0, _build.p)("four<2>")))), { depth: 2 });
split("change_type", (0, _build.doc)((0, _build.h1)("hell<a>o!")), (0, _build.doc)((0, _build.h1)("hell"), (0, _build.p)("<a>o!")), { type: "paragraph" });
split("invalid_start", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.p)("x"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("x"))));
split("invalid_end", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("x"), "<a>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("x"))));

function lift(name, doc, expect) {
     (0, _tests.defTest)("lift_" + name, function () {
          testTransform(doc, expect, Tr(doc).lift(doc.tag.a, doc.tag.b));
     });
}

lift("simple_between", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>one"), (0, _build.p)("<a>two"), (0, _build.p)("<after>three"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>one")), (0, _build.p)("<a>two"), (0, _build.blockquote)((0, _build.p)("<after>three"))));
lift("simple_at_front", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>two"), (0, _build.p)("<after>three"))), (0, _build.doc)((0, _build.p)("<a>two"), (0, _build.blockquote)((0, _build.p)("<after>three"))));
lift("simple_at_end", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>one"), (0, _build.p)("<a>two"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<before>one")), (0, _build.p)("<a>two")));
lift("simple_alone", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<a>t<in>wo"))), (0, _build.doc)((0, _build.p)("<a>t<in>wo")));
lift("multiple", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("tw<b>o")), (0, _build.p)("three"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("on<a>e"), (0, _build.p)("tw<b>o"), (0, _build.p)("three"))));
lift("multiple_lopsided", (0, _build.doc)((0, _build.p)("start"), (0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("a"), (0, _build.p)("<a>b")), (0, _build.p)("<b>c"))), (0, _build.doc)((0, _build.p)("start"), (0, _build.blockquote)((0, _build.p)("a"), (0, _build.p)("<a>b")), (0, _build.p)("<b>c")));
lift("deeper", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<1>one"), (0, _build.p)("<a>two"), (0, _build.p)("<3>three"), (0, _build.p)("<b>four"), (0, _build.p)("<5>five")))), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<1>one")), (0, _build.p)("<a>two"), (0, _build.p)("<3>three"), (0, _build.p)("<b>four"), (0, _build.blockquote)((0, _build.p)("<5>five")))));
lift("from_list", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), (0, _build.li)((0, _build.p)("two<a>")), (0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"))), (0, _build.p)("two<a>"), (0, _build.ul)((0, _build.li)((0, _build.p)("three")))));
lift("multiple_from_list", (0, _build.doc)((0, _build.ul)("<1>", (0, _build.li)((0, _build.p)("one<a>")), (0, _build.li)((0, _build.p)("two<b>")), (0, _build.li)((0, _build.p)("three<after>")))), (0, _build.doc)("<1>", (0, _build.p)("one<a>"), (0, _build.p)("two<b>"), (0, _build.ul)((0, _build.li)((0, _build.p)("three<after>")))));
lift("end_of_list", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b<a>")), "<1>")), (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("a"))), (0, _build.p)("b<a>"), "<1>"));
lift("multiple_from_list_with_two_items", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one<a>"), (0, _build.p)("<half>half")), (0, _build.li)((0, _build.p)("two<b>")), (0, _build.li)((0, _build.p)("three<after>")))), (0, _build.doc)((0, _build.p)("one<a>"), (0, _build.p)("<half>half"), (0, _build.p)("two<b>"), (0, _build.ul)((0, _build.li)((0, _build.p)("three<after>")))));

function wrap(name, doc, expect, type, attrs) {
     (0, _tests.defTest)("wrap_" + name, function () {
          testTransform(doc, expect, Tr(doc).wrap(doc.tag.a, doc.tag.b, _model.defaultSchema.nodeType(type), attrs));
     });
}

wrap("simple", (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("<a>two"), (0, _build.p)("three")), (0, _build.doc)((0, _build.p)("one"), (0, _build.blockquote)((0, _build.p)("<a>two")), (0, _build.p)("three")), "blockquote");
wrap("two", (0, _build.doc)((0, _build.p)("one<1>"), (0, _build.p)("<a>two"), (0, _build.p)("<b>three"), (0, _build.p)("four<4>")), (0, _build.doc)((0, _build.p)("one<1>"), (0, _build.blockquote)((0, _build.p)("<a>two"), (0, _build.p)("three")), (0, _build.p)("four<4>")), "blockquote");
wrap("list", (0, _build.doc)((0, _build.p)("<a>one"), (0, _build.p)("<b>two")), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("<a>one")), (0, _build.li)((0, _build.p)("<b>two")))), "ordered_list");
wrap("nested_list", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("<1>one")), (0, _build.li)((0, _build.p)("<a>two"), (0, _build.p)("<b>three")), (0, _build.li)((0, _build.p)("<4>four")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("<1>one")), (0, _build.li)((0, _build.ol)((0, _build.li)((0, _build.p)("<a>two")), (0, _build.li)((0, _build.p)("<b>three")))), (0, _build.li)((0, _build.p)("<4>four")))), "ordered_list");
wrap("not_possible", (0, _build.doc)((0, _build.p)("hi<a>")), (0, _build.doc)((0, _build.p)("hi<a>")), "horizontal_rule");
wrap("include_parent", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<1>one"), (0, _build.p)("two<a>")), (0, _build.p)("three<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("<1>one"), (0, _build.p)("two<a>")), (0, _build.p)("three<b>"))), "blockquote");
wrap("bullet_list", (0, _build.doc)((0, _build.p)("x"), (0, _build.p)("yyyy<a>y"), (0, _build.p)("z")), (0, _build.doc)((0, _build.p)("x"), (0, _build.ul)((0, _build.li)((0, _build.p)("yyyy<a>y"))), (0, _build.p)("z")), "bullet_list");

function type(name, doc, expect, nodeType, attrs) {
     (0, _tests.defTest)("setType_" + name, function () {
          testTransform(doc, expect, Tr(doc).setBlockType(doc.tag.a, doc.tag.b, _model.defaultSchema.nodeType(nodeType), attrs));
     });
}

type("simple", (0, _build.doc)((0, _build.p)("am<a> i")), (0, _build.doc)((0, _build.h2)("am i")), "heading", { level: 2 });
type("multiple", (0, _build.doc)((0, _build.h1)("<a>hello"), (0, _build.p)("there"), (0, _build.p)("<b>you"), (0, _build.p)("end")), (0, _build.doc)((0, _build.pre)("hello"), (0, _build.pre)("there"), (0, _build.pre)("you"), (0, _build.p)("end")), "code_block");
type("inside", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("one<a>"), (0, _build.p)("two<b>"))), (0, _build.doc)((0, _build.blockquote)((0, _build.h1)("one<a>"), (0, _build.h1)("two<b>"))), "heading", { level: 1 });
type("clear_markup", (0, _build.doc)((0, _build.p)("hello<a> ", (0, _build.em)("world"))), (0, _build.doc)((0, _build.pre)("hello world")), "code_block");
type("only_clear_for_code_block", (0, _build.doc)((0, _build.p)("hello<a> ", (0, _build.em)("world"))), (0, _build.doc)((0, _build.h1)("hello<a> ", (0, _build.em)("world"))), "heading", { level: 1 });

function nodeType(name, doc, expect, type, attrs) {
     (0, _tests.defTest)("nodeType_" + name, function () {
          testTransform(doc, expect, Tr(doc).setNodeType(doc.tag.a, _model.defaultSchema.nodeType(type), attrs));
     });
}

nodeType("valid", (0, _build.doc)("<a>", (0, _build.p)("foo")), (0, _build.doc)((0, _build.h1)("foo")), "heading", { level: 1 });
nodeType("invalid", (0, _build.doc)("<a>", (0, _build.p)("foo")), (0, _build.doc)((0, _build.p)("foo")), "blockquote");

function repl(name, doc, source, expect) {
     (0, _tests.defTest)("replace_" + name, function () {
          var tr = source ? Tr(doc).replace(doc.tag.a, doc.tag.b || doc.tag.a, source, source && source.tag.a, source && source.tag.b) : Tr(doc).delete(doc.tag.a, doc.tag.b);
          testTransform(doc, expect, tr);
     });
}

repl("add_text", (0, _build.doc)((0, _build.p)("hell<a>o y<b>ou")), (0, _build.doc)((0, _build.p)("<a>i k<b>")), (0, _build.doc)((0, _build.p)("helli k<a><b>ou")));
repl("add_paragraph", (0, _build.doc)((0, _build.p)("hello<a>you")), (0, _build.doc)("<a>", (0, _build.p)("there"), "<b>"), (0, _build.doc)((0, _build.p)("hello"), (0, _build.p)("there"), (0, _build.p)("<a>you")));
repl("join_text", (0, _build.doc)((0, _build.h1)("he<a>llo"), (0, _build.p)("arg<b>!")), (0, _build.doc)((0, _build.p)("1<a>2<b>3")), (0, _build.doc)((0, _build.h1)("he2!")));
repl("match_list", (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("one<a>")), (0, _build.li)((0, _build.p)("three")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("<a>half")), (0, _build.li)((0, _build.p)("two")), "<b>")), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("onehalf")), (0, _build.li)((0, _build.p)("two")), (0, _build.li)((0, _build.p)()), (0, _build.li)((0, _build.p)("three")))));
repl("merge_block", (0, _build.doc)((0, _build.p)("a<a>"), (0, _build.p)("b"), (0, _build.p)("<b>c")), null, (0, _build.doc)((0, _build.p)("a<a><b>c")));
repl("move_text_down", (0, _build.doc)((0, _build.h1)("wo<a>ah"), (0, _build.blockquote)((0, _build.p)("ah<b>ha"))), null, (0, _build.doc)((0, _build.h1)("wo<a><b>ha")));
repl("move_text_up", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a>bar")), (0, _build.p)("middle"), (0, _build.h1)("quux<b>baz")), null, (0, _build.doc)((0, _build.blockquote)((0, _build.p)("foo<a><b>baz"))));
repl("stitch_deep", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b<a>")), (0, _build.li)((0, _build.p)("c")), (0, _build.li)((0, _build.p)("<b>d")), (0, _build.li)((0, _build.p)("e"))))), null, (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a")), (0, _build.li)((0, _build.p)("b<a><b>d")), (0, _build.li)((0, _build.p)("e"))))));
repl("simple", (0, _build.doc)((0, _build.p)("he<before>llo<a> w<after>orld")), (0, _build.doc)((0, _build.p)("<a> big<b>")), (0, _build.doc)((0, _build.p)("he<before>llo big w<after>orld")));
repl("insert_paragraph_open_edges", (0, _build.doc)((0, _build.p)("one<a>two")), (0, _build.doc)((0, _build.p)("a<a>"), (0, _build.p)("hello"), (0, _build.p)("<b>b")), (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("hello"), (0, _build.p)("<a>two")));
repl("overwrite_paragraph", (0, _build.doc)((0, _build.p)("one<a>"), (0, _build.p)("t<inside>wo"), (0, _build.p)("<b>three<end>")), (0, _build.doc)((0, _build.p)("a<a>"), (0, _build.p)("TWO"), (0, _build.p)("<b>b")), (0, _build.doc)((0, _build.p)("one"), (0, _build.p)("TWO"), (0, _build.p)("<a>three<end>")));
repl("stitch", (0, _build.doc)((0, _build.p)("foo ", (0, _build.em)("bar<a>baz"), "<b> quux")), (0, _build.doc)((0, _build.p)("foo ", (0, _build.em)("xy<a>zzy"), " foo<b>")), (0, _build.doc)((0, _build.p)("foo ", (0, _build.em)("barzzy"), " foo quux")));
repl("break", (0, _build.doc)((0, _build.p)("foo<a>b<inside>b<b>bar")), (0, _build.doc)((0, _build.p)("<a>", _build.br, "<b>")), (0, _build.doc)((0, _build.p)("foo", _build.br, "<inside>bar")));
repl("cut_different_block", (0, _build.doc)((0, _build.h1)("hell<a>o"), (0, _build.p)("by<b>e")), null, (0, _build.doc)((0, _build.h1)("helle")));
repl("restore_list", (0, _build.doc)((0, _build.h1)("hell<a>o"), (0, _build.p)("by<b>e")), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("on<a>e")), (0, _build.li)((0, _build.p)("tw<b>o")))), (0, _build.doc)((0, _build.h1)("helle"), (0, _build.ol)((0, _build.li)((0, _build.p)("twe")))));
repl("in_empty_block", (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("<a>"), (0, _build.p)("b")), (0, _build.doc)((0, _build.p)("x<a>y<b>z")), (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("y<a>"), (0, _build.p)("b")));
repl("dont_shift_everything", (0, _build.doc)((0, _build.p)("one<a>"), (0, _build.p)("two"), (0, _build.p)("three")), (0, _build.doc)((0, _build.p)("outside<a>"), (0, _build.blockquote)((0, _build.p)("inside<b>"))), (0, _build.doc)((0, _build.p)("one"), (0, _build.blockquote)((0, _build.p)("inside")), (0, _build.p)("two"), (0, _build.p)("three")));
repl("del_selection", (0, _build.doc)((0, _build.p)("some <a>te<b>xt")), null, (0, _build.doc)((0, _build.p)("some <a><b>xt")));
repl("lopsided", (0, _build.doc)((0, _build.blockquote)((0, _build.p)("b<a>c"), (0, _build.p)("d<b>e"), (0, _build.p)("f"))), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("x<a>y")), (0, _build.p)("z<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("by")), (0, _build.p)("z<a><b>e"), (0, _build.blockquote)((0, _build.p)("f"))));
repl("deep_insert", (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("one"), (0, _build.p)("tw<a>o"), (0, _build.p)("t<b>hree<3>"), (0, _build.p)("four<4>")))), (0, _build.doc)((0, _build.ol)((0, _build.li)((0, _build.p)("hello<a>world")), (0, _build.li)((0, _build.p)("bye"))), (0, _build.p)("ne<b>xt")), (0, _build.doc)((0, _build.blockquote)((0, _build.blockquote)((0, _build.p)("one"), (0, _build.p)("twworld"), (0, _build.ol)((0, _build.li)((0, _build.p)("bye"))), (0, _build.p)("ne<a><b>hree<3>"), (0, _build.p)("four<4>")))));
repl("join_inequal", (0, _build.doc)((0, _build.h1)("hello<a>"), (0, _build.p)("<b>you<1>")), null, (0, _build.doc)((0, _build.h1)("hello<a><b>you<1>")));
repl("delete_whole_doc", (0, _build.doc)("<a>", (0, _build.h1)("hi"), (0, _build.p)("you"), "<b>"), null, (0, _build.doc)((0, _build.p)()));
repl("cut_empty_node_before", (0, _build.doc)((0, _build.blockquote)("<a>", (0, _build.p)("hi")), (0, _build.p)("b<b>x")), (0, _build.doc)((0, _build.p)("<a>hi<b>")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hix"))));
repl("cut_empty_node_after", (0, _build.doc)((0, _build.p)("x<a>hi"), (0, _build.blockquote)((0, _build.p)("yy"), "<b>"), (0, _build.p)("c")), (0, _build.doc)((0, _build.p)("<a>hi<b>")), (0, _build.doc)((0, _build.p)("xhi"), (0, _build.blockquote)((0, _build.p)()), (0, _build.p)("c")));
repl("cut_empty_node_at_start", (0, _build.doc)((0, _build.p)("<a>x")), (0, _build.doc)((0, _build.blockquote)((0, _build.p)("hi"), "<a>"), (0, _build.p)("b<b>")), (0, _build.doc)((0, _build.p)(), (0, _build.p)("bx")));
repl("cut_empty_node_at_end", (0, _build.doc)((0, _build.p)("<a>x")), (0, _build.doc)((0, _build.p)("b<a>"), (0, _build.blockquote)("<b>", (0, _build.p)("hi"))), (0, _build.doc)((0, _build.p)(), (0, _build.blockquote)((0, _build.p)()), (0, _build.p)("x")));