"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.baseCommands = undefined;

var _model = require("../model");

var _transform = require("../transform");

var _error = require("../util/error");

var _char = require("./char");

var _selection = require("./selection");

var _dompos = require("./dompos");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// :: Object<CommandSpec>
// The set of default commands defined by the core library. They are
// included in the [default command set](#CommandSet.default).
var baseCommands = exports.baseCommands = Object.create(null);

// Get an offset moving backward from a current offset inside a node.
function moveBackward(parent, offset, by) {
  if (by != "char" && by != "word") throw new _error.AssertionError("Unknown motion unit: " + by);

  var cat = null,
      counted = 0;
  for (;;) {
    if (offset == 0) return offset;

    var _parent$chunkBefore = parent.chunkBefore(offset);

    var start = _parent$chunkBefore.start;
    var node = _parent$chunkBefore.node;

    if (!node.isText) return cat ? offset : offset - 1;

    if (by == "char") {
      for (var i = offset - start; i > 0; i--) {
        if (!(0, _char.isExtendingChar)(node.text.charAt(i - 1))) return offset - 1;
        offset--;
      }
    } else if (by == "word") {
      // Work from the current position backwards through text of a singular
      // character category (e.g. "cat" of "#!*") until reaching a character in a
      // different category (i.e. the end of the word).
      for (var _i = offset - start; _i > 0; _i--) {
        var nextCharCat = (0, _char.charCategory)(node.text.charAt(_i - 1));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset--;
        counted++;
      }
    }
  }
}

// ;; #kind=command
// Delete the selection, if there is one.
//
// **Keybindings:** Backspace, Delete, Mod-Backspace, Mod-Delete,
// **Ctrl-H (Mac), Alt-Backspace (Mac), Ctrl-D (Mac),
// **Ctrl-Alt-Backspace (Mac), Alt-Delete (Mac), Alt-D (Mac)
baseCommands.deleteSelection = {
  label: "Delete the selection",
  run: function run(pm) {
    return pm.tr.replaceSelection().apply(pm.apply.scroll);
  },

  keys: {
    all: ["Backspace(10)", "Delete(10)", "Mod-Backspace(10)", "Mod-Delete(10)"],
    mac: ["Ctrl-H(10)", "Alt-Backspace(10)", "Ctrl-D(10)", "Ctrl-Alt-Backspace(10)", "Alt-Delete(10)", "Alt-D(10)"]
  }
};

function deleteBarrier(pm, cut) {
  var around = pm.doc.path(cut.path);
  var before = around.child(cut.offset - 1),
      after = around.child(cut.offset);
  if (before.type.canContainContent(after.type)) {
    var tr = pm.tr.join(cut);
    if (tr.steps.length && before.size == 0 && !before.sameMarkup(after)) tr.setNodeType(cut.move(-1), after.type, after.attrs);
    if (tr.apply(pm.apply.scroll) !== false) return;
  }

  var conn = void 0;
  if (after.isTextblock && (conn = before.type.findConnection(after.type))) {
    var _tr = pm.tr,
        end = cut.move(1);
    _tr.step("ancestor", cut, end, null, { types: [before.type].concat(_toConsumableArray(conn)),
      attrs: [before.attrs].concat(_toConsumableArray(conn.map(function () {
        return null;
      }))) });
    _tr.join(end);
    _tr.join(cut);
    if (_tr.apply(pm.apply.scroll) !== false) return;
  }

  var selAfter = (0, _selection.findSelectionFrom)(pm.doc, cut, 1);
  return pm.tr.lift(selAfter.from, selAfter.to).apply(pm.apply.scroll);
}

