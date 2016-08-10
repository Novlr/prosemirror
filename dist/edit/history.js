"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.History = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _model = require("../model");

var _transform = require("../transform");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Steps are stored in inverted form (so that they can be applied to
// undo the original).
var InvertedStep = function InvertedStep(step, version, id) {
  _classCallCheck(this, InvertedStep);

  this.step = step;
  this.version = version;
  this.id = id;
};

var HistoryEvent = function HistoryEvent(steps, selection) {
  _classCallCheck(this, HistoryEvent);

  this.steps = steps;
  this.selection = selection;
};

// Assists with remapping a step with other changes that have been
// made since the step was first applied.


var BranchRemapping = function () {
  function BranchRemapping(branch) {
    _classCallCheck(this, BranchRemapping);

    this.branch = branch;
    this.remap = new _transform.Remapping();
    // Track the internal version of what step the current remapping collection
    // would put the content at.
    this.version = branch.version;
    this.mirrorBuffer = Object.create(null);
  }

  // Add all position maps between the current version
  // and the desired version to the remapping collection.


  _createClass(BranchRemapping, [{
    key: "moveToVersion",
    value: function moveToVersion(version) {
      while (this.version > version) {
        this.addNextMap();
      }
    }

    // Add the next map at the current version to the
    // remapping collection.

  }, {
    key: "addNextMap",
    value: function addNextMap() {
      var found = this.branch.mirror[this.version];
      var mapOffset = this.branch.maps.length - (this.branch.version - this.version) - 1;
      var id = this.remap.addToFront(this.branch.maps[mapOffset], this.mirrorBuffer[this.version]);
      --this.version;
      if (found != null) this.mirrorBuffer[found] = id;
      return id;
    }
  }, {
    key: "movePastStep",
    value: function movePastStep(result) {
      var id = this.addNextMap();
      if (result) this.remap.addToBack(result.map, id);
    }
  }]);

  return BranchRemapping;
}();

// The number of milliseconds the compression worker has to compress.


var workTime = 100;

// The number of milliseconds to pause compression worker if it uses
// all its work time.
var pauseTime = 150;

// Help compress steps in events for a branch.

var CompressionWorker = function () {
  function CompressionWorker(doc, branch, callback) {
    _classCallCheck(this, CompressionWorker);

    this.branch = branch;
    this.callback = callback;
    this.remap = new BranchRemapping(branch);

    this.doc = doc;
    this.events = [];
    this.maps = [];
    this.version = this.startVersion = branch.version;

    this.i = branch.events.length;
    this.timeout = null;
    this.aborted = false;
  }

  // Compress steps in all events in the branch.


  _createClass(CompressionWorker, [{
    key: "work",
    value: function work() {
      var _this = this;

      if (this.aborted) return;

      var endTime = Date.now() + workTime;

      for (;;) {
        if (this.i == 0) return this.finish();
        var event = this.branch.events[--this.i];
        var mappedSelection = event.selection && event.selection.map(this.doc, this.remap.remap);
        var outEvent = new HistoryEvent([], mappedSelection);
        for (var j = event.steps.length - 1; j >= 0; j--) {
          var _event$steps$j = event.steps[j];
          var step = _event$steps$j.step;
          var stepVersion = _event$steps$j.version;
          var stepID = _event$steps$j.id;

          this.remap.moveToVersion(stepVersion);

          var mappedStep = step.map(this.remap.remap);

          // Combine contiguous delete steps.
          if (mappedStep && isDelStep(step)) {
            var extra = 0,
                start = step.from;
            while (j > 0) {
              var next = event.steps[j - 1];
              if (next.version != stepVersion - 1 || !isDelStep(next.step) || start.cmp(next.step.to)) break;
              extra += next.step.to.offset - next.step.from.offset;
              start = next.step.from;
              stepVersion--;
              j--;
              this.remap.addNextMap();
            }
            if (extra > 0) {
              var _start = mappedStep.from.move(-extra);
              mappedStep = new _transform.Step("replace", _start, mappedStep.to, _start);
            }
          }
          var result = mappedStep && mappedStep.apply(this.doc);
          if (result) {
            this.doc = result.doc;
            this.maps.push(result.map.invert());
            outEvent.steps.push(new InvertedStep(mappedStep, this.version, stepID));
            this.version--;
          }
          this.remap.movePastStep(result);
        }
        if (outEvent.steps.length) {
          outEvent.steps.reverse();
          this.events.push(outEvent);
        }
        if (Date.now() > endTime) {
          this.timeout = window.setTimeout(function () {
            return _this.work();
          }, pauseTime);
          return;
        }
      }
    }
  }, {
    key: "finish",
    value: function finish() {
      if (this.aborted) return;

      this.events.reverse();
      this.maps.reverse();
      this.callback(this.maps.concat(this.branch.maps.slice(this.branch.maps.length - (this.branch.version - this.startVersion))), this.events);
    }
  }, {
    key: "abort",
    value: function abort() {
      this.aborted = true;
      window.clearTimeout(this.timeout);
    }
  }]);

  return CompressionWorker;
}();

function isDelStep(step) {
  return step.type == "replace" && step.from.offset < step.to.offset && _model.Pos.samePath(step.from.path, step.to.path) && (!step.param || step.param.content.size == 0);
}

// The minimum number of new steps before a compression is started.
var compressStepCount = 150;

// A branch is a history of steps. There'll be one for the undo and
// one for the redo history.

var Branch = function () {
  function Branch(maxDepth) {
    _classCallCheck(this, Branch);

    this.maxDepth = maxDepth;
    this.version = 0;
    this.nextStepID = 1;

    this.maps = [];
    this.mirror = Object.create(null);
    this.events = [];

    this.stepsSinceCompress = 0;
    this.compressing = null;
    this.compressTimeout = null;
  }

  _createClass(Branch, [{
    key: "clear",
    value: function clear(force) {
      if (force || !this.empty()) {
        this.maps.length = this.events.length = this.stepsSinceCompress = 0;
        this.mirror = Object.create(null);
        this.abortCompression();
      }
    }

    // : (Selection)
    // Create a new history event at tip of the branch.

  }, {
    key: "newEvent",
    value: function newEvent(currentSelection) {
      this.abortCompression();
      this.events.push(new HistoryEvent([], currentSelection));

      while (this.events.length > this.maxDepth) {
        this.events.shift();
      }
    }

    // : (PosMap)
    // Add a position map to the branch, either representing one of the
    // changes recorded in the branch, or representing a non-history
    // change that the branch's changes must be mapped through.

  }, {
    key: "addMap",
    value: function addMap(map) {
      if (!this.empty()) {
        this.maps.push(map);
        this.version++;
        this.stepsSinceCompress++;
        return true;
      }
    }

    // : () → bool
    // Whether the branch is empty (has no history events).

  }, {
    key: "empty",
    value: function empty() {
      return this.events.length == 0;
    }
  }, {
    key: "addStep",
    value: function addStep(step, map, id) {
      this.addMap(map);
      if (id == null) id = this.nextStepID++;
      this.events[this.events.length - 1].steps.push(new InvertedStep(step, this.version, id));
    }

    // : (Transform, ?[number])
    // Add a transform to the branch's history.

  }, {
    key: "addTransform",
    value: function addTransform(transform, ids) {
      this.abortCompression();
      for (var i = 0; i < transform.steps.length; i++) {
        var inverted = transform.steps[i].invert(transform.docs[i], transform.maps[i]);
        this.addStep(inverted, transform.maps[i], ids && ids[i]);
      }
    }

    // : (Node, bool) → ?{transform: Transform, ids: [number], selection: Selection}
    // Pop the latest event off the branch's history and apply it
    // to a document transform, returning the transform and the step ID.

  }, {
    key: "popEvent",
    value: function popEvent(doc, allowCollapsing) {
      this.abortCompression();
      var event = this.events.pop();
      if (!event) return null;

      var remap = new BranchRemapping(this),
          collapsing = allowCollapsing;
      var tr = new _transform.Transform(doc);
      var ids = [];

      for (var i = event.steps.length - 1; i >= 0; i--) {
        var invertedStep = event.steps[i],
            step = invertedStep.step;
        if (!collapsing || invertedStep.version != remap.version) {
          collapsing = false;
          // Remap the step through any position mappings unrelated to
          // history (e.g. collaborative edits).
          remap.moveToVersion(invertedStep.version);
          step = step.map(remap.remap);

          var result = step && tr.step(step);
          if (result) {
            ids.push(invertedStep.id);
            if (this.addMap(result.map)) this.mirror[this.version] = invertedStep.version;
          }

          remap.movePastStep(result);
        } else {
          this.version--;
          delete this.mirror[this.version];
          this.maps.pop();
          tr.step(step);
          ids.push(invertedStep.id);
          --remap.version;
        }
      }
      var selection = event.selection && event.selection.map(tr.doc, remap.remap);

      if (this.empty()) this.clear(true);
      return { transform: tr, ids: ids, selection: selection };
    }
  }, {
    key: "lastStep",
    value: function lastStep() {
      for (var i = this.events.length - 1; i >= 0; i--) {
        var event = this.events[i];
        if (event.steps.length) return event.steps[event.steps.length - 1];
      }
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      var step = this.lastStep();
      return { lastID: step && step.id, version: this.version };
    }
  }, {
    key: "isAtVersion",
    value: function isAtVersion(version) {
      var step = this.lastStep();
      return this.version == version.version && (step && step.id) == version.lastID;
    }
  }, {
    key: "findVersion",
    value: function findVersion(version) {
      // FIXME this is not accurate when the actual revision has fallen
      // off the end of the history. Current representation of versions
      // does not allow us to recognize that case.
      if (version.lastID == null) return { event: 0, step: 0 };
      for (var i = this.events.length - 1; i >= 0; i--) {
        var event = this.events[i];
        for (var j = event.steps.length - 1; j >= 0; j--) {
          if (event.steps[j].id <= version.lastID) return { event: i, step: j + 1 };
        }
      }
    }
  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      if (this.empty()) return;
      this.abortCompression();

      var startVersion = this.version - positions.length;

      // Update and clean up the events
      out: for (var i = this.events.length - 1; i >= 0; i--) {
        var event = this.events[i];
        for (var j = event.steps.length - 1; j >= 0; j--) {
          var step = event.steps[j];
          if (step.version <= startVersion) break out;
          var off = positions[step.version - startVersion - 1];
          if (off == -1) {
            event.steps.splice(j--, 1);
          } else {
            var inv = rebasedTransform.steps[off].invert(rebasedTransform.docs[off], rebasedTransform.maps[off]);
            event.steps[j] = new InvertedStep(inv, startVersion + newMaps.length + off + 1, step.id);
          }
        }
      }

      // Sync the array of maps
      if (this.maps.length > positions.length) this.maps = this.maps.slice(0, this.maps.length - positions.length).concat(newMaps).concat(rebasedTransform.maps);else this.maps = rebasedTransform.maps.slice();

      this.version = startVersion + newMaps.length + rebasedTransform.maps.length;

      this.stepsSinceCompress += newMaps.length + rebasedTransform.steps.length - positions.length;
    }
  }, {
    key: "abortCompression",
    value: function abortCompression() {
      if (this.compressing) {
        this.compressing.abort();
        this.compressing = null;
      }
    }
  }, {
    key: "needsCompression",
    value: function needsCompression() {
      return this.stepsSinceCompress > compressStepCount && !this.compressing;
    }
  }, {
    key: "startCompression",
    value: function startCompression(doc) {
      var _this2 = this;

      this.compressing = new CompressionWorker(doc, this, function (maps, events) {
        _this2.maps = maps;
        _this2.events = events;
        _this2.mirror = Object.create(null);
        _this2.compressing = null;
        _this2.stepsSinceCompress = 0;
      });
      this.compressing.work();
    }
  }]);

  return Branch;
}();

