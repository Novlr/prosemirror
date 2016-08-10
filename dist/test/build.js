"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hr = exports.img = exports.dataImage = exports.br = exports.a2 = exports.a = exports.code = exports.strong = exports.em = exports.ol = exports.ul = exports.li = exports.h2 = exports.h1 = exports.pre2 = exports.pre = exports.blockquote = exports.p = undefined;
exports.doc = doc;

var _model = require("../model");

// : (string) → Function
// Create a function for creating inline nodes with brevity.
// For use with `doc()`.
function buildInline(style) {
  return function () {
    return { type: "span", style: style, content: arguments };
  };
}

// : (string, Object) → Function
// Create a function which creating block nodes with brevity.
// For use with `doc()`.
function build(type, attrs) {
  return function () {
    return { type: "block", style: type, content: arguments, attrs: attrs };
  };
}

var styles = [];

function countOffset(nodes) {
  return nodes.reduce(function (s, n) {
    return s + (n.text == null ? 1 : n.text.length);
  }, 0);
}

function parseDoc(value, content, path) {
  if (typeof value == "string") {
    var re = /<(\w+)>/g,
        m = void 0,
        pos = 0,
        out = "";
    var offset = countOffset(content);
    while (m = re.exec(value)) {
      out += value.slice(pos, m.index);
      pos = m.index + m[0].length;
      tags[m[1]] = new _model.Pos(path, offset + out.length);
    }
    out += value.slice(pos);
    if (out) content.push(_model.defaultSchema.text(out, styles));
  } else if (value.type == "span") {
    var start = styles;
    styles = value.style.addToSet(styles);
    for (var i = 0; i < value.content.length; i++) {
      parseDoc(value.content[i], content, path);
    }styles = start;
  } else if (value.type == "insert") {
    var type = _model.defaultSchema.nodeType(value.style);
    content.push(_model.defaultSchema.node(type, value.attrs, value.content));
  } else {
    var inner = [];
    var nodePath = path.concat(content.length);
    styles = [];
    for (var _i = 0; _i < value.content.length; _i++) {
      parseDoc(value.content[_i], inner, nodePath);
    }content.push(_model.defaultSchema.node(value.style, value.attrs, inner));
  }
}

var tags = Object.create(null);

// : (...nodes: Node) → Doc
// Create a document node. Child nodes can be added with
// abbreviated node notation, see `build()`.
function doc() {
  var content = [];
  for (var i = 0; i < arguments.length; i++) {
    parseDoc(arguments[i], content, []);
  }var doc = _model.defaultSchema.node("doc", null, content);
  doc.tag = tags;
  tags = Object.create(null);
  return doc;
}

var p = exports.p = build("paragraph");
var blockquote = exports.blockquote = build("blockquote");
var pre = exports.pre = build("code_block");
var pre2 = exports.pre2 = build("code_block", { params: "" });
var h1 = exports.h1 = build("heading", { level: "1" });
var h2 = exports.h2 = build("heading", { level: "2" });
var li = exports.li = build("list_item");
var ul = exports.ul = build("bullet_list");
var ol = exports.ol = build("ordered_list", { order: "1" });
var em = exports.em = buildInline(_model.defaultSchema.mark("em"));
var strong = exports.strong = buildInline(_model.defaultSchema.mark("strong"));
var code = exports.code = buildInline(_model.defaultSchema.mark("code"));
var a = exports.a = buildInline(_model.defaultSchema.mark("link", { href: "http://foo" }));
var a2 = exports.a2 = buildInline(_model.defaultSchema.mark("link", { href: "http://bar" }));
var br = exports.br = { type: "insert", style: "hard_break" };
var dataImage = exports.dataImage = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
var img = exports.img = { type: "insert", style: "image", attrs: { src: dataImage, alt: "x" } };
var hr = exports.hr = { type: "insert", style: "horizontal_rule" };