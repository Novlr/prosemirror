"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Input = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.dispatchKey = dispatchKey;

var _browserkeymap = require("browserkeymap");

var _browserkeymap2 = _interopRequireDefault(_browserkeymap);

var _model = require("../model");

var _format = require("../format");

var _capturekeys = require("./capturekeys");

var _dom = require("../dom");

var _domchange = require("./domchange");

var _selection = require("./selection");

var _dompos = require("./dompos");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stopSeq = null;

// A collection of DOM events that occur within the editor, and callback functions
// to invoke when the event fires.
var handlers = {};

var Input = exports.Input = function () {
  function Input(pm) {
    var _this = this;

    _classCallCheck(this, Input);

    this.pm = pm;
    this.baseKeymap = null;

    this.keySeq = null;

    // When the user is creating a composed character,
    // this is set to a Composing instance.
    this.composing = null;
    this.mouseDown = null;
    this.shiftKey = this.updatingComposition = false;
    this.skipInput = 0;

    this.draggingFrom = false;

    this.keymaps = [];
    this.defaultKeymap = null;

    this.storedMarks = null;

    this.dropTarget = pm.wrapper.appendChild((0, _dom.elt)("div", { class: "ProseMirror-drop-target" }));

    var _loop = function _loop(event) {
      var handler = handlers[event];
      pm.content.addEventListener(event, function (e) {
        return handler(pm, e);
      });
    };

    for (var event in handlers) {
      _loop(event);
    }

    pm.on("selectionChange", function () {
      return _this.storedMarks = null;
    });
  }

  _createClass(Input, [{
    key: "maybeAbortComposition",
    value: function maybeAbortComposition() {
      if (this.composing && !this.updatingComposition) {
        if (this.composing.finished) {
          finishComposing(this.pm);
        } else {
          // Toggle selection to force end of composition
          this.composing = null;
          this.skipInput++;
          var sel = window.getSelection();
          if (sel.rangeCount) {
            var range = sel.getRangeAt(0);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
        return true;
      }
    }
  }]);

  return Input;
}();

// Dispatch a key press to the internal keymaps, which will override the default
// DOM behavior.


function dispatchKey(pm, name, e) {
  var seq = pm.input.keySeq;
  // If the previous key should be used in sequence with this one, modify the name accordingly.
  if (seq) {
    if (_browserkeymap2.default.isModifierKey(name)) return true;
    clearTimeout(stopSeq);
    stopSeq = setTimeout(function () {
      if (pm.input.keySeq == seq) pm.input.keySeq = null;
    }, 50);
    name = seq + " " + name;
  }

  var handle = function handle(bound) {
    if (bound === false) return "nothing";
    if (bound == "...") return "multi";
    if (bound == null) return false;

    var result = false;
    if (Array.isArray(bound)) {
      for (var i = 0; result === false && i < bound.length; i++) {
        result = handle(bound[i]);
      }
    } else if (typeof bound == "string") {
      result = pm.execCommand(bound);
    } else {
      result = bound(pm);
    }
    return result == false ? false : "handled";
  };

  var result = void 0;
  for (var i = 0; !result && i < pm.input.keymaps.length; i++) {
    result = handle(pm.input.keymaps[i].map.lookup(name, pm));
  }if (!result) result = handle(pm.input.baseKeymap.lookup(name, pm)) || handle(_capturekeys.captureKeys.lookup(name));

  // If the key should be used in sequence with the next key, store the keyname internally.
  if (result == "multi") pm.input.keySeq = name;

  if (result == "handled" || result == "multi") e.preventDefault();

  if (seq && !result && /\'$/.test(name)) {
    e.preventDefault();
    return true;
  }
  return !!result;
}

handlers.keydown = function (pm, e) {
  // :: () #path=ProseMirror#events#interaction
  // Fired when the user interacts with the editor, for example by
  // clicking on it or pressing a key while it is focused. Mostly
  // useful for closing or resetting transient UI state such as open
  // menus.
  if (!(0, _selection.hasFocus)(pm)) return;
  pm.signal("interaction");
  if (e.keyCode == 16) pm.input.shiftKey = true;
  if (pm.input.composing) return;
  var name = _browserkeymap2.default.keyName(e);
  if (name && dispatchKey(pm, name, e)) return;
  pm.sel.fastPoll();
};

handlers.keyup = function (pm, e) {
  if (e.keyCode == 16) pm.input.shiftKey = false;
};

// : (ProseMirror, TextSelection, string)
// Insert text into a document.
function inputText(pm, range, text) {
  if (range.empty && !text) return false;
  var marks = pm.input.storedMarks || pm.doc.marksAt(range.from);
  pm.tr.replaceWith(range.from, range.to, pm.schema.text(text, marks)).apply({ scrollIntoView: true });
  // :: () #path=ProseMirror#events#textInput
  // Fired when the user types text into the editor.
  pm.signal("textInput", text);
}

handlers.keypress = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm) || pm.input.composing || !e.charCode || e.ctrlKey && !e.altKey || _dom.browser.mac && e.metaKey) return;
  if (dispatchKey(pm, _browserkeymap2.default.keyName(e), e)) return;
  var sel = pm.selection;
  if (sel.node && sel.node.contains == null) {
    pm.tr.delete(sel.from, sel.to).apply();
    sel = pm.selection;
  }
  inputText(pm, sel, String.fromCharCode(e.charCode));
  e.preventDefault();
};

