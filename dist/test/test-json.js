"use strict";

Object.defineProperty(exports, "__esModule", {
     value: true
});
exports.testStepJSON = testStepJSON;

var _build = require("./build");

var _cmp = require("./cmp");

var _tests = require("./tests");

var _model = require("../model");

var _transform = require("../transform");

function node(name, doc) {
     (0, _tests.defTest)("json_node_" + name, function () {
          return (0, _cmp.cmpNode)(_model.defaultSchema.nodeFromJSON(doc.toJSON()), doc);
     });
}

node("simple", (0, _build.doc)((0, _build.p)("foo")));

node("marks", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("bar", (0, _build.strong)("baz")), " ", (0, _build.a)("x"))));

node("inline_leaf", (0, _build.doc)((0, _build.p)("foo", (0, _build.em)(_build.img, "bar"))));

node("block_leaf", (0, _build.doc)((0, _build.p)("a"), _build.hr, (0, _build.p)("b"), (0, _build.p)()));

node("nesting", (0, _build.doc)((0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("a"), (0, _build.p)("b")), (0, _build.li)((0, _build.p)(_build.img))), (0, _build.p)("c")), (0, _build.p)("d")));

function testStepJSON(tr) {
     var newTR = new _transform.Transform(tr.before);
     tr.steps.forEach(function (step) {
          return newTR.step(_transform.Step.fromJSON(_model.defaultSchema, step.toJSON()));
     });
     (0, _cmp.cmpNode)(tr.doc, newTR.doc);
}