// ;; #kind=command
// If the selection is empty and at the start of a textblock, move
// that block closer to the block before it, by lifting it out of its
// parent or, if it has no parent it doesn't share with the node
// before it, moving it into a parent of that node, or joining it with
// that.
//
// **Keybindings:** Backspace, Mod-Backspace
baseCommands.joinBackward = {
  label: "Join with the block above",
  run: function run(pm) {
    var _pm$selection = pm.selection;
    var head = _pm$selection.head;
    var empty = _pm$selection.empty;

    if (!empty || head.offset > 0) return false;

    // Find the node before this one
    var before = void 0,
        cut = void 0;
    for (var i = head.path.length - 1; !before && i >= 0; i--) {
      if (head.path[i] > 0) {
        cut = head.shorten(i);
        before = pm.doc.path(cut.path).child(cut.offset - 1);
      }
    } // If there is no node before this, try to lift
    if (!before) return pm.tr.lift(head).apply(pm.apply.scroll);

    // If the node below has no content and the node above is
    // selectable, delete the node below and select the one above.
    if (before.type.contains == null && before.type.selectable && pm.doc.path(head.path).size == 0) {
      var tr = pm.tr.delete(cut, cut.move(1)).apply(pm.apply.scroll);
      pm.setNodeSelection(cut.move(-1));
      return tr;
    }

    // If the node doesn't allow children, delete it
    if (before.type.contains == null) return pm.tr.delete(cut.move(-1), cut).apply(pm.apply.scroll);

    // Apply the joining algorithm
    return deleteBarrier(pm, cut);
  },

  keys: ["Backspace(30)", "Mod-Backspace(30)"]
};

// ;; #kind=command
// Delete the character before the cursor, if the selection is empty
// and the cursor isn't at the start of a textblock.
//
// **Keybindings:** Backspace, Ctrl-H (Mac)
baseCommands.deleteCharBefore = {
  label: "Delete a character before the cursor",
  run: function run(pm) {
    var _pm$selection2 = pm.selection;
    var head = _pm$selection2.head;
    var empty = _pm$selection2.empty;

    if (!empty || head.offset == 0) return false;
    var from = moveBackward(pm.doc.path(head.path), head.offset, "char");
    return pm.tr.delete(new _model.Pos(head.path, from), head).apply(pm.apply.scroll);
  },

  keys: {
    all: ["Backspace(60)"],
    mac: ["Ctrl-H(40)"]
  }
};

// ;; #kind=command
// Delete the word before the cursor, if the selection is empty and
// the cursor isn't at the start of a textblock.
//
// **Keybindings:** Mod-Backspace, Alt-Backspace (Mac)
baseCommands.deleteWordBefore = {
  label: "Delete the word before the cursor",
  run: function run(pm) {
    var _pm$selection3 = pm.selection;
    var head = _pm$selection3.head;
    var empty = _pm$selection3.empty;

    if (!empty || head.offset == 0) return false;
    var from = moveBackward(pm.doc.path(head.path), head.offset, "word");
    return pm.tr.delete(new _model.Pos(head.path, from), head).apply(pm.apply.scroll);
  },

  keys: {
    all: ["Mod-Backspace(40)"],
    mac: ["Alt-Backspace(40)"]
  }
};

function moveForward(parent, offset, by) {
  if (by != "char" && by != "word") throw new _error.AssertionError("Unknown motion unit: " + by);

  var cat = null,
      counted = 0;
  for (;;) {
    if (offset == parent.size) return offset;

    var _parent$chunkAfter = parent.chunkAfter(offset);

    var start = _parent$chunkAfter.start;
    var node = _parent$chunkAfter.node;

    if (!node.isText) return cat ? offset : offset + 1;

    if (by == "char") {
      for (var i = offset - start; i < node.text.length; i++) {
        if (!(0, _char.isExtendingChar)(node.text.charAt(i + 1))) return offset + 1;
        offset++;
      }
    } else if (by == "word") {
      for (var _i2 = offset - start; _i2 < node.text.length; _i2++) {
        var nextCharCat = (0, _char.charCategory)(node.text.charAt(_i2));
        if (cat == null || counted == 1 && cat == "space") cat = nextCharCat;else if (cat != nextCharCat) return offset;
        offset++;
        counted++;
      }
    }
  }
}