function selectClickedNode(pm, e) {
  var pos = (0, _dompos.selectableNodeAbove)(pm, e.target, { left: e.clientX, top: e.clientY }, true);
  if (!pos) return pm.sel.fastPoll();

  var _pm$selection = pm.selection;
  var node = _pm$selection.node;
  var from = _pm$selection.from;

  if (node && pos.depth >= from.depth && pos.shorten(from.depth).cmp(from) == 0) {
    if (from.depth == 0) return pm.sel.fastPoll();
    pos = from.shorten();
  }

  pm.setNodeSelection(pos);
  pm.focus();
  e.preventDefault();
}

var lastClick = 0,
    oneButLastClick = 0;

function handleTripleClick(pm, e) {
  e.preventDefault();
  var pos = (0, _dompos.selectableNodeAbove)(pm, e.target, { left: e.clientX, top: e.clientY }, true);
  if (pos) {
    var node = pm.doc.nodeAfter(pos);
    if (node.isBlock && !node.isTextblock) {
      pm.setNodeSelection(pos);
    } else {
      var path = node.isInline ? pos.path : pos.toPath();
      if (node.isInline) node = pm.doc.path(path);
      pm.setTextSelection(new _model.Pos(path, 0), new _model.Pos(path, node.size));
    }
    pm.focus();
  }
}

handlers.mousedown = function (pm, e) {
  pm.signal("interaction");
  var now = Date.now(),
      doubleClick = now - lastClick < 500,
      tripleClick = now - oneButLastClick < 600;
  oneButLastClick = lastClick;
  lastClick = now;

  if (tripleClick) handleTripleClick(pm, e);else if (doubleClick && (0, _dompos.handleNodeClick)(pm, "handleDoubleClick", e, true)) {} else pm.input.mouseDown = new MouseDown(pm, e, doubleClick);
};

