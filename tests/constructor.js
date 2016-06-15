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

  it('should accept null as a start sequence', done => {
    new Sequence()
      .then((accept, reject, nullValue) => {
        assert.isUndefined(nullValue);
        accept('just this one');
      }).done((justThisOnde) => {
        assert.equal(justThisOnde, 'just this one');
        done();
      });
  });

});