// ;; #kind=command
// If the selection is empty and the cursor is at the end of a
// textblock, move the node after it closer to the node with the
// cursor (lifting it out of parents that aren't shared, moving it
// into parents of the cursor block, or joining the two when they are
// siblings).
//
// **Keybindings:** Delete, Mod-Delete
baseCommands.joinForward = {
  label: "Join with the block below",
  run: function run(pm) {
    var _pm$selection4 = pm.selection;
    var head = _pm$selection4.head;
    var empty = _pm$selection4.empty;

    if (!empty || head.offset < pm.doc.path(head.path).size) return false;

    // Find the node after this one
    var after = void 0,
        cut = void 0;
    for (var i = head.path.length - 1; !after && i >= 0; i--) {
      cut = head.shorten(i, 1);
      var parent = pm.doc.path(cut.path);
      if (cut.offset < parent.size) after = parent.child(cut.offset);
    }

    // If there is no node after this, there's nothing to do
    if (!after) return false;

    // If the node doesn't allow children, delete it
    if (after.type.contains == null) return pm.tr.delete(cut, cut.move(1)).apply(pm.apply.scroll);

    // Apply the joining algorithm
    return deleteBarrier(pm, cut);
  },

  keys: ["Delete(30)", "Mod-Delete(30)"]
};

// ;; #kind=command
// Delete the character after the cursor, if the selection is empty
// and the cursor isn't at the end of its textblock.
//
// **Keybindings:** Delete, Ctrl-D (Mac)
baseCommands.deleteCharAfter = {
  label: "Delete a character after the cursor",
  run: function run(pm) {
    var _pm$selection5 = pm.selection;
    var head = _pm$selection5.head;
    var empty = _pm$selection5.empty;

    if (!empty || head.offset == pm.doc.path(head.path).size) return false;
    var to = moveForward(pm.doc.path(head.path), head.offset, "char");
    return pm.tr.delete(head, new _model.Pos(head.path, to)).apply(pm.apply.scroll);
  },

  keys: {
    all: ["Delete(60)"],
    mac: ["Ctrl-D(60)"]
  }
};

// ;; #kind=command
// Delete the word after the cursor, if the selection is empty and the
// cursor isn't at the end of a textblock.
//
// **Keybindings:** Mod-Delete, Ctrl-Alt-Backspace (Mac), Alt-Delete
// (Mac), Alt-D (Mac)
baseCommands.deleteWordAfter = {
  label: "Delete a word after the cursor",
  run: function run(pm) {
    var _pm$selection6 = pm.selection;
    var head = _pm$selection6.head;
    var empty = _pm$selection6.empty;

    if (!empty || head.offset == pm.doc.path(head.path).size) return false;
    var to = moveForward(pm.doc.path(head.path), head.offset, "word");
    return pm.tr.delete(head, new _model.Pos(head.path, to)).apply(pm.apply.scroll);
  },

  keys: {
    all: ["Mod-Delete(40)"],
    mac: ["Ctrl-Alt-Backspace(40)", "Alt-Delete(40)", "Alt-D(40)"]
  }
};

function joinPointAbove(pm) {
  var _pm$selection7 = pm.selection;
  var node = _pm$selection7.node;
  var from = _pm$selection7.from;

  if (node) return (0, _transform.joinableBlocks)(pm.doc, from) ? from : null;else return (0, _transform.joinPoint)(pm.doc, from, -1);
}

// ;; #kind=command
// Join the selected block or, if there is a text selection, the
// closest ancestor block of the selection that can be joined, with
// the sibling above it.
//
// **Keybindings:** Alt-Up
baseCommands.joinUp = {
  label: "Join with above block",
  run: function run(pm) {
    var point = joinPointAbove(pm),
        isNode = pm.selection.node;
    if (!point) return false;
    pm.tr.join(point).apply();
    if (isNode) pm.setNodeSelection(point.move(-1));
  },
  select: function select(pm) {
    return joinPointAbove(pm);
  },

  menu: {
    group: "block", rank: 80,
    display: {
      type: "icon",
      width: 800, height: 900,
      path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
    }
  },
  keys: ["Alt-Up"]
};