var MouseDown = function () {
  function MouseDown(pm, event, doubleClick) {
    _classCallCheck(this, MouseDown);

    this.pm = pm;
    this.event = event;
    this.leaveToBrowser = pm.input.shiftKey || doubleClick;

    var path = (0, _dompos.pathFromDOM)(pm, event.target),
        node = pm.doc.path(path);
    this.mightDrag = node.type.draggable || node == pm.sel.range.node ? path : null;
    if (this.mightDrag) {
      event.target.draggable = true;
      if (_dom.browser.gecko && (this.setContentEditable = !event.target.hasAttribute("contentEditable"))) event.target.setAttribute("contentEditable", "false");
    }

    this.x = event.clientX;this.y = event.clientY;

    window.addEventListener("mouseup", this.up = this.up.bind(this));
    window.addEventListener("mousemove", this.move = this.move.bind(this));
    pm.sel.fastPoll();
  }

  _createClass(MouseDown, [{
    key: "done",
    value: function done() {
      window.removeEventListener("mouseup", this.up);
      window.removeEventListener("mousemove", this.move);
      if (this.mightDrag) {
        this.event.target.draggable = false;
        if (_dom.browser.gecko && this.setContentEditable) this.event.target.removeAttribute("contentEditable");
      }
    }
  }, {
    key: "up",
    value: function up(event) {
      this.done();

      if (this.leaveToBrowser || !(0, _dom.contains)(this.pm.content, event.target)) {
        this.pm.sel.fastPoll();
      } else if (this.event.ctrlKey) {
        selectClickedNode(this.pm, event);
      } else if (!(0, _dompos.handleNodeClick)(this.pm, "handleClick", event, true)) {
        var pos = (0, _dompos.selectableNodeAbove)(this.pm, event.target, { left: this.x, top: this.y });
        if (pos) {
          this.pm.setNodeSelection(pos);
          this.pm.focus();
        } else {
          this.pm.sel.fastPoll();
        }
      }
    }
  }, {
    key: "move",
    value: function move(event) {
      if (!this.leaveToBrowser && (Math.abs(this.x - event.clientX) > 4 || Math.abs(this.y - event.clientY) > 4)) this.leaveToBrowser = true;
      this.pm.sel.fastPoll();
    }
  }]);

  return MouseDown;
}();

handlers.touchdown = function (pm) {
  pm.sel.fastPoll();
};

handlers.contextmenu = function (pm, e) {
  (0, _dompos.handleNodeClick)(pm, "handleContextMenu", e, false);
};

// A class to track state while creating a composed character.

var Composing = function Composing(pm, data) {
  _classCallCheck(this, Composing);

  this.finished = false;
  this.context = (0, _domchange.textContext)(data);
  this.data = data;
  this.endData = null;
  var range = pm.selection;
  if (data) {
    var path = range.head.path,
        line = pm.doc.path(path).textContent;
    var found = line.indexOf(data, range.head.offset - data.length);
    if (found > -1 && found <= range.head.offset + data.length) range = new _selection.TextSelection(new _model.Pos(path, found), new _model.Pos(path, found + data.length));
  }
  this.range = range;
};

handlers.compositionstart = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm) || pm.input.maybeAbortComposition()) return;

  pm.flush();
  pm.input.composing = new Composing(pm, e.data);
  var above = pm.selection.head.shorten();
  pm.markRangeDirty({ from: above, to: above.move(1) });
};

handlers.compositionupdate = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  var info = pm.input.composing;
  if (info && info.data != e.data) {
    info.data = e.data;
    pm.input.updatingComposition = true;
    inputText(pm, info.range, info.data);
    pm.input.updatingComposition = false;
    info.range = new _selection.TextSelection(info.range.from, info.range.from.move(info.data.length));
  }
};

handlers.compositionend = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  var info = pm.input.composing;
  if (info) {
    pm.input.composing.finished = true;
    pm.input.composing.endData = e.data;
    setTimeout(function () {
      if (pm.input.composing == info) finishComposing(pm);
    }, 20);
  }
};

function finishComposing(pm) {
  var info = pm.input.composing;
  var text = (0, _domchange.textInContext)(info.context, info.endData);
  var range = (0, _selection.rangeFromDOMLoose)(pm);
  pm.ensureOperation();
  pm.input.composing = null;
  if (text != info.data) inputText(pm, info.range, text);
  if (range && !range.eq(pm.sel.range)) pm.setSelectionDirect(range);
}

handlers.input = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  if (pm.input.skipInput) return --pm.input.skipInput;

  if (pm.input.composing) {
    if (pm.input.composing.finished) finishComposing(pm);
    return;
  }

  pm.startOperation({ readSelection: false });
  var change = (0, _domchange.readDOMChange)(pm);
  if (change) {
    if (change.type == "enter") dispatchKey(pm, "Enter", e);else change.run();
  }
  pm.scrollIntoView();
};

