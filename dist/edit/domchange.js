"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.readDOMChange = readDOMChange;
exports.textContext = textContext;
exports.textInContext = textInContext;

var _model = require("../model");

var _format = require("../format");

var _tree = require("../transform/tree");

var _selection = require("./selection");

var _dompos = require("./dompos");

function isAtEnd(node, pos, depth) {
  for (var i = depth || 0; i < pos.path.length; i++) {
    var n = pos.path[depth];
    if (n < node.size - 1) return false;
    node = node.child(n);
  }
  return pos.offset == node.size;
}
function isAtStart(pos, depth) {
  if (pos.offset > 0) return false;
  for (var i = depth || 0; i < pos.path.length; i++) {
    if (pos.path[depth] > 0) return false;
  }return true;
}

function parseNearSelection(pm) {
  var dom = pm.content,
      node = pm.doc;
  var _pm$selection = pm.selection;
  var from = _pm$selection.from;
  var to = _pm$selection.to;

  for (var depth = 0;; depth++) {
    var toNode = node.child(to.path[depth]);
    var fromStart = isAtStart(from, depth + 1);
    var toEnd = isAtEnd(toNode, to, depth + 1);
    if (fromStart || toEnd || from.path[depth] != to.path[depth] || toNode.isTextblock) {
      var startOffset = depth == from.depth ? from.offset : from.path[depth];
      if (fromStart && startOffset > 0) startOffset--;
      var endOffset = depth == to.depth ? to.offset : to.path[depth] + 1;
      if (toEnd && endOffset < node.size - 1) endOffset++;
      var parsed = (0, _format.fromDOM)(pm.schema, dom, { topNode: node.copy(),
        from: startOffset,
        to: dom.childNodes.length - (node.size - endOffset),
        preserveWhitespace: true });
      parsed = parsed.copy(node.content.slice(0, startOffset).append(parsed.content).append(node.content.slice(endOffset)));
      for (var i = depth - 1; i >= 0; i--) {
        var wrap = pm.doc.path(from.path.slice(0, i));
        parsed = wrap.replace(from.path[i], parsed);
      }
      return parsed;
    }
    node = toNode;
    dom = (0, _dompos.findByPath)(dom, from.path[depth], false);
  }
}

function readDOMChange(pm) {
  var updated = parseNearSelection(pm);
  var changeStart = (0, _model.findDiffStart)(pm.doc.content, updated.content);
  if (changeStart) {
    var _ret = function () {
      var changeEnd = findDiffEndConstrained(pm.doc.content, updated.content, changeStart);
      // Mark nodes touched by this change as 'to be redrawn'
      markDirtyFor(pm, changeStart, changeEnd);

      var near = void 0;
      // FIXME when we have a Slice type, just return replace info, & let caller inspect it
      if (pm.doc.path(changeStart.path).isTextblock && _model.Pos.samePath(changeStart.path, changeEnd.a.path) && !_model.Pos.samePath(changeStart.path, changeEnd.b.path) && (near = (0, _selection.findSelectionFrom)(updated, after(updated, changeStart), 1, true)) && !near.head.cmp(changeEnd.b)) return {
          v: { type: "enter" }
        };else return {
          v: { type: "replace",
            run: function run() {
              return pm.tr.replace(changeStart, changeEnd.a, updated, changeStart, changeEnd.b).apply();
            } }
        };
    }();

    if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
  } else {
    return false;
  }
}

function after(doc, pos) {
  if (pos.offset < doc.path(pos.path).size) return pos.move(1);else return pos.shorten(null, 1);
}

function offsetBy(first, second, pos) {
  var same = (0, _tree.samePathDepth)(first, second);
  var firstEnd = same == first.depth,
      secondEnd = same == second.depth;
  var off = (secondEnd ? second.offset : second.path[same]) - (firstEnd ? first.offset : first.path[same]);
  var shorter = firstEnd ? pos.move(off) : pos.shorten(same, off);
  if (secondEnd) return shorter;else return shorter.extend(new _model.Pos(second.path.slice(same), second.offset));
}

function findDiffEndConstrained(a, b, start) {
  var end = (0, _model.findDiffEnd)(a, b);
  if (!end) return end;
  if (end.a.cmp(start) < 0) return { a: start, b: offsetBy(end.a, start, end.b) };
  if (end.b.cmp(start) < 0) return { a: offsetBy(end.b, start, end.a), b: start };
  return end;
}

function sameDepth(a, b) {
  var max = Math.min(a.depth, b.depth);
  for (var i = 0; i < max; i++) {
    if (a.path[i] != b.path[i]) return i;
  }return max;
}

function markDirtyFor(pm, start, end) {
  var depth = Math.min(sameDepth(start, end.a), sameDepth(start, end.b));
  if (depth == 0) {
    pm.markAllDirty();
  } else {
    var pos = _model.Pos.from(start.path.slice(0, depth));
    pm.markRangeDirty({ from: pos, to: pos.move(1) });
  }
}

// Text-only queries for composition events

function textContext(data) {
  var range = window.getSelection().getRangeAt(0);
  var start = range.startContainer,
      end = range.endContainer;
  if (start == end && start.nodeType == 3) {
    var value = start.nodeValue,
        lead = range.startOffset,
        _end = range.endOffset;
    if (data && _end >= data.length && value.slice(_end - data.length, _end) == data) lead = _end - data.length;
    return { inside: start, lead: lead, trail: value.length - _end };
  }

  var sizeBefore = null,
      sizeAfter = null;
  var before = start.childNodes[range.startOffset - 1] || nodeBefore(start);
  while (before.lastChild) {
    before = before.lastChild;
  }if (before && before.nodeType == 3) {
    var _value = before.nodeValue;
    sizeBefore = _value.length;
    if (data && _value.slice(_value.length - data.length) == data) sizeBefore -= data.length;
  }
  var after = end.childNodes[range.endOffset] || nodeAfter(end);
  while (after.firstChild) {
    after = after.firstChild;
  }if (after && after.nodeType == 3) sizeAfter = after.nodeValue.length;

  return { before: before, sizeBefore: sizeBefore,
    after: after, sizeAfter: sizeAfter };
}

function textInContext(context, deflt) {
  if (context.inside) {
    var _val = context.inside.nodeValue;
    return _val.slice(context.lead, _val.length - context.trail);
  } else {
    var before = context.before,
        after = context.after,
        val = "";
    if (!before) return deflt;
    if (before.nodeType == 3) val = before.nodeValue.slice(context.sizeBefore);
    var scan = scanText(before, after);
    if (scan == null) return deflt;
    val += scan;
    if (after && after.nodeType == 3) {
      var valAfter = after.nodeValue;
      val += valAfter.slice(0, valAfter.length - context.sizeAfter);
    }
    return val;
  }
}

function nodeAfter(node) {
  for (;;) {
    var next = node.nextSibling;
    if (next) {
      while (next.firstChild) {
        next = next.firstChild;
      }return next;
    }
    if (!(node = node.parentElement)) return null;
  }
}

function nodeBefore(node) {
  for (;;) {
    var prev = node.previousSibling;
    if (prev) {
      while (prev.lastChild) {
        prev = prev.lastChild;
      }return prev;
    }
    if (!(node = node.parentElement)) return null;
  }
}

function scanText(start, end) {
  var text = "",
      cur = nodeAfter(start);
  for (;;) {
    if (cur == end) return text;
    if (!cur) return null;
    if (cur.nodeType == 3) text += cur.nodeValue;
    cur = cur.firstChild || nodeAfter(cur);
  }
}