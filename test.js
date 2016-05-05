"use strict";
/*globals describe it*/

const Sequence = require("./src.js");
const assert = require('assert');

//Helper asserts
assert.runs = () => assert.ok(true, "should run");
assert.doesNotRun = () =>  assert.ok(false, "should not run");
assert.isNull = (value) =>  assert.equal(value, null);
assert.isUndefined = (value) =>  assert.equal(typeof value, "undefined");

describe("new Sequence()", () => {


  describe('constructor', () => {

    it("should accept null as a start sequence", (done) => {
      new Sequence()
        .then((accept, reject, nullValue) => {
          assert.isUndefined(nullValue);
          accept("just this one");
        }).done((justThisOnde) => {
          assert.equal(justThisOnde, "just this one");
          done();
        });
    });

    it("should be able to chain other methods", (done) => {

      var someMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("some");
          }, 100);
        });
      };

      var otherMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("other");
          }, 100);
        });
      };

      new Sequence()
        .then(someMethod())
        .then(otherMethod())
        .done((some, other) => {
          assert.equal([some, other].join(" "), "some other");
          done();
        });

    });

    it("should be able to chain other methods", (done) => {

      var someMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("s");
          }, 100);
        }).then((accept) => {
          setTimeout(function() {
            accept("o");
          }, 100);
        }).then((accept) => {
          setTimeout(function() {
            accept("m");
          }, 100);
        }).then((accept) => {
          setTimeout(function() {
            accept("e");
          }, 100);
        }).done((s,o,m,e) =>{
          return [s,o,m,e].join("");
        });
      };

      var otherMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("other");
          }, 100);
        });
      };

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
      new Sequence(() => {
        assert.runs();
        done();
      });
    });

    it("single call stack", (done) => {
      new Sequence((next,err) => {
        next();
      }).then((next,err) => {
        assert.runs();
        done();
      });
    });

    it("multi call stack", (done) => {
      new Sequence((next) => {
        next();
      }).then((next) => {
        assert.runs();
        next();
      }).then((next) => {
        assert.runs();
        next();
      }).then((next) => {
        assert.runs();
        done();
      });
    });

    it("passing single argument", (done) => {
      new Sequence((next) => {
        next("value");
      }).then((next, err, value) => {
        assert.equal(value, "value");
        done();
      });
    });

    it("passing single argument on multi stacks", (done) => {
      new Sequence((next,err) => {
        next("hello");
      }).then((next,err,value) => {
        assert.equal(value, "hello");
        next("world");
      }).then((next,err,value) => {
        assert.equal(value, "world");
        next("!");
      }).then((next,err,value) => {
        assert.equal(value, "!");
        done();
      });
    });

    it("later .then()", (done) => {
      var later = new Sequence((next,err) => {
        next("aligator");
      });

      setTimeout(function(){
        later.then((next, err, value) => {
          assert.equal(value, 'aligator');
          done();
        });
      }, 200);
    });

    it("should accept impossible-promisses in .then()", (done) => {

      var someMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("some");
          }, 100);
        });
      };

      var otherMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("other");
          }, 100);
        });
      };


      new Sequence((accept) => {
        accept("first");
      })
      .then(someMethod())
      .then(otherMethod())
      .done((first, some, other ) => {
        assert.equal([first, some, other].join(" "), "first some other");
        done();
      });

    });

    it("should accept impossible-promisses in .then() and deal with .done()", (done) => {

      var someDoneMethod = function(){
        return new Sequence((accept) => {
          setTimeout(function() {
            accept("some");
          },100);
        }).then((accept) => {
          accept('method');
        }).then((accept) => {
          accept('called');
        }).done( (some, method, called) => {
          return [some,method,called].join(" ");
        });
      };

      var otherMethod = function(){
        return new Sequence((accept) => {
            setTimeout(function() {
              accept("then");
            }, 100);
        }).then((accept, reject, other) => {
            accept(other + " other");
        });
      };


      new Sequence((accept) => {
        accept("first");
      })
      .then(someDoneMethod())
      .then(otherMethod())
      .done((first, some, other ) => {
        assert.equal([first, some, other].join(" "), "first some method called then other");
        done();
      });

    });
  });



  describe(".error() method", () => {

    it("shoudl call error on rejected promise", (done) => {
      new Sequence((accept,reject) => {
        reject("ups!");
      }).then(() => {
        //this should not be called
        assert.doesNotRun();
      }).then(() => {
        //neither should this
        assert.doesNotRun();
      }).error((reason) => {
        assert.runs();
        assert.equal(reason, "ups!");
        done();
      });
    });

    it("using .then() after .error() should continue the sequence", (done) => {
      new Sequence((next) => {
        next();
      }).error((reason) => {
        assert.runs();
        assert.equal(reason, "ups!");
      }).then((next, reject) => {
        assert.runs();
        reject("ups!");
        done();
      });
    });

    it("only the last .error() should count", (done) => {
      new Sequence((next) => {
        next();
      }).error((reason) => {
        assert.doesNotRun();
        assert.equal(reason, "not me!");
      }).then((next, reject) => {
        reject("ups!");
      }).error((reason) => {
        assert.runs();
        assert.equal(reason, "ups!");
      }).then((next, reject) => {
        reject("ups!");
        done();
      });
    });


    it("any rejected promise shoudl interrupt the sequence", (done) => {
      new Sequence((next) => {
        next();
      }).error((reason) => {
        assert.equal(reason, "ups!");
      }).then((next, reject) => {
        reject("ups!");
        next();
        setTimeout(function(){
          done();
        }, 100);
      }).then((next, reject) => {
        //this should never ever be called because .error() interrupted the chain
        assert.doesNotRun();
      });
    });

    it("should catch exceptions and call .error()", (done) => {
        new Sequence((next,reject) => {
          throw 'ups!';
        }).error((reason) => {
          assert.equal(reason, "ups!");
          done();
        });
    });

  });


  describe(".done() method", () => {

    it("should have an argument for each next() called", (done) => {
      new Sequence((next) => {
        next("hello");
      }).then((next) => {
        next("world");
      }).then((next) => {
        next("!!");
      }).done((hello, world, yuusss) => {
        assert.equal(hello, "hello");
        assert.equal(world, "world");
        assert.equal(yuusss, "!!");
        done();
      });
    });

    it("should not be done if there is an error", (done) => {
        new Sequence((next) => {
          next("hello");
        }).then((next,reject) => {
          reject("world");
        }).then((next) => {
          next("!!");
        }).done((hello, world, yuusss) => {
          //this should never ever be called because .error() interrupted the chain
          assert.doesNotRun();
        }).error((reason) => {
          assert.equal(reason, "world");
          done();
        });
    });


    it("should start a new Sequence if .then() is used after .done()", (done) => {
      new Sequence((next) => {
        next("hello");
      }).done((hello) => {
        assert.equal(hello, "hello");
        return "something";
      }).then((next, reject, something) => {
        assert.equal(something, "something");
        next("world");
      }).done((world, a, b) => {
        assert.equal(world, "world");
        assert.isUndefined(a);
        assert.isUndefined(b);
        done();
      });
    });


    it(".then() after done should carry over .done() return value", (done) => {
      new Sequence((next,reject) => {
        next("hello");
      }).done((hello) => {
        assert.equal(hello, "hello");
        return hello+" world";
      }).then((next, reject, helloworld) => {
        assert.equal(helloworld, "hello world");
        done();
      });
    });

    it(".done() after done should carry over .done() return value", (done) => {
      new Sequence((next) => {
        next("hello");
      }).done((hello) => {
        assert.equal(hello, "hello");
        return hello+" world";
      }).done((helloworld) => {
        assert.equal(helloworld, "hello world");
        done();
      });
    });


    it("empty .done() should be just true", (done) => {

      let someMethod = new Sequence((next) => next("hello") ).done();

      new Sequence()
      .then(someMethod)
      .then((accept, reject, justTrue) => {
        assert.equal(justTrue, true);
        accept("value");
      })
      .done((justTrue, otherValue) => {
        assert.equal(justTrue, true);
        assert.equal(otherValue, 'value');
        done();
      });
    });


    it(".done(value) should return value", (done) => {

      let someMethod = new Sequence((next) => next() ).done('hello world');

      new Sequence()
      .then(someMethod)
      .then((accept, reject, helloworld) => {
        assert.equal(helloworld, 'hello world');
        accept("value");
      })
      .done((helloworld, otherValue) => {
        assert.equal(helloworld, 'hello world');
        assert.equal(otherValue, 'value');
        done();
      });
    });

  });


  describe(".promisify() method", () => {

    var fn_NodeCallback = function(a, b, callback){
      setTimeout(()=>{
        callback(false, a + b);
      }, 100);
    };

    var fn_NodeCallbackError = function(a, b, callback){
      throw "custom error";
    };

    it("should promisify node style callbacks", (done) => {
        new Sequence((next) => {
          next("hello");
        })
        .promisify(fn_NodeCallback, 5, 6)
        .done((hello, result) => {
          assert.equal(hello, "hello");
          assert.equal(result, 11);
          done();
        });
    });

    it("should promisify node style error callbacks", (done) => {

      new Sequence()
      .promisify(fn_NodeCallbackError, 5, 6)
      .error(e => {
          assert.equal(e, "custom error");
          done();
      })
      .done((result)=>{
          //this should not be run
          assert.doesNotRun();
      });

    });

  });


   describe(".pipe() method", () => {

    var fn_pipe = function(value){
      return (value*2);
    };

    var fn_pipeCallback = function(value, callback){
      setTimeout(()=>{
        callback(value*2);
      }, 100);
    };

    var fn_pipeCallbackError = function(value,callback){
      throw "custom error";
    };

    it("should pipe callbacks", (done) => {
      new Sequence((next) => {
        next(5);
      })
      .pipe(fn_pipeCallback)
      .done((five, result) => {
        assert.equal(five, 5);
        assert.equal(result,10);
        done();
      });
    });

    it("should pipe returns", (done) => {
      new Sequence((next,reject) => {
        next(4);
      })
      .pipe(fn_pipe)
      .done((four, result) => {
        assert.equal(four, 4);
        assert.equal(result, 8);
        done();
      });
    });

    it("should catch simple callback error", (done) => {

      new Sequence((next,reject) => {
        next("hello");
      })
      .pipe(fn_pipeCallbackError)
      .error(e => {
        assert.equal(e, "custom error");
        done();
      })
      .done((hello, result)=>{
        //this should not be run
        assert.doesNotRun();
      });
    });

    it("should refuse if result===false", (done) => {

      new Sequence((next,reject) => {
          next("hello");
      })
      .pipe(fn_pipeCallbackError)
      .error(e => {
        assert.equal(e, "custom error");
        done();
      })
      .done((hello, result)=>{
        //this should not be run
        assert.equal(false,true);
      });
    });

   });
});