function toClipboard(doc, from, to, dataTransfer) {
  var found = void 0,
      max = Math.min(from.depth, to.depth);
  for (var depth = 0, node = doc.sliceBetween(from, to); depth <= max; depth++) {
    if (node.type.defaultAttrs) found = { depth: depth, node: node };
    if (node.size > 1) break;
    node = node.firstChild;
  }

  var attr = found.node.type.name + " " + (from.depth - found.depth) + " " + (to.depth - found.depth);
  var html = "<div pm-context=\"" + attr + "\">" + (0, _format.toHTML)(found.node) + "</div>";
  dataTransfer.clearData();
  dataTransfer.setData("text/html", html);
  dataTransfer.setData("text/plain", (0, _format.toText)(found.node));
}

function fromClipboard(pm, dataTransfer, plainText) {
  var txt = dataTransfer.getData("text/plain");
  var html = dataTransfer.getData("text/html");
  if (!html && !txt) return null;
  var doc = void 0,
      from = void 0,
      to = void 0;
  if ((plainText || !html) && txt) {
    doc = (0, _format.parseFrom)(pm.schema, pm.signalPipelined("transformPastedText", txt), "text");
  } else {
    var dom = document.createElement("div");
    dom.innerHTML = pm.signalPipelined("transformPastedHTML", html);
    var wrap = dom.querySelector("[pm-context]"),
        context = void 0,
        contextNode = void 0,
        found = void 0;
    if (wrap && (context = /^(\w+) (\d+) (\d+)$/.exec(wrap.getAttribute("pm-context"))) && (contextNode = pm.schema.nodes[context[1]]) && contextNode.defaultAttrs && (found = parseFromContext(wrap, contextNode, +context[2], +context[3]))) {
      ;var _found = found;
      doc = _found.doc;
      from = _found.from;
      to = _found.to;
    } else {
      doc = (0, _format.fromDOM)(pm.schema, dom);
    }
  }
  return { doc: doc,
    from: from || (0, _selection.findSelectionAtStart)(doc).from,
    to: to || (0, _selection.findSelectionAtEnd)(doc).to };
}

// : (Node, number) → Pos
function posAtLeft(doc, depth) {
  var path = [];
  for (var i = 0, node = doc; i < depth; i++) {
    if (!(node = node.firstChild)) break;
    path.push(0);
  }
  return new _model.Pos(path, 0);
}

// : (Node, number) → Pos
function posAtRight(doc, depth) {
  var path = [],
      node = doc;
  for (var i = 0; i < depth; i++) {
    if (!node.size) break;
    path.push(node.size - 1);
    node = node.lastChild;
  }
  return new _model.Pos(path, node.size);
}

function parseFromContext(dom, contextNode, openLeft, openRight) {
  var schema = contextNode.schema,
      top = schema.nodes.doc;
  var doc = (0, _format.fromDOM)(schema, dom, { topNode: contextNode.create(), preserveWhitespace: true });
  if (contextNode != top) {
    var path = top.findConnection(contextNode);
    if (!path) return null;
    for (var i = path.length - 1; i >= -1; i--) {
      doc = (i < 0 ? top : path[i]).create(null, doc);
      ++openLeft;
      ++openRight;
    }
  }
  return { doc: doc, from: posAtLeft(doc, openLeft), to: posAtRight(doc, openRight) };
}

handlers.copy = handlers.cut = function (pm, e) {
  var _pm$selection2 = pm.selection;
  var from = _pm$selection2.from;
  var to = _pm$selection2.to;
  var empty = _pm$selection2.empty;

  if (empty || !e.clipboardData) return;
  toClipboard(pm.doc, from, to, e.clipboardData);
  e.preventDefault();
  if (e.type == "cut" && !empty) pm.tr.delete(from, to).apply();
};

// :: (text: string) → string #path=ProseMirror#events#transformPastedText
// Fired when plain text is pasted. Handlers must return the given
// string or a [transformed](#EventMixin.signalPipelined) version of
// it.

// :: (html: string) → string #path=ProseMirror#events#transformPastedHTML
// Fired when html content is pasted. Handlers must return the given
// string or a [transformed](#EventMixin.signalPipelined) version of
// it.

