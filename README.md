# (IM)POSSIBLE PROMISE
wrapper used to chain native Promises in an async sequence

# Instal from NPM

    $ npm install impossible-promise

# Usage:
use `new sequence()` and `.then()` to chain promises
use `.done()` to fetch all results

    var sequence = require("impossible-promise)

    new sequence((next,reject) => {
        next("giving");
    }).then((next,reject) => {
        next("is");
    }).then((next,reject) => {
        next("caring!");
    }).done((a,b,c) => {
        console.log([a,b,c].join(" "));
        //giving is caring!
    });


# Documentation
__todo__: check test.js for examples

# TODO:
- [ ] propper documentation
- [ ] support for `Promise.race()`
- [ ] support for `Promise.all()`
- [ ] write a CONTRIBUTING.file