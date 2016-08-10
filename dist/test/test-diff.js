"use strict";

var _model = require("../model");

var _build = require("./build");

var _tests = require("./tests");

var _cmp = require("./cmp");

var _failure = require("./failure");

function t(name, type, a, b, pos) {
    (0, _tests.defTest)("diff_" + type + "_" + name, function () {
        var result = void 0;
        if (type == "start") {
            result = (0, _model.findDiffStart)(a.content, b.content);
        } else {
            var found = (0, _model.findDiffEnd)(a.content, b.content);
            result = found && found.a;
        }
        if (!pos) {
            if (result) throw new _failure.Failure("Unexpectedly found a difference");
        } else {
            if (!result) throw new _failure.Failure("Unexpectedly found no difference");
            (0, _cmp.cmpStr)(result, pos);
        }
    });
}

function sta(name, a, b, pos) {
    t(name, "start", a, b, pos);
}
function end(name, a, b, pos) {
    t(name, "end", a, b, pos);
}

sta("none", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), null);

sta("at_end_longer", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye")), (0, _build.p)("oops")), (0, _cmp.P)(3));

sta("at_end_shorter", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye")), (0, _build.p)("oops")), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _cmp.P)(3));

sta("diff_styles", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("a", (0, _build.strong)("b"))), (0, _cmp.P)(0, 1));

sta("longer_text", (0, _build.doc)((0, _build.p)("foobar", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("b"))), (0, _cmp.P)(0, 3));

sta("different_text", (0, _build.doc)((0, _build.p)("foobar")), (0, _build.doc)((0, _build.p)("foocar")), (0, _cmp.P)(0, 3));

sta("different_node", (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")), (0, _build.doc)((0, _build.p)("a"), (0, _build.h1)("b")), (0, _cmp.P)(1));

sta("at_start", (0, _build.doc)((0, _build.p)("b")), (0, _build.doc)((0, _build.h1)("b")), (0, _cmp.P)(0));

end("none", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), null);

end("at_start_longer", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("oops"), (0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _cmp.P)(0));

end("at_start_shorter", (0, _build.doc)((0, _build.p)("oops"), (0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b")), (0, _build.p)("hello"), (0, _build.blockquote)((0, _build.h1)("bye"))), (0, _cmp.P)(1));

end("diff_styles", (0, _build.doc)((0, _build.p)("a", (0, _build.em)("b"), "c")), (0, _build.doc)((0, _build.p)("a", (0, _build.strong)("b"), "c")), (0, _cmp.P)(0, 2));

end("longer_text", (0, _build.doc)((0, _build.p)("barfoo", (0, _build.em)("b"))), (0, _build.doc)((0, _build.p)("foo", (0, _build.em)("b"))), (0, _cmp.P)(0, 3));

end("different_text", (0, _build.doc)((0, _build.p)("foobar")), (0, _build.doc)((0, _build.p)("foocar")), (0, _cmp.P)(0, 4));

end("different_node", (0, _build.doc)((0, _build.p)("a"), (0, _build.p)("b")), (0, _build.doc)((0, _build.h1)("a"), (0, _build.p)("b")), (0, _cmp.P)(1));

end("at_end", (0, _build.doc)((0, _build.p)("b")), (0, _build.doc)((0, _build.h1)("b")), (0, _cmp.P)(1));

end("similar_start", (0, _build.doc)((0, _build.p)("hello")), (0, _build.doc)((0, _build.p)("hey"), (0, _build.p)("hello")), (0, _cmp.P)(0));