handlers.paste = function (pm, e) {
  if (!(0, _selection.hasFocus)(pm)) return;
  if (!e.clipboardData) return;
  var sel = pm.selection;
  var fragment = fromClipboard(pm, e.clipboardData, pm.input.shiftKey);
  if (fragment) {
    e.preventDefault();
    pm.tr.replace(sel.from, sel.to, fragment.doc, fragment.from, fragment.to).apply();
    pm.scrollIntoView();
  }
};

handlers.dragstart = function (pm, e) {
  var mouseDown = pm.input.mouseDown;
  if (mouseDown) mouseDown.done();

  if (!e.dataTransfer) return;

  var _pm$selection3 = pm.selection;
  var from = _pm$selection3.from;
  var to = _pm$selection3.to;
  var empty = _pm$selection3.empty;var fragment = void 0;
  var pos = !empty && pm.posAtCoords({ left: e.clientX, top: e.clientY });
  if (pos && pos.cmp(from) >= 0 && pos.cmp(to) <= 0) {
    fragment = { from: from, to: to };
  } else if (mouseDown && mouseDown.mightDrag) {
    var _pos = _model.Pos.from(mouseDown.mightDrag);
    fragment = { from: _pos, to: _pos.move(1) };
  }

  if (fragment) {
    // FIXME the document could change during a drag, invalidating this range
    pm.input.draggingFrom = fragment;
    toClipboard(pm.doc, fragment.from, fragment.to, e.dataTransfer);
  }
};

handlers.dragend = function (pm) {
  return window.setTimeout(function () {
    return pm.input.draggingFrom = false;
  }, 50);
};

handlers.dragover = handlers.dragenter = function (pm, e) {
  e.preventDefault();
  var cursorPos = pm.posAtCoords({ left: e.clientX, top: e.clientY });
  if (!cursorPos) return;
  var coords = (0, _dompos.coordsAtPos)(pm, cursorPos);
  var rect = pm.wrapper.getBoundingClientRect();
  coords.top -= rect.top;
  coords.right -= rect.left;
  coords.bottom -= rect.top;
  coords.left -= rect.left;
  var target = pm.input.dropTarget;
  target.style.display = "block";
  target.style.left = coords.left - 1 + "px";
  target.style.top = coords.top + "px";
  target.style.height = coords.bottom - coords.top + "px";
};

handlers.dragleave = function (pm) {
  return pm.input.dropTarget.style.display = "";
};

handlers.drop = function (pm, e) {
  pm.input.dropTarget.style.display = "";

  // :: (event: DOMEvent) #path=ProseMirror#events#drop
  // Fired when a drop event occurs on the editor content. A handler
  // may declare the event handled by calling `preventDefault` on it
  // or returning a truthy value.
  if (!e.dataTransfer || pm.signalDOM(e)) return;

  var fragment = fromClipboard(pm, e.dataTransfer);
  if (fragment) {
    e.preventDefault();
    var insertPos = pm.posAtCoords({ left: e.clientX, top: e.clientY }),
        origPos = insertPos;
    if (!insertPos) return;
    var tr = pm.tr;
    if (pm.input.draggingFrom && !e.ctrlKey) {
      tr.delete(pm.input.draggingFrom.from, pm.input.draggingFrom.to);
      insertPos = tr.map(insertPos).pos;
    }
    tr.replace(insertPos, insertPos, fragment.doc, fragment.from, fragment.to).apply();
    var posAfter = tr.map(origPos).pos;
    if (_model.Pos.samePath(insertPos.path, posAfter.path) && posAfter.offset == insertPos.offset + 1 && pm.doc.nodeAfter(insertPos).type.selectable) pm.setNodeSelection(insertPos);else pm.setTextSelection(insertPos, posAfter);
    pm.focus();
  }
};

handlers.focus = function (pm) {
  pm.wrapper.classList.add("ProseMirror-focused");
  // :: () #path=ProseMirror#events#focus
  // Fired when the editor gains focus.
  pm.signal("focus");
};

handlers.blur = function (pm) {
  pm.wrapper.classList.remove("ProseMirror-focused");
  // :: () #path=ProseMirror#events#blur
  // Fired when the editor loses focus.
  pm.signal("blur");
};