'use strict';
/**
 * (IM)POSSIBLE PROMISE
 * wrapper used to chain native Promises in an async sequence
 */
class ImpossiblePromise {

  /**
   * description
   *
   */
  constructor(fn) {
    this._stack = [];
    this._data  = [];
    this._done = false;
    this._ups = function() { /* noop! */ };

    if (typeof fn !== 'function') {
      throw new Error('ImpossiblePromise(:Function) requires a function to start a sequence');
    }

    process.nextTick(() => {
      this._promise = new Promise(fn).catch(this._ups);
      this._stack.push(this._promise);
    });
  }

  /**
   * description
   *
   */
  then(fn) {
    if(fn instanceof ImpossiblePromise){
      //chains another ImpossibePromise
      this.then((accept,reject) => {
        fn.then((innerAccept, innerReject, lastValue) => {
          accept(lastValue);
        });
      });
    } else if (typeof fn === 'function') {
      process.nextTick( () => {
        this._promise = this._promise.then( value => {
          if (this._done === true || typeof value === "undefined") {
            this._done = false;
          }else{
            this._data.push(value);
          }
          return new Promise((done, err) => fn.apply(null, [done, err, value])).catch(this._ups);
        });

        this._stack.push(this._promise);
      });
    }else{
      throw new Error('ImpossiblePromise.then(:Function) requires a function(accept, reject, value) or other ImpossiblePromise');
    }

    return this;
  }


  promisify(fn) {
    let inArgs = Array.prototype.slice.call(arguments);

    if (typeof fn !== 'function') {
      throw new Error('ImpossiblePromise.promisify(:Function) requires a function(err,...)');
    }

    return this.then((accept, reject) => {
      inArgs.shift();
      inArgs.push(function cb() {
        let cbArgs = Array.prototype.slice.call(arguments);
        let err = cbArgs.shift();

        if (cbArgs.length === 0) {
          throw new Error('ImpossiblePromise.promisify(:Function) requires a function(err,...)');
        }

        if (err) {
          reject(err);
        } else {
          accept(cbArgs);
        }
     });

     fn.apply(null, inArgs);
    });
  }


  pipe(fn) {
    if (typeof fn !== 'function') {
      throw new Error('ImpossiblePromise.pipe(:Function) requires a function(input,callback)');
    }

    return this.then((accept, reject, value) => {
      if (fn.length === 2) {//->callback function
        fn.call(null, value, function(result) {
          if (result === false || result === null) {
            reject();
          } else {
            accept(result);
          }
        });
      } else { //->return function
        let result = fn.call(null, value);
        if (result === false) reject();
        accept(result);
     }
   });
  }

  /**
   * description
   *
   */
  done(fn) {
    if (typeof fn !== 'function') {
      throw new Error('ImpossiblePromise.done(:Function) requires a syncronous function()');
    }

    return this.then((done, err, something) => {
      if (this._data.length === 0) {
        this._data.push(something);
      }
      var result = fn.apply(null, this._data);

      this._data = [];
      this._stack = [];
      this._done = true;
      done(result || null);
    });
  }


  /**
   * description
   *
   */
  error(fn) {
    this._ups = fn;
    return this;
  }
}

module.exports = ImpossiblePromise;

