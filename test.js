"use strict";
/*globals describe it*/

const Sequence = require("./src.js");
const assert = require('assert');

describe("new Sequence()", () => {
    describe(".then() method", () => {

        it("missing .then() but should execute", (done) => {
            new Sequence((next,err) => {
                assert(true);
                done();
            });
        });

        it("single call stack", (done) => {
            new Sequence((next,err) => {
                next();
            }).then((next,err) => {
                assert(true);
                done();
            });
        });

        it("multi call stack", (done) => {
            new Sequence((next,err) => {
                next();
            }).then((next,err) => {
                assert(true);
                next();
            }).then((next,err) => {
                assert(true);
                next();
            }).then((next,err) => {
                assert(true);
                done();
            });
        });

        it("passing single argument", (done) => {
            new Sequence((next,err) => {
                next("value");
            }).then((next,err,value) => {
                assert.equal(value,"value");
                done();
            });
        });

        it("passing single argument on multi stacks", (done) => {
            new Sequence((next,err) => {
                next("hello");
            }).then((next,err,value) => {
                assert.equal(value,"hello");
                next("world");
            }).then((next,err,value) => {
                assert.equal(value,"world");
                next("!");
            }).then((next,err,value) => {
                assert.equal(value,"!");
                done();
            });
        });

        it("later .then()", (done) => {
            var later = new Sequence((next,err) => {
                next("aligator");
            });

            setTimeout(function(){
                later.then((next,err,value) => {
                    assert.equal(value,'aligator');
                    done();
                });
            },200);

        });
    });



    describe(".error() method", () => {

        it("shoudl call error on rejected promise", (done) => {
            new Sequence((accept,reject) => {
                reject("ups!");
            }).then((next,err) => {
                //this should not be called
                assert.equal(true,false);
            }).then((next,err) => {
                //neither should this
                assert.equal(true,false);
            }).error((reason) => {
                assert.equal(reason,"ups!");
                done();
            });
        });

        it("using .then() after .error() should continue the sequence", (done) => {
            new Sequence((next) => {
                next();
            }).error((reason) => {
                assert.equal(reason,"ups!");
            }).then((next,reject) => {
                reject("ups!");
                done();
            });
        });

        it("only the last .error() should count", (done) => {
            new Sequence((next) => {
                next();
            }).error((reason) => {
                assert.equal(reason,"not me!");
            }).then((next,reject) => {
                reject("ups!");
            }).error((reason) => {
                assert.equal(reason,"ups!");
            }).then((next,reject) => {
                reject("ups!");
                done();
            });
        });


        it("any rejected promise shoudl interrupt the sequence", (done) => {
            new Sequence((next) => {
                next();
            }).error((reason) => {
                assert.equal(reason,"ups!");
            }).then((next,reject) => {
                reject("ups!");
                next();
                setTimeout(function(){
                    done();
                },100);
            }).then((next,reject) => {
                //this should never ever be called because .error() interrupted the chain
                assert.equal(true,false);
            });
        });

         it("should catch exceptions and call .error()", (done) => {
            new Sequence((next,reject) => {
                throw 'ups!';
            }).error((reason) => {
                assert.equal(reason,"ups!");
                done();
            });
        });

    });


    describe(".done() method", () => {

        it("should have an argument for each next() called", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            }).then((next,reject) => {
                next("world");
            }).then((next,reject) => {
                next("!!");
            }).done((hello, world, yuusss) => {
                assert.equal("hello",hello);
                assert.equal("world",world);
                assert.equal("!!",yuusss);
                done();
            });
        });


        it("should not be done if there is an error", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            }).then((next,reject) => {
                reject("world");
            }).then((next,reject) => {
                next("!!");
            }).done((hello, world, yuusss) => {
                //this should never ever be called because .error() interrupted the chain
                assert.equal(true,false);
            }).error((reason) => {
                assert.equal("world",reason);
                done();
            });
        });


        it("should start a new Sequence if .then() is used after .done()", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            }).done((hello) => {
                assert.equal("hello",hello);
            }).then((next,reject) => {
                next("world");
            }).done((world) => {
                assert.equal("world",world);
                done();
            });
        });

    });


   describe(".promisify() method", () => {

        var fn_NodeCallback = function(a, b, callback){
            setTimeout(()=>{
                callback(false,a+b);
            },100)
        }

        var fn_NodeCallbackError = function(a, b, callback){
            throw "custom error";
        }

        it("should promisify node style callbacks", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            })
            .promisify(fn_NodeCallback, 5, 6)
            .done((hello, result)=>{
                assert.equal("hello",hello);
                assert.equal(result,11);
                done()
            })

        });

        it("should promisify node style error callbacks", (done) => {

            new Sequence((next,reject) => {
                next("hello");
            })
            .promisify(fn_NodeCallbackError, 5, 6)
            .error(e => {
                assert.equal("custom error", e);
                done()
            })
            .done((hello, result)=>{
                //this should not be run
                assert.equal(false,true);
            })

        });

    });


     describe(".pipe() method", () => {

        var fn_pipe = function(value){
            return (value*2);
        }

        var fn_pipeCallback = function(value, callback){
            setTimeout(()=>{
                callback(value*2);
            },100)
        }

        var fn_pipeCallbackFalse = function(value, callback){
            setTimeout(()=>{
                callback(false);
            },100)
        }

        var fn_pipeCallbackError = function(value,callback){
            throw "custom error";
        }

        it("should pipe callbacks", (done) => {
            new Sequence((next,reject) => {
                next(5);
            })
            .pipe(fn_pipeCallback)
            .done((five, result)=>{
                assert.equal(5,five);
                assert.equal(result,10);
                done()
            })
        });

        it("should pipe returns", (done) => {
            new Sequence((next,reject) => {
                next(4);
            })
            .pipe(fn_pipe)
            .done((five, result)=>{
                assert.equal(4,five);
                assert.equal(result,8);
                done()
            })
        });

        it("should catch simple callback error", (done) => {

            new Sequence((next,reject) => {
                next("hello");
            })
            .pipe(fn_pipeCallbackError)
            .error(e => {
                assert.equal("custom error", e);
                done()
            })
            .done((hello, result)=>{
                //this should not be run
                assert.equal(false,true);
            })

        });

        it("should refuse if result===false", (done) => {

            new Sequence((next,reject) => {
                next("hello");
            })
            .pipe(fn_pipeCallbackError)
            .error(e => {
                assert.equal("custom error", e);
                done()
            })
            .done((hello, result)=>{
                //this should not be run
                assert.equal(false,true);
            })

        });

     })

});