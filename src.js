'use strict';
/* globals process, module */
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
    this._stop = false;

    this._ups = function() {
      this._stop = true;
    };

    if (typeof fn === 'undefined' || fn === null){
      process.nextTick(() => {
        this._promise = Promise.resolve();
      });
    } else if (typeof fn === 'function') {
      process.nextTick(() => {
        this._promise = new Promise(fn).catch(this._ups);
        this._stack.push(this._promise);
      });
    } else {
       throw new Error('ImpossiblePromise(:Function) requires a function to start a sequence');
    }
  }



  /**
   * description
   *
   */
  all(fnArray) {

    if(fnArray instanceof Array){
      process.nextTick( () => {
        this._promise = this._promise.then( value => {
          if (this._done === true || typeof value === 'undefined') {
            this._done = false;
          }else{
            this._data.push(value);
          }

          if(this._stop){ //after an .error() should stop all .then calls
            return Promise.reject();
          }

          return Promise.all(fnArray.map(fn => {
            return new Promise((acceptFn, rejectFn) => fn.apply(null, [acceptFn, rejectFn, value])).catch(this._ups);
          })).catch(this._ups);
        });

        this._stack.push(this._promise);
      });
    }else{
       throw new Error('ImpossiblePromise.all(:Array) requires an array)');
    }

    return this;
  }
  /**
   * description
   *
   */
  then(fn) {

    if (fn instanceof ImpossiblePromise){
      //chains another ImpossibePromise
      this.then( accept => {
        fn.then((innerAccept, innerReject, lastValue) => {
          accept(lastValue);
        });
      });
    } else if (typeof fn === 'function') {
      process.nextTick( () => {
        this._promise = this._promise.then( value => {
          if (this._done === true || typeof value === 'undefined') {
            this._done = false;
          }else{
            this._data.push(value);
          }

          if(this._stop){ //after an .error() should stop all .then calls
            return Promise.reject();
          }

          return new Promise((acceptFn, rejectFn) => fn.apply(null, [acceptFn, rejectFn, value])).catch(this._ups);
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
    if (typeof fn === 'undefined') {
      fn = true;
    }
    if (typeof fn !== 'function') {
      let input = fn;
      fn = function() {
        return input;
      };
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
    this._ups = (e) => {
      fn(e);
      this._stop = true;
    };
    return this;
  }
}

module.exports = ImpossiblePromise;

