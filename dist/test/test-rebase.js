"use strict";

var _rebase = require("../collab/rebase");

var _model = require("../model");

var _transform = require("../transform");

var _build = require("./build");

var _failure = require("./failure");

var _tests = require("./tests");

var _cmp = require("./cmp");

function mapObj(obj, f) {
  var result = {};
  for (var prop in obj) {
    result[prop] = f(obj[prop]);
  }return result;
}

function asPos(doc, val) {
  if (typeof val == "string") {
    var m = val.match(/^(\w+)([-+]\d+)?$/);
    var pos = doc.tag[m[1]];
    if (!pos) throw new Error("Referenced non-existing tag " + m[1]);
    if (m[2]) pos = new _model.Pos(pos.path, pos.offset + Number(m[2]));
    return pos;
  }
  return val;
}

function text(pos, text) {
  return function (tr) {
    return tr.insertText(asPos(tr.doc, pos), text);
  };
}
function wrap(from, to, type, attrs) {
  return function (tr) {
    return tr.wrap(asPos(tr.doc, from), asPos(tr.doc, to), _model.defaultSchema.nodeType(type), attrs);
  };
}
function rm(from, to) {
  return function (tr) {
    return tr.delete(asPos(tr.doc, from), asPos(tr.doc, to));
  };
}
function join(pos) {
  return function (tr) {
    return tr.join(asPos(tr.doc, pos));
  };
}
function addMark(from, to, st) {
  return function (tr) {
    return tr.addMark(asPos(tr.doc, from), asPos(tr.doc, to), st);
  };
}
function rmMark(from, to, st) {
  return function (tr) {
    return tr.removeMark(asPos(tr.doc, from), asPos(tr.doc, to), st);
  };
}
function repl(from, to, source, start, end) {
  return function (tr) {
    return tr.replace(asPos(tr.doc, from), asPos(tr.doc, to), source, start, end);
  };
}
function addNode(pos, type, attrs) {
  return function (tr) {
    return tr.insert(asPos(tr.doc, pos), _model.defaultSchema.node(type, attrs));
  };
}

function buildChanges(startDoc, clients) {
  return clients.map(function (transforms) {
    var doc = startDoc,
        tags = doc.tag;
    var changes = [];
    transforms.forEach(function (input) {
      var transform = input(new _transform.Transform(doc));
      for (var i = 0; i < transform.steps.length; i++) {
        changes.push({ step: transform.steps[i], map: transform.maps[i] });
      }doc = transform.doc;
      tags = doc.tag = mapObj(tags, function (value) {
        return transform.maps.reduce(function (pos, m) {
          return m.map(pos).pos;
        }, value);
      });
    });
    return changes;
  });
}

function runRebase(startDoc, clientChanges, result) {
  var doc = startDoc,
      maps = [];
  for (var i = 0; i < clientChanges.length; i++) {
    var _result = (0, _rebase.rebaseSteps)(doc, maps, clientChanges[i].map(function (c) {
      return c.step;
    }), clientChanges[i].map(function (c) {
      return c.map;
    }));
    maps = maps.concat(_result.transform.maps);
    doc = _result.doc;
  }

  (0, _cmp.cmpNode)(doc, result);

  for (var tag in startDoc.tag) {
    var mapped = startDoc.tag[tag],
        deleted = false;
    for (var _i = 0; _i < maps.length; _i++) {
      var _result2 = maps[_i].map(mapped, 1);
      if (_result2.deleted) deleted = true;
      mapped = _result2.pos;
    }

    var expected = result.tag[tag];
    if (deleted) {
      if (expected) throw new _failure.Failure("Tag " + tag + " was unexpectedly deleted");
    } else {
      if (!expected) throw new _failure.Failure("Tag " + tag + " is not actually deleted");
      (0, _cmp.cmpStr)(mapped, expected, tag);
    }
  }
}

function rebase(name, startDoc) {
  for (var _len = arguments.length, clients = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    clients[_key - 2] = arguments[_key];
  }

  var result = clients.pop();
  (0, _tests.defTest)("rebase_" + name, function () {
    return runRebase(startDoc, buildChanges(startDoc, clients), result);
  });
}

function permute(array) {
  if (array.length < 2) return [array];
  var result = [];
  for (var i = 0; i < array.length; i++) {
    var others = permute(array.slice(0, i).concat(array.slice(i + 1)));
    for (var j = 0; j < others.length; j++) {
      result.push([array[i]].concat(others[j]));
    }
  }
  return result;
}

function rebase$(name, startDoc) {
  for (var _len2 = arguments.length, clients = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    clients[_key2 - 2] = arguments[_key2];
  }

  var result = clients.pop();
  (0, _tests.defTest)("rebase_" + name, function () {
    var clientChanges = buildChanges(startDoc, clients);
    permute(clientChanges).forEach(function (clientChanges) {
      return runRebase(startDoc, clientChanges, result);
    });
  });
}

