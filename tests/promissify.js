'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('.promisify() method', () => {

  var fn_NodeCallback = function(a, b, callback){
    setTimeout(() => {
      callback(false, a + b);
    }, 100);
  };

  var fn_NodeCallbackError = function(a, b, callback){
    throw 'custom error';
  };

  it('should promisify node style callbacks', done => {
      new Sequence( next => {
        next('hello');
      })
      .promisify(fn_NodeCallback, 5, 6)
      .done((hello, result) => {
        assert.equal(hello, 'hello');
        assert.equal(result, 11);
        done();
      });
  });

  it('should promisify node style error callbacks', done => {

    new Sequence()
    .promisify(fn_NodeCallbackError, 5, 6)
    .error( e => {
        assert.equal(e, 'custom error');
        done();
    })
    .done(() => {
        //this should not be run
        assert.doesNotRun();
    });

  });

});