function joinPointBelow(pm) {
  var _pm$selection8 = pm.selection;
  var node = _pm$selection8.node;
  var to = _pm$selection8.to;

  if (node) return (0, _transform.joinableBlocks)(pm.doc, to) ? to : null;else return (0, _transform.joinPoint)(pm.doc, to, 1);
}

// ;; #kind=command
// Join the selected block, or the closest ancestor of the selection
// that can be joined, with the sibling after it.
//
// **Keybindings:** Alt-Down
baseCommands.joinDown = {
  label: "Join with below block",
  run: function run(pm) {
    var node = pm.selection.node;
    var point = joinPointBelow(pm);
    if (!point) return false;
    pm.tr.join(point).apply();
    if (node) pm.setNodeSelection(point.move(-1));
  },
  select: function select(pm) {
    return joinPointBelow(pm);
  },

  keys: ["Alt-Down"]
};

// ;; #kind=command
// Lift the selected block, or the closest ancestor block of the
// selection that can be lifted, out of its parent node.
//
// **Keybindings:** Ctrl-[
baseCommands.lift = {
  label: "Lift out of enclosing block",
  run: function run(pm) {
    var _pm$selection9 = pm.selection;
    var from = _pm$selection9.from;
    var to = _pm$selection9.to;

    return pm.tr.lift(from, to).apply(pm.apply.scroll);
  },
  select: function select(pm) {
    var _pm$selection10 = pm.selection;
    var from = _pm$selection10.from;
    var to = _pm$selection10.to;

    return (0, _transform.canLift)(pm.doc, from, to);
  },

  menu: {
    group: "block", rank: 75,
    display: {
      type: "icon",
      width: 1024, height: 1024,
      path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
    }
  },
  keys: ["Mod-["]
};

// ;; #kind=command
// If the selection is in a node whose type has a truthy `isCode`
// property, replace the selection with a newline character.
//
// **Keybindings:** Enter
baseCommands.newlineInCode = {
  label: "Insert newline",
  run: function run(pm) {
    var _pm$selection11 = pm.selection;
    var from = _pm$selection11.from;
    var to = _pm$selection11.to;
    var node = _pm$selection11.node;var block = void 0;
    if (!node && _model.Pos.samePath(from.path, to.path) && (block = pm.doc.path(from.path)).type.isCode && to.offset < block.size) return pm.tr.typeText("\n").apply(pm.apply.scroll);else return false;
  },

  keys: ["Enter(10)"]
};

// ;; #kind=command
// If a block node is selected, create an empty paragraph before (if
// it is its parent's first child) or after it.
//
// **Keybindings:** Enter
baseCommands.createParagraphNear = {
  label: "Create a paragraph near the selected block",
  run: function run(pm) {
    var _pm$selection12 = pm.selection;
    var from = _pm$selection12.from;
    var to = _pm$selection12.to;
    var node = _pm$selection12.node;

    if (!node || !node.isBlock) return false;
    var side = from.offset ? to : from;
    pm.tr.insert(side, pm.schema.defaultTextblockType().create()).apply(pm.apply.scroll);
    pm.setTextSelection(new _model.Pos(side.toPath(), 0));
  },

  keys: ["Enter(20)"]
};

// ;; #kind=command
// If the cursor is in an empty textblock that can be lifted, lift the
// block.
//
// **Keybindings:** Enter
baseCommands.liftEmptyBlock = {
  label: "Move current block up",
  run: function run(pm) {
    var _pm$selection13 = pm.selection;
    var head = _pm$selection13.head;
    var empty = _pm$selection13.empty;

    if (!empty || head.offset > 0 || pm.doc.path(head.path).size) return false;
    if (head.depth > 1) {
      var shorter = head.shorten();
      if (shorter.offset > 0 && shorter.offset < pm.doc.path(shorter.path).size - 1 && pm.tr.split(shorter).apply() !== false) return;
    }
    return pm.tr.lift(head).apply(pm.apply.scroll);
  },

  keys: ["Enter(30)"]
};

