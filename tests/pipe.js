'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('.pipe() method', () => {

  var fn_pipe = function(value){
    return (value * 2);
  };

  var fn_pipeCallback = function(value, callback){
    setTimeout(() => {
      callback(value * 2);
    }, 100);
  };

  var fn_pipeCallbackError = function(value,callback){
    throw 'custom error';
  };

  it('should pipe callbacks', done => {
    new Sequence( next => {
      next(5);
    })
    .pipe(fn_pipeCallback)
    .done((five, result) => {
      assert.equal(five, 5);
      assert.equal(result,10);
      done();
    });
  });

  it('should pipe returns', done => {
    new Sequence((next,reject) => {
      next(4);
    })
    .pipe(fn_pipe)
    .done((four, result) => {
      assert.equal(four, 4);
      assert.equal(result, 8);
      done();
    });
  });

  it('should catch simple callback error', done => {

    new Sequence((next,reject) => {
      next('hello');
    })
    .pipe(fn_pipeCallbackError)
    .error( e => {
      assert.equal(e, 'custom error');
      done();
    })
    .done(() => {
      //this should not be run
      assert.doesNotRun();
    });
  });

  it('should refuse if result===false', done => {

    new Sequence((next,reject) => {
        next('hello');
    })
    .pipe(fn_pipeCallbackError)
    .error( e => {
      assert.equal(e, 'custom error');
      done();
    })
    .done(() => {
      //this should not be run
      assert.equal(false,true);
    });
  });

});