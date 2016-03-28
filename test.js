"use strict";
/*globals describe it*/

const sequence = require("./src.js");
const assert = require('assert');

describe("new sequence()", () => {
    describe(".then() method", () => {

        it("missing .then() but should execute", (done) => {
            new sequence((next,err) => {
                assert(true);
                done();
            });
        });

        it("single call stack", (done) => {
            new sequence((next,err) => {
                next();
            }).then((next,err) => {
                assert(true);
                done();
            });
        });

        it("multi call stack", (done) => {
            new sequence((next,err) => {
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
            new sequence((next,err) => {
                next("value");
            }).then((next,err,value) => {
                assert.equal(value,"value");
                done();
            });
        });

        it("passing single argument on multi stacks", (done) => {
            new sequence((next,err) => {
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
            var later = new sequence((next,err) => {
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
            new sequence((accept,reject) => {
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
            new sequence((next) => {
                next();
            }).error((reason) => {
                assert.equal(reason,"ups!");
            }).then((next,reject) => {
                reject("ups!");
                done();
            });
        });

        it("only the last .error() should count", (done) => {
            new sequence((next) => {
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
            new sequence((next) => {
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
            new sequence((next,reject) => {
                throw 'ups!';
            }).error((reason) => {
                assert.equal(reason,"ups!");
                done();
            });
        });

    });


    describe(".done() method", () => {

        it("should have an argument for each next() called", (done) => {
            new sequence((next,reject) => {
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
            new sequence((next,reject) => {
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


        it("should start a new sequence if .then() is used after .done()", (done) => {
            new sequence((next,reject) => {
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

});