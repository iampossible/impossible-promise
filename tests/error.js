'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('.error() method', () => {

  it('shoudl call error on rejected promise', done => {
    new Sequence((accept,reject) => {
      reject('ups!');
    }).then(() => {
      //this should not be called
      assert.doesNotRun();
    }).then(() => {
      //neither should this
      assert.doesNotRun();
    }).error((reason) => {
      assert.runs();
      assert.equal(reason, 'ups!');
      done();
    });
  });

  it('using .then() after .error() should continue the sequence', done => {
    new Sequence( next => {
      next();
    }).error((reason) => {
      assert.runs();
      assert.equal(reason, 'ups!');
    }).then((next, reject) => {
      assert.runs();
      reject('ups!');
      done();
    });
  });

  it('only the last .error() should count', done => {
    new Sequence( next => {
      next();
    }).error(() => {
      assert.doesNotRun();
    }).then((next, reject) => {
      reject('ups!');
    }).error((reason) => {
      assert.runs();
      assert.equal(reason, 'ups!');
      done();
    }).then((next, reject) => {
      assert.doesNotRun();
      reject('ups!');
    });
  });


  it('any rejected nested promise should interrupt the sequence', (done) => {
    let timesErrorHandlerCalled = 0;
    let reachesSecondThen = false;
    let reachesDone = false;
    let errorReason;

    new Sequence()
      .then((next, reject, data) => {
        reject('i made a boo-boo');
        next('dont!');
      })
      .then((resolve, reject, data) => {
        console.warn('if you see this, something is terribly wrong', data);
        reachesSecondThen = true;
        resolve('nope!');
      })
      .error((reason) => {
        timesErrorHandlerCalled++;
        errorReason = reason;
      })
      .done(() => {
        reachesDone = true;
      });

    setTimeout(() => {
      assert.equal(timesErrorHandlerCalled, 1);
      assert.isFalse(reachesSecondThen);
      assert.isFalse(reachesDone);
      assert.equal(errorReason, 'i made a boo-boo');
      done();
    }, 2);
  });

  it('any rejected nested promise should interrupt the sequence', (done) => {
    let timesErrorHandlerCalled = 0;
    let reachesSecondThen = false;
    let errorReason;

    new Sequence()
      .then((next, reject, data) => {
        new Sequence(() => {
          throw 'ups!';
        }).then((innerNext) => {
          innerNext(1);
        }).error(reject).done(next);
      })
      .then((resolve, reject, data) => {
        console.warn('if you see this, something is terribly wrong', data);
        reachesSecondThen = true;
      })
      .error((reason) => {
        timesErrorHandlerCalled++;
        errorReason = reason;
      });

    setTimeout(() => {
      assert.equal(timesErrorHandlerCalled, 1);
      assert.isFalse(reachesSecondThen);
      assert.equal(errorReason, 'ups!');
      done();
    }, 2);
  });

  it('should catch exceptions and call .error()', done => {
      new Sequence((next,reject) => {
        throw 'ups!';
      }).error((reason) => {
        assert.equal(reason, 'ups!');
        done();
      });
  });

});