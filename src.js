'use strict';
/**
 * description
 *
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


    promisify(fn) {
        let inArgs = Array.prototype.slice.call(arguments);
            inArgs.shift();

        if (typeof fn !== 'function') {
          throw new Error('ImpossiblePromise.promisify(:Function) requires a function(err,...)');
        }

       return this.then((accept,reject) => {
           inArgs.push(function cb(){
               let cbArgs = Array.prototype.slice.call(arguments);
                if (cbArgs.length==0){
                    throw new Error('ImpossiblePromise.promisify(:Function) requires a function(err,...)');
                }
                var err = cbArgs.shift();
                if (!!err) {
                    reject(err)
                }else{
                    accept(cbArgs.length==1 ? cbArgs : [cbArgs]);
                }
           });

           fn.apply(null,inArgs);
       });
    }


    pipe(fn) {
        if (typeof fn !== 'function') {
          throw new Error('ImpossiblePromise.pipe(:Function) requires a function(input,callback)');
        }

       return this.then((accept,reject,value) => {
           if(fn.length==2){//->callback function
            fn.call(null,value,function(result){
               if(result === false) reject();
               accept(result);
            });
           }else{ //->return function
               let result = fn.call(null,value);
               if(result === false) reject();
               accept(result);
           }
       });
    }

    /**
     * description
     *
     */
    done(fn) {
        this.then( done => {
            fn.apply(null, this._data);
            done();
        });

        this._done = true;
        return this;
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

