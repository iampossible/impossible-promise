'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('.then() method', () => {

  it('missing .then() but should execute', done => {
    new Sequence(() => {
      assert.runs();
      done();
    });
  });

  it('single call stack', done => {
    new Sequence( next => {
      next();
    }).then( next => {
      assert.runs();
      done();
    });
  });

  it('multi call stack', done => {
    new Sequence( next => {
      next();
    }).then( next => {
      assert.runs();
      next();
    }).then( next => {
      assert.runs();
      next();
    }).then( next => {
      assert.runs();
      done();
    });
  });

  it('passing single argument', done => {
    new Sequence( next => {
      next('value');
    }).then((next, err, value) => {
      assert.equal(value, 'value');
      done();
    });
  });

  it('passing single argument on multi stacks', done => {
    new Sequence( next => {
      next('hello');
    }).then((next,err,value) => {
      assert.equal(value, 'hello');
      next('world');
    }).then((next,err,value) => {
      assert.equal(value, 'world');
      next('!');
    }).then((next,err,value) => {
      assert.equal(value, '!');
      done();
    });
  });

  it('later .then()', done => {
    var later = new Sequence( next => {
      next('aligator');
    });

    setTimeout(function(){
      later.then((next, err, value) => {
        assert.equal(value, 'aligator');
        done();
      });
    }, 200);
  });

  it('should accept impossible-promisses in .then()', done => {

    var someMethod = function(){
      return new Sequence((accept) => {
        setTimeout(function() {
          accept('some');
        }, 100);
      });
    };

    var otherMethod = function(){
      return new Sequence((accept) => {
        setTimeout(function() {
          accept('other');
        }, 100);
      });
    };


    new Sequence((accept) => {
      accept('first');
    })
    .then(someMethod())
    .then(otherMethod())
    .done((first, some, other ) => {
      assert.equal([first, some, other].join(' '), 'first some other');
      done();
    });

  });

  it('should accept impossible-promisses in .then() and deal with .done()', done => {

    var someDoneMethod = function(){
      return new Sequence((accept) => {
        setTimeout(function() {
          accept('some');
        },100);
      }).then((accept) => {
        accept('method');
      }).then((accept) => {
        accept('called');
      }).done( (some, method, called) => {
        return [some,method,called].join(' ');
      });
    };

    var otherMethod = function(){
      return new Sequence((accept) => {
          setTimeout(function() {
            accept('then');
          }, 100);
      }).then((accept, reject, other) => {
          accept(other + ' other');
      });
    };


    new Sequence((accept) => {
      accept('first');
    })
    .then(someDoneMethod())
    .then(otherMethod())
    .done((first, some, other ) => {
      assert.equal([first, some, other].join(' '), 'first some method called then other');
      done();
    });

  });
});