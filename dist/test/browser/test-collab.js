"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require("../../collab");

var _build = require("../build");

var _tests = require("../tests");

var _cmp = require("../cmp");

var _def = require("./def");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DummyServer = function () {
  function DummyServer() {
    _classCallCheck(this, DummyServer);

    this.version = 0;
    this.pms = [];
  }

  _createClass(DummyServer, [{
    key: "attach",
    value: function attach(pm) {
      var _this = this;

      pm.mod.collab.on("mustSend", function () {
        return _this.mustSend(pm);
      });
      this.pms.push(pm);
    }
  }, {
    key: "mustSend",
    value: function mustSend(pm) {
      if (pm.mod.collab.frozen) return;
      var toSend = pm.mod.collab.sendableSteps();
      this.send(pm, toSend.version, toSend.steps);
      pm.mod.collab.confirmSteps(toSend);
    }
  }, {
    key: "send",
    value: function send(pm, _version, steps) {
      this.version += steps.length;
      for (var i = 0; i < this.pms.length; i++) {
        if (this.pms[i] != pm) this.pms[i].mod.collab.receive(steps);
      }
    }
  }]);

  return DummyServer;
}();

// Kludge to prevent an editor from sending its changes for a moment


function delay(pm, f) {
  pm.mod.collab.frozen = true;
  f();
  pm.mod.collab.frozen = false;
  if (pm.mod.collab.hasSendableSteps()) pm.mod.collab.signal("mustSend");
}

function test(name, f, options, n) {
  (0, _tests.defTest)("collab_" + name, function () {
    var server = new DummyServer();
    var optArray = [];
    for (var i = 0; i < (n || 2); i++) {
      var copy = { collab: { version: server.version } };
      for (var prop in options) {
        copy[prop] = options[prop];
      }optArray.push(copy);
    }
    var pms = (0, _def.tempEditors)(optArray);
    pms.forEach(function (pm) {
      return server.attach(pm);
    });
    f.apply(null, pms);
  });
}

function type(pm, text, pos) {
  pm.tr.insertText(pos || pm.selection.head, text).apply();
}

function cut(pm) {
  pm.history.lastAddedAt = 0;
}

function conv() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  var d = args.pop();
  if (typeof d == "string") d = (0, _build.doc)((0, _build.p)(d));
  args.forEach(function (pm) {
    return (0, _cmp.cmpNode)(pm.doc, d);
  });
}

test("converge_easy", function (pm1, pm2) {
  type(pm1, "hi");
  type(pm2, "ok", (0, _cmp.P)(0, 2));
  type(pm1, "!", (0, _cmp.P)(0, 4));
  type(pm2, "...", (0, _cmp.P)(0, 0));
  conv(pm1, pm2, "...hiok!");
});

test("converge_rebased", function (pm1, pm2) {
  type(pm1, "hi");
  delay(pm1, function () {
    type(pm1, "A");
    type(pm2, "X");
    type(pm1, "B");
    type(pm2, "Y");
  });
  conv(pm1, pm2, "hiXYAB");
});

test("converge_three", function (pm1, pm2, pm3) {
  type(pm1, "A");
  type(pm2, "U");
  type(pm3, "X");
  type(pm1, "B");
  type(pm2, "V");
  type(pm3, "C");
  conv(pm1, pm2, pm3, "AUXBVC");
}, null, 3);

test("converge_three_rebased", function (pm1, pm2, pm3) {
  type(pm1, "A");
  delay(pm2, function () {
    type(pm2, "U");
    type(pm3, "X");
    type(pm1, "B");
    type(pm2, "V");
    type(pm3, "C");
  });
  conv(pm1, pm2, pm3, "AXBCUV");
}, null, 3);

test("undo", function (pm1, pm2) {
  type(pm1, "A");
  type(pm2, "B");
  type(pm1, "C");
  pm2.execCommand("undo");
  type(pm2, "D");
  type(pm1, "E");
  conv(pm1, pm2, "ADCE");
});

test("redo", function (pm1, pm2) {
  type(pm1, "A");
  type(pm2, "B");
  type(pm1, "C");
  pm2.execCommand("undo");
  pm2.execCommand("redo");
  type(pm2, "D");
  type(pm1, "E");
  conv(pm1, pm2, "ABCDE");
});

test("undo_deep", function (pm1, pm2) {
  pm1.setTextSelection((0, _cmp.P)(0, 5));
  pm2.setTextSelection((0, _cmp.P)(1, 3));
  type(pm1, "!");
  type(pm2, "!");
  cut(pm1);
  delay(pm1, function () {
    type(pm1, " ...");
    type(pm2, " ,,,");
  });
  cut(pm1);
  type(pm1, "*");
  type(pm2, "*");
  pm1.execCommand("undo");
  conv(pm1, pm2, (0, _build.doc)((0, _build.p)("hello! ..."), (0, _build.p)("bye! ,,,*")));
  pm1.execCommand("undo");
  pm1.execCommand("undo");
  conv(pm1, pm2, (0, _build.doc)((0, _build.p)("hello"), (0, _build.p)("bye! ,,,*")));
  pm1.execCommand("redo");
  pm1.execCommand("redo");
  pm1.execCommand("redo");
  conv(pm1, pm2, (0, _build.doc)((0, _build.p)("hello! ...*"), (0, _build.p)("bye! ,,,*")));
  pm1.execCommand("undo");
  pm1.execCommand("undo");
  conv(pm1, pm2, (0, _build.doc)((0, _build.p)("hello!"), (0, _build.p)("bye! ,,,*")));
  pm2.execCommand("undo");
  conv(pm1, pm2, (0, _build.doc)((0, _build.p)("hello!"), (0, _build.p)("bye")));
}, { doc: (0, _build.doc)((0, _build.p)("hello"), (0, _build.p)("bye")) });

test("undo_deleted_event", function (pm1, pm2) {
  type(pm1, "A", (0, _cmp.P)(0, 5));
  delay(pm1, function () {
    type(pm1, "B", (0, _cmp.P)(0, 3));
    type(pm1, "C", (0, _cmp.P)(0, 4));
    type(pm1, "D", (0, _cmp.P)(0, 0));
    pm2.apply(pm2.tr.delete((0, _cmp.P)(0, 1), (0, _cmp.P)(0, 4)));
  });
  conv(pm1, pm2, "DhoA");
  pm1.execCommand("undo");
  conv(pm1, pm2, "ho");
}, { doc: (0, _build.doc)((0, _build.p)("hello")) });

/* This is related to the TP_2 condition often referenced in OT
   literature -- if you insert at two points but then pull out the
   content between those points, are the inserts still ordered
   properly. Our algorithm does not guarantee this.

test("tp_2", (pm1, pm2, pm3) => {
  delay(pm1, () => {
    delay(pm3, () => {
      type(pm1, "x", P(0, 1))
      type(pm3, "y", P(0, 2))
      pm2.apply(pm2.tr.delete(P(0, 1), P(0, 2)))
    })
  })
  conv(pm1, pm2, pm3, doc(p("axyc")))
}, {doc: doc(p("abc"))}, 3)
*/