rebase$("type_simple", (0, _build.doc)((0, _build.p)("h<1>ell<2>o")), [text("1", "X")], [text("2", "Y")], (0, _build.doc)((0, _build.p)("hX<1>ellY<2>o")));

rebase$("type_simple_multiple", (0, _build.doc)((0, _build.p)("h<1>ell<2>o")), [text("1", "X"), text("1", "Y"), text("1", "Z")], [text("2", "U"), text("2", "V")], (0, _build.doc)((0, _build.p)("hXYZ<1>ellUV<2>o")));

rebase$("type_three", (0, _build.doc)((0, _build.p)("h<1>ell<2>o th<3>ere")), [text("1", "X")], [text("2", "Y")], [text("3", "Z")], (0, _build.doc)((0, _build.p)("hX<1>ellY<2>o thZ<3>ere")));

rebase$("wrap", (0, _build.doc)((0, _build.p)("<1>hell<2>o<3>")), [text("2", "X")], [wrap("1", "3", "blockquote")], (0, _build.doc)((0, _build.blockquote)((0, _build.p)("<1>hellX<2>o<3>"))));

rebase$("delete", (0, _build.doc)((0, _build.p)("hello<1> wo<2>rld<3>!")), [rm("1", "3")], [text("2", "X")], (0, _build.doc)((0, _build.p)("hello<1><3>!")));

rebase("delete_twice", (0, _build.doc)((0, _build.p)("hello<1> wo<2>rld<3>!")), [rm("1", "3")], [rm("1", "3")], (0, _build.doc)((0, _build.p)("hello<1><3>!")));

rebase$("join", (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one")), "<1>", (0, _build.li)((0, _build.p)("tw<2>o")))), [text("2", "A")], [join("1")], (0, _build.doc)((0, _build.ul)((0, _build.li)((0, _build.p)("one"), (0, _build.p)("twA<2>o")))));

rebase("style", (0, _build.doc)((0, _build.p)("hello <1>wo<2>rld<3>")), [addMark("1", "3", _model.defaultSchema.mark("em"))], [text("2", "_")], (0, _build.doc)((0, _build.p)("hello <1>", (0, _build.em)("wo"), "_<2>", (0, _build.em)("rld<3>"))));

rebase("style_unstyle", (0, _build.doc)((0, _build.p)((0, _build.em)("<1>hello"), " world<2>")), [addMark("1", "2", _model.defaultSchema.mark("em"))], [rmMark("1", "2", _model.defaultSchema.mark("em"))], (0, _build.doc)((0, _build.p)("<1>hello", (0, _build.em)(" world<2>"))));

rebase("unstyle_style", (0, _build.doc)((0, _build.p)("<1>hello ", (0, _build.em)("world<2>"))), [rmMark("1", "2", _model.defaultSchema.mark("em"))], [addMark("1", "2", _model.defaultSchema.mark("em"))], (0, _build.doc)((0, _build.p)((0, _build.em)("<1>hello "), "world<2>")));

rebase("replace_nested", (0, _build.doc)((0, _build.p)("b<before>efore"), (0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("o<1>ne")), (0, _build.li)((0, _build.p)("t<2>wo")), (0, _build.li)((0, _build.p)("thr<3>ee")))), (0, _build.p)("a<after>fter")), [repl("1", "3", (0, _build.doc)((0, _build.p)("a"), (0, _build.blockquote)((0, _build.p)("b")), (0, _build.p)("c")), new _model.Pos([0], 1), new _model.Pos([2], 0))], [text("2", "ayay")], (0, _build.doc)((0, _build.p)("b<before>efore"), (0, _build.blockquote)((0, _build.ul)((0, _build.li)((0, _build.p)("o"), (0, _build.blockquote)((0, _build.p)("b")), (0, _build.p)("<1><3>ee")))), (0, _build.p)("a<after>fter")));

rebase$("map_through_insert", (0, _build.doc)((0, _build.p)("X<1>X<2>X")), [text("1", "hello")], [text("2", "goodbye"), rm("2-6", "2-3")], (0, _build.doc)((0, _build.p)("Xhello<1>Xgbye<2>X")));

rebase("double_remove", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b"), "<2>", (0, _build.p)("c")), [rm("1", "2")], [rm("1", "2")], (0, _build.doc)((0, _build.p)("a"), "<1><2>", (0, _build.p)("c")));

rebase$("edit_in_removed", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b<2>"), "<3>", (0, _build.p)("c")), [rm("1", "3")], [text("2", "ay")], (0, _build.doc)((0, _build.p)("a"), "<1><3>", (0, _build.p)("c")));

rebase("double_insert", (0, _build.doc)((0, _build.p)("a"), "<1>", (0, _build.p)("b")), [addNode("1", "paragraph")], [addNode("1", "paragraph")], (0, _build.doc)((0, _build.p)("a"), (0, _build.p)(), (0, _build.p)(), "<1>", (0, _build.p)("b")));