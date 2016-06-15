'use strict';
/*globals require describe it*/

const Sequence = require('../src.js');
const assert = require('chai').assert;

//Helper asserts
assert.runs = () => assert.ok(true, 'should run');
assert.doesNotRun = () =>  assert.ok(false, 'should not run');
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, 'undefined');



describe('.all() method', () => {

  it('should run all promisses', done => {

    new Sequence().all([10,20,30].map( time => {
      return function(accept, reject){
         setTimeout(()=> accept(time), time);
      };
    })).done(allValue => {
      assert.equal(allValue.join(''),'102030');
      done();
    });

  });

  it('should respect the function order on the result', done => {

    new Sequence().all([10,40,30,20,50].map( time => {
      return function(accept, reject){
         setTimeout(()=> accept(time), time);
      };
    })).done(allValue => {
      assert.equal(allValue.join(''),'1040302050');
      done();
    });

  });

  it('should be chainable by .then()', done => {

    new Sequence().all([10,20,30].map( time => {
      return function(accept, reject){
         setTimeout(()=> accept(time), time);
      };
    })).then( (accept,reject, arrValue) => {
      let sum = arrValue.reduce( (a, b) => a+b);
      accept(sum);
    }).done((allValue, allSum) => {
      assert.equal(allValue.join(''),'102030');
      assert.equal(allSum,60);
      done();
    }).error( e => console.log.bind(console));

  });

  it('should carry last value', done => {

    new Sequence((accept)=>{
      accept(1);
    }).all([10,20,30].map( time => {
      return function(accept, reject, one){
         setTimeout(()=> accept(0 + time + one ), time+one);
      };
    })).then( (accept,reject, arrValue) => {
      let sum = arrValue.reduce((a, b) => a+b);
      accept(sum);
    }).done((one, allValue, allSum) => {
      assert.equal(one,1);
      assert.equal(allValue.join(''),'112131');
      assert.equal(allSum,63);
      done();
    });

  });

  it('should interrupt on any error', done => {

    new Sequence().all([10,20,30].map( time => {
      return function(accept, reject, one){
        if(time == 20){
          return reject('ups!');
        }
        setTimeout(()=> accept(time), time);
      };
    })).then( (accept,reject, arrValue) => {
      let sum = arrValue.reduce((a, b) => a+b);
      assert.doesNotRun();
      accept(sum);
    }).done(() => {
     assert.doesNotRun();
    }).error( e => {
      assert.runs();
      assert.equal(e,'ups!');
      done();
    });

  });

});