// ;; #kind=command
// Split the parent block of the selection. If the selection is a text
// selection, delete it.
//
// **Keybindings:** Enter
baseCommands.splitBlock = {
  label: "Split the current block",
  run: function run(pm) {
    var _pm$selection14 = pm.selection;
    var from = _pm$selection14.from;
    var to = _pm$selection14.to;
    var node = _pm$selection14.node;var block = pm.doc.path(to.path);
    if (node && node.isBlock) {
      if (!from.offset) return false;
      return pm.tr.split(from).apply(pm.apply.scroll);
    } else {
      var deflt = pm.schema.defaultTextblockType();
      var type = to.offset == block.size ? deflt : null;
      var tr = pm.tr.delete(from, to).split(from, 1, type);
      if (to.offset < block.size && !from.offset && pm.doc.path(from.path).type != deflt) tr.setNodeType(from.shorten(), deflt);
      return tr.apply(pm.apply.scroll);
    }
  },

  keys: ["Enter(60)"]
};

function nodeAboveSelection(pm) {
  var sel = pm.selection,
      i = 0;
  if (sel.node) return !!sel.from.depth && sel.from.shorten();
  for (; i < sel.head.depth && i < sel.anchor.depth; i++) {
    if (sel.head.path[i] != sel.anchor.path[i]) break;
  }return i == 0 ? false : sel.head.shorten(i - 1);
}

// ;; #kind=command
// Move the selection to the node wrapping the current selection, if
// any. (Will not select the document node.)
//
// **Keybindings:** Esc
baseCommands.selectParentNode = {
  label: "Select parent node",
  run: function run(pm) {
    var node = nodeAboveSelection(pm);
    if (!node) return false;
    pm.setNodeSelection(node);
  },
  select: function select(pm) {
    return nodeAboveSelection(pm);
  },

  menu: {
    group: "block", rank: 90,
    display: { type: "icon", text: "⬚", style: "font-weight: bold" }
  },
  keys: ["Esc"]
};

function moveSelectionBlock(pm, dir) {
  var _pm$selection15 = pm.selection;
  var from = _pm$selection15.from;
  var to = _pm$selection15.to;
  var node = _pm$selection15.node;

  var side = dir > 0 ? to : from;
  return (0, _selection.findSelectionFrom)(pm.doc, node && node.isBlock ? side : side.shorten(null, dir > 0 ? 1 : 0), dir);
}

function selectNodeHorizontally(pm, dir) {
  var _pm$selection16 = pm.selection;
  var empty = _pm$selection16.empty;
  var node = _pm$selection16.node;
  var from = _pm$selection16.from;
  var to = _pm$selection16.to;

  if (!empty && !node) return false;

  if (node && node.isInline) {
    pm.setTextSelection(dir > 0 ? to : from);
    return true;
  }

  var parent = void 0;
  if (!node && (parent = pm.doc.path(from.path)) && (dir > 0 ? from.offset < parent.size : from.offset)) {
    var _ref = dir > 0 ? parent.chunkAfter(from.offset) : parent.chunkBefore(from.offset);

    var nextNode = _ref.node;
    var start = _ref.start;

    if (nextNode.type.selectable && start == from.offset - (dir > 0 ? 0 : 1)) {
      pm.setNodeSelection(dir < 0 ? from.move(-1) : from);
      return true;
    }
    return false;
  }

  var next = moveSelectionBlock(pm, dir);
  if (next && (next instanceof _selection.NodeSelection || node)) {
    pm.setSelectionDirect(next);
    return true;
  }
  return false;
}

// ;; #kind=command
// Select the node directly before the cursor, if any.
//
// **Keybindings:** Left, Mod-Left
baseCommands.selectNodeLeft = {
  label: "Move the selection onto or out of the block to the left",
  run: function run(pm) {
    var done = selectNodeHorizontally(pm, -1);
    if (done) pm.scrollIntoView();
    return done;
  },

  keys: {
    all: ["Left", "Mod-Left"],
    mac: ["Alt-Left"]
  }
};

