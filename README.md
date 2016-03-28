# (IM)POSSIBLE PROMISE
[![Build Status](https://travis-ci.org/iampossible/impossible-promise.svg?branch=master)](https://travis-ci.org/iampossible/impossible-promise)
wrapper used to chain native Promises in an async sequence

## Instal from NPM
_requires node -v >4.3.2 (for Promises support)_

    $ npm install impossible-promise

## Usage:
use `new sequence()` and `.then()` to chain promises
use `.done()` to fetch all results
```js
var sequence = require("impossible-promise")

new sequence((next,reject) => {
    next("giving");
}).then((next,reject) => {
    setTimeout(() => next("is") , 1000);
}).then((next,reject) => {
    next("caring!");
}).done((a,b,c) => {
    console.log([a,b,c].join(" "));
    // => giving is caring!
});
```

## Documentation
__check test.js for examples__

## TODO:
- [ ] propper documentation
- [ ] backwards compatibility
- [ ] browser compatibility
- [ ] support for `Promise.race()`
- [ ] support for `Promise.all()`
- [ ] write a CONTRIBUTING.file

## LICENSE
MIT, see [LICENSE](../blob/master/LICENSE) for details.