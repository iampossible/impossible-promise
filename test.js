"use strict";
/*globals describe it*/

const Sequence = require("./src.js");
const assert = require('assert');

describe("new Sequence()", () => {

  describe('constructor', () => {
    it("should accept null as a start sequence", (done) => {
      new Sequence()
        .then((accept, reject, nullValue) => {
          assert.equal(typeof nullValue, "undefined");
          accept("just this one");
        }).done((justThisOnde) => {
          assert.equal(justThisOnde, "just this one");
          done();
        });
    });

    it("should be able to chain other methods", (done) => {

      var someMethod = function(){
        return new Sequence((accept, reject) => {
          setTimeout(function() {
            accept("some")
          },100)
        })
      }

      var otherMethod = function(){
        return new Sequence((accept, reject) => {
          setTimeout(function() {
            accept("other")
          },100)
        })
      }

      new Sequence()
        .then(someMethod())
        .then(otherMethod())
        .done((some, other) => {
          assert.equal([some, other].join(" "), "some other");
          done();
        });

    });
  });

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

        it("should accept impossible-promisses in .then()", (done) => {

            var someMethod = function(){
                return new Sequence((accept, reject) => {
                    setTimeout(function() {
                        accept("some")
                    },100)
                })
            }

            var otherMethod = function(){
                return new Sequence((accept, reject) => {
                    setTimeout(function() {
                        accept("other")
                    },100)
                })
            }


            new Sequence((accept, reject) => {
                accept("first")
            })
            .then(someMethod())
            .then(otherMethod())
            .done((first, some, other ) => {
                assert.equal([first, some, other].join(" "),"first some other");
                done()
            });

        });

        it("should accept impossible-promisses in .then() and deal with .done()", (done) => {

            var someDoneMethod = function(){
                return new Sequence((accept, reject) => {
                    setTimeout(function() {
                        accept("some")
                    },100)
                }).then((accept) => {
                    accept('method')
                }).then((accept) => {
                    accept('called')
                }).done( (some, method, called) => {
                    return [some,method,called].join(" ");
                })
            }

            var otherMethod = function(){
                return new Sequence((accept, reject) => {
                    setTimeout(function() {
                        accept("then")
                    },100)
                }).then((accept, reject, other) => {
                    accept(other + " other");
                })
            }


            new Sequence((accept, reject) => {
                accept("first")
            })
            .then(someDoneMethod())
            .then(otherMethod())
            .done((first, some, other ) => {
                assert.equal([first, some, other].join(" "),"first some method called then other");
                done()
            });

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
                return "something"
            }).then((next,reject,something) => {
                assert.equal("something",something);
                next("world");
            }).done((world,a,b) => {
                assert.equal("world",world);
                done();
            });
        });


        it(".then() after done should carry over .done() return value", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            }).done((hello) => {
                assert.equal("hello",hello);
                return hello+" world";
            }).then((next, reject, helloworld) => {
                assert.equal("hello world",helloworld);
                done();
            });
        });

        it(".done() after done should carry over .done() return value", (done) => {
            new Sequence((next,reject) => {
                next("hello");
            }).done((hello) => {
                assert.equal("hello",hello);
                return hello+" world";
            }).done((helloworld) => {
                assert.equal("hello world",helloworld);
                done();
            }).error(e => console.log(e));
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