// ;; #kind=command
// Select the node directly after the cursor, if any.
//
// **Keybindings:** Right, Mod-Right
baseCommands.selectNodeRight = {
  label: "Move the selection onto or out of the block to the right",
  run: function run(pm) {
    var done = selectNodeHorizontally(pm, 1);
    if (done) pm.scrollIntoView();
    return done;
  },

  keys: {
    all: ["Right", "Mod-Right"],
    mac: ["Alt-Left"]
  }
};

// : (ProseMirror, number)
// Check whether vertical selection motion would involve node
// selections. If so, apply it (if not, the result is left to the
// browser)
function selectNodeVertically(pm, dir) {
  var _pm$selection17 = pm.selection;
  var empty = _pm$selection17.empty;
  var node = _pm$selection17.node;
  var from = _pm$selection17.from;
  var to = _pm$selection17.to;

  if (!empty && !node) return false;

  var leavingTextblock = true;
  if (!node || node.isInline) leavingTextblock = (0, _selection.verticalMotionLeavesTextblock)(pm, dir > 0 ? to : from, dir);

  if (leavingTextblock) {
    var next = moveSelectionBlock(pm, dir);
    if (next && next instanceof _selection.NodeSelection) {
      pm.setSelectionDirect(next);
      if (!node) pm.sel.lastNonNodePos = from;
      return true;
    }
  }

  if (!node) return false;

  if (node.isInline) {
    (0, _dompos.setDOMSelectionToPos)(pm, from);
    return false;
  }

  var last = pm.sel.lastNonNodePos;
  var beyond = (0, _selection.findSelectionFrom)(pm.doc, dir < 0 ? from : to, dir);
  if (last && beyond && _model.Pos.samePath(last.path, beyond.from.path)) {
    (0, _dompos.setDOMSelectionToPos)(pm, last);
    return false;
  }
  if (beyond) pm.setSelectionDirect(beyond);
  return true;
}

// ;; #kind=command
// Select the node directly above the cursor, if any.
//
// **Keybindings:** Up
baseCommands.selectNodeUp = {
  label: "Move the selection onto or out of the block above",
  run: function run(pm) {
    var done = selectNodeVertically(pm, -1);
    if (done !== false) pm.scrollIntoView();
    return done;
  },

  keys: ["Up"]
};

// ;; #kind=command
// Select the node directly below the cursor, if any.
//
// **Keybindings:** Down
baseCommands.selectNodeDown = {
  label: "Move the selection onto or out of the block below",
  run: function run(pm) {
    var done = selectNodeVertically(pm, 1);
    if (done !== false) pm.scrollIntoView();
    return done;
  },

  keys: ["Down"]
};

// ;; #kind=command
// Undo the most recent change event, if any.
//
// **Keybindings:** Mod-Z
baseCommands.undo = {
  label: "Undo last change",
  run: function run(pm) {
    pm.scrollIntoView();return pm.history.undo();
  },
  select: function select(pm) {
    return pm.history.undoDepth > 0;
  },

  menu: {
    group: "history", rank: 10,
    display: {
      type: "icon",
      width: 1024, height: 1024,
      path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
    }
  },
  keys: ["Mod-Z"]
};

// ;; #kind=command
// Redo the most recently undone change event, if any.
//
// **Keybindings:** Mod-Y, Shift-Mod-Z
baseCommands.redo = {
  label: "Redo last undone change",
  run: function run(pm) {
    pm.scrollIntoView();return pm.history.redo();
  },
  select: function select(pm) {
    return pm.history.redoDepth > 0;
  },

  menu: {
    group: "history", rank: 20,
    display: {
      type: "icon",
      width: 1024, height: 1024,
      path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
    }
  },
  keys: ["Mod-Y", "Shift-Mod-Z"]
};