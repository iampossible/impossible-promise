'use strict';

class ImpossiblePromise {

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

    then(fn) {
        if (this._done === true) {
            return new ImpossiblePromise(fn);
        }

        process.nextTick( () => {
            this._promise = this._promise.then( value => {
                this._data.push(value);
                return new Promise((done, err) => fn.apply(null, [done, err, value])).catch(this._ups);
            });
            this._stack.push(this._promise);
        });
        return this;
    }

    done(fn) {
        this.then( done => {
            fn.apply(null, this._data);
            done();
        });

        this._done = true;
        return this;
    }

    error(fn) {
        this._ups = fn;
        return this;
    }
}

module.exports = ImpossiblePromise;