// Delay between transforms required to compress steps.


var compressDelay = 750;

// ;; An undo/redo history manager for an editor instance.

var History = exports.History = function () {
  function History(pm) {
    var _this3 = this;

    _classCallCheck(this, History);

    this.pm = pm;

    this.done = new Branch(pm.options.historyDepth);
    this.undone = new Branch(pm.options.historyDepth);

    this.lastAddedAt = 0;
    this.ignoreTransform = false;

    this.allowCollapsing = true;

    pm.on("transform", function (transform, selection, options) {
      return _this3.recordTransform(transform, selection, options);
    });
  }

  // : (Transform, Object)
  // Record a transformation in undo history.


  _createClass(History, [{
    key: "recordTransform",
    value: function recordTransform(transform, selection, options) {
      if (this.ignoreTransform) return;

      if (options.addToHistory == false) {
        for (var i = 0; i < transform.maps.length; i++) {
          var map = transform.maps[i];
          this.done.addMap(map);
          this.undone.addMap(map);
        }
      } else {
        this.undone.clear();
        var now = Date.now();
        // Group transforms that occur in quick succession into one event.
        if (now > this.lastAddedAt + this.pm.options.historyEventDelay) this.done.newEvent(selection);

        this.done.addTransform(transform);
        this.lastAddedAt = now;
      }
      this.maybeScheduleCompression();
    }

    // :: () → bool
    // Undo one history event. The return value indicates whether
    // anything was actually undone. Note that in a collaborative
    // context, or when changes are [applied](#ProseMirror.apply)
    // without adding them to the history, it is possible for
    // [`undoDepth`](#History.undoDepth) to have a positive value, but
    // this method to still return `false`, when non-history changes
    // overwrote all remaining changes in the history.

  }, {
    key: "undo",
    value: function undo() {
      return this.shift(this.done, this.undone);
    }

    // :: () → bool
    // Redo one history event. The return value indicates whether
    // anything was actually redone.

  }, {
    key: "redo",
    value: function redo() {
      return this.shift(this.undone, this.done);
    }

    // :: number
    // The amount of undoable events available.

  }, {
    key: "shift",


    // : (Branch, ?Branch) → bool
    // Apply the latest event from one branch to the document and optionally
    // shift the event onto the other branch. Returns true when an event could
    // be shifted.
    value: function shift(from, to) {
      var event = from.popEvent(this.pm.doc, this.allowCollapsing);
      if (!event) return false;
      var transform = event.transform;
      var ids = event.ids;
      var selection = event.selection;

      var selectionBeforeTransform = this.pm.selection;

      this.ignoreTransform = true;
      this.pm.apply(transform, { selection: selection });
      this.ignoreTransform = false;

      if (!transform.steps.length) return this.shift(from, to);

      if (to) {
        // Store the selection before transform on the event so that
        // it can be reapplied if the event is undone or redone (e.g.
        // redoing a character addition should place the cursor after
        // the character).
        to.newEvent(selectionBeforeTransform);
        to.addTransform(transform, ids);
      }
      this.lastAddedAt = 0;

      return true;
    }

    // :: () → Object
    // Get the current ‘version’ of the editor content. This can be used
    // to later [check](#History.isAtVersion) whether anything changed, or
    // to [roll back](#History.backToVersion) to this version.

  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.done.getVersion();
    }

    // :: (Object) → bool
    // Returns `true` when the editor history is in the state that it
    // was when the given [version](#History.getVersion) was recorded.
    // That means either no changes were made, or changes were
    // done/undone and then undone/redone again.

  }, {
    key: "isAtVersion",
    value: function isAtVersion(version) {
      return this.done.isAtVersion(version);
    }

    // :: (Object) → bool
    // Rolls back all changes made since the given
    // [version](#History.getVersion) was recorded. Returns `false` if
    // that version was no longer found in the history, and thus the
    // action could not be completed.

  }, {
    key: "backToVersion",
    value: function backToVersion(version) {
      var found = this.done.findVersion(version);
      if (!found) return false;
      var event = this.done.events[found.event];
      if (found.event == this.done.events.length - 1 && found.step == event.steps.length) return true;
      // Combine all steps past the verion to rollback to into
      // one event, and then "undo" that event.
      var combinedSteps = this.done.events.slice(found.event + 1).reduce(function (comb, arr) {
        return comb.concat(arr.steps);
      }, event.steps.slice(found.step));
      this.done.events.length = found.event + ((event.steps.length = found.step) ? 1 : 0);
      this.done.events.push(new HistoryEvent(combinedSteps, null));

      this.shift(this.done);
      return true;
    }
  }, {
    key: "rebased",
    value: function rebased(newMaps, rebasedTransform, positions) {
      this.done.rebased(newMaps, rebasedTransform, positions);
      this.undone.rebased(newMaps, rebasedTransform, positions);
      this.maybeScheduleCompression();
    }
  }, {
    key: "maybeScheduleCompression",
    value: function maybeScheduleCompression() {
      this.maybeScheduleCompressionForBranch(this.done);
      this.maybeScheduleCompressionForBranch(this.undone);
    }

    // : (Branch)
    // Schedule compression for a branch if it needs compressing.

  }, {
    key: "maybeScheduleCompressionForBranch",
    value: function maybeScheduleCompressionForBranch(branch) {
      var _this4 = this;

      window.clearTimeout(branch.compressTimeout);
      if (branch.needsCompression()) branch.compressTimeout = window.setTimeout(function () {
        if (branch.needsCompression()) branch.startCompression(_this4.pm.doc);
      }, compressDelay);
    }
  }, {
    key: "undoDepth",
    get: function get() {
      return this.done.events.length;
    }

    // :: number
    // The amount of redoable events available.

  }, {
    key: "redoDepth",
    get: function get() {
      return this.undone.events.length;
    }
  }]);

  return History;
}();