"use strict";

var _model = require("../model");

var _failure = require("./failure");

var _tests = require("./tests");

function p() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var offset = args.pop();
  return new _model.Pos(args, offset);
}

function sn(n) {
  return n == 0 ? 0 : n < 0 ? -1 : 1;
}

var id = 0;
function cmp(a, b, expected) {
  (0, _tests.defTest)("pos_cmp_" + id++, function () {
    var result = sn(a.cmp(b));
    if (result != expected) throw new _failure.Failure("Positions " + a + " and " + b + " should compare as " + expected + " but yield " + result);
    var inverse = sn(b.cmp(a));
    if (inverse != -expected) throw new _failure.Failure("Positions " + b + " and " + a + " should compare as " + -expected + " but yield " + inverse + " (flipped)");
  });
}

cmp(p(0, 0), p(0, 0), 0);
cmp(p(1, 1), p(1, 1), 0);
cmp(p(0, 0, 1, 0), p(0, 0, 1), 1);
cmp(p(0, 0, 1, 0), p(0, 0, 2), -1);
cmp(p(1), p(0, 0), 1);
cmp(p(1), p(0, 1000), 1);
cmp(p(1), p(1, 0), -1);