'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('.done() method', () => {

  it('should have an argument for each next() called', done => {
    new Sequence( next => {
      next('hello');
    }).then( next => {
      next('world');
    }).then( next => {
      next('!!');
    }).done((hello, world, yuusss) => {
      assert.equal(hello, 'hello');
      assert.equal(world, 'world');
      assert.equal(yuusss, '!!');
      done();
    });
  });

  it('should have an argument for each done() called inside each then()', done => {

    function methodThatGetsWorld(){
      return new Sequence((accept, reject) =>{
        accept("wor");
      })
      .then((accept, reject) =>{
        accept("ld");
      })
      .done((wor,ld) =>{
        return [wor,ld].join("");
      });
    }

    new Sequence( next => {
      next('hello');
    })
    .then(methodThatGetsWorld())
    .then( next => {
      next('!!');
    }).done((hello, world, yuusss) => {
      assert.equal(hello, 'hello');
      assert.equal(world, 'world');
      assert.equal(yuusss, '!!');
      done();
    });
  });

  it('should not be done if there is an error', done => {
      new Sequence( next => {
        next('hello');
      }).then((next,reject) => {
        reject('world');
      }).then( next => {
        next('!!');
      }).done(() => {
        //this should never ever be called because .error() interrupted the chain
        assert.doesNotRun();
      }).error((reason) => {
        assert.equal(reason, 'world');
        done();
      });
  });


  it('should start a new Sequence if .then() is used after .done()', done => {
    new Sequence( next => {
      next('hello');
    }).done( hello => {
      assert.equal(hello, 'hello');
      return 'something';
    }).then((next, reject, something) => {
      assert.equal(something, 'something');
      next('world');
    }).done((world, a, b) => {
      assert.equal(world, 'world');
      assert.isUndefined(a);
      assert.isUndefined(b);
      done();
    });
  });


  it('.then() after done should carry over .done() return value', done => {
    new Sequence((next,reject) => {
      next('hello');
    }).done( hello => {
      assert.equal(hello, 'hello');
      return hello + ' world';
    }).then((next, reject, helloworld) => {
      assert.equal(helloworld, 'hello world');
      done();
    });
  });

  it('.done() after done should carry over .done() return value', done => {
    new Sequence( next => {
      next('hello');
    }).done( hello => {
      assert.equal(hello, 'hello');
      return hello + ' world';
    }).done((helloworld) => {
      assert.equal(helloworld, 'hello world');
      done();
    });
  });


  it('empty .done() should be just true', done => {

    let someMethod = new Sequence( next => next('hello') ).done();

    new Sequence()
    .then(someMethod)
    .then((accept, reject, justTrue) => {
      assert.equal(justTrue, true);
      accept('value');
    })
    .done((justTrue, otherValue) => {
      assert.equal(justTrue, true);
      assert.equal(otherValue, 'value');
      done();
    });
  });


  it('.done(value) should return value', done => {

    let someMethod = new Sequence( next => next() ).done('hello world');

    new Sequence()
    .then(someMethod)
    .then((accept, reject, helloworld) => {
      assert.equal(helloworld, 'hello world');
      accept('value');
    })
    .done((helloworld, otherValue) => {
      assert.equal(helloworld, 'hello world');
      assert.equal(otherValue, 'value');
      done();
    });
  });

});