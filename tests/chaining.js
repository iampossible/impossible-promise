'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');


describe('constructor', () => {

  it('should be able to chain other methods', done => {

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

    new Sequence()
      .then(someMethod())
      .then(otherMethod())
      .done((some, other) => {
        assert.equal([some, other].join(' '), 'some other');
        done();
      });

  });

  it('should be able to chain other methods', done => {

    var someMethod = function(){
      return new Sequence((accept) => {
        setTimeout(function() {
          accept('s');
        }, 100);
      }).then((accept) => {
        setTimeout(function() {
          accept('o');
        }, 100);
      }).then((accept) => {
        setTimeout(function() {
          accept('m');
        }, 100);
      }).then((accept) => {
        setTimeout(function() {
          accept('e');
        }, 100);
      }).done((s,o,m,e) => {
        return [s,o,m,e].join('');
      });
    };

    var otherMethod = function(){
      return new Sequence((accept) => {
        setTimeout(function() {
          accept('other');
        }, 100);
      });
    };

    new Sequence()
      .then(someMethod())
      .then(otherMethod())
      .done((some, other) => {
        assert.equal([some, other].join(' '), 'some other');
        done();
      });

  });

});