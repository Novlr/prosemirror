"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cmpNode = cmpNode;
exports.cmpStr = cmpStr;
exports.cmp = cmp;
exports.gt = gt;
exports.lt = lt;
exports.is = is;
exports.P = P;

var _failure = require("./failure");

var _model = require("../model");

function cmpNode(a, b, comment) {
  function raise(msg, path) {
    throw new _failure.Failure(msg + " at " + path + "\n in " + a + "\n vs " + b + (comment ? " (" + comment + ")" : ""));
  }
  function inner(a, b, path) {
    if (a.type != b.type) raise("types differ", path);
    if (a.size != b.size) raise("different content length", path);
    for (var name in b.attrs) {
      if (!(name in a.attrs) && b.attrs[name]) raise("missing attr " + name + " on left", path);
      if (a.attrs[name] != b.attrs[name]) raise("attribute " + name + " mismatched -- " + a.attrs[name] + " vs " + b.attrs[name], path);
    }
    for (var name in a.attrs) {
      if (!(name in b.attrs) && a.attrs[name]) raise("missing attr " + name + " on right", path);
    }if (a.text != null && a.text != b.text) raise("different text", path);
    if (a.marks && !_model.Mark.sameSet(a.marks, b.marks)) raise("different marks", path);

    for (var iA = a.iter(), iB = b.iter(), cA, cB; cA = iA.next().value, cB = iB.next().value;) {
      inner(cA, cB, path + "." + (iA.offset - cA.width));
    }
  }
  inner(a, b, "doc");
}

function cmpStr(a, b, comment) {
  var as = String(a),
      bs = String(b);
  if (as != bs) throw new _failure.Failure("expected " + bs + ", got " + as + (comment ? " (" + comment + ")" : ""));
}

function cmp(a, b, comment) {
  if (a !== b) throw new _failure.Failure("expected " + b + ", got " + a + (comment ? " (" + comment + ")" : ""));
}

function gt(a, b, comment) {
  if (a <= b) throw new _failure.Failure("expected " + a + " > " + b + (comment ? " (" + comment + ")" : ""));
}

function lt(a, b, comment) {
  if (a >= b) throw new _failure.Failure("expected " + a + " < " + b + (comment ? " (" + comment + ")" : ""));
}

function is(condition, comment) {
  if (!condition) throw new _failure.Failure("assertion failed" + (comment ? " (" + comment + ")" : ""));
}

function P() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new _model.Pos(args, args.pop());
}