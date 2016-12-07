////
//// Some unit testing for package bbop-rest-response.
////

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;
var response = require('..').base;
var response_json = require('..').json;

// Correct environment, ready testing.
var bbop = require('bbop-core');

///
/// Start unit testing.
///

describe('base things', function(){

    it('bbop-rest-response', function(){

	var robj1 = 'foo';
	var r1 = new response(robj1);
	
	var robj2 = null;
	var r2 = new response(robj2);
	
	assert.isTrue(r1.okay(), 'looks like okay');
	assert.isFalse(r2.okay(), 'looks like false');
	
	assert.equal(r1.raw(), 'foo', 'looks like a "foo"');
	assert.equal(r2.raw(), null, 'looks like null');
	
    });
});

describe('json subclass', function(){
    
    it('okay json', function(){
	var robj1b = '"foo"';
	var r1b = new response_json(robj1b);
	assert.isTrue(r1b.okay(), 'looks like true (1)');
	//assert.equal(r1.string(), 'foo', 'looks like a "foo" (1)');
	assert.equal(r1b.raw(), 'foo', 'looks like a "foo" (1)');
    });
    
    it('fail json', function(){
	var robj1 = 'foo';
	var r1 = new response_json(robj1);
	assert.isFalse(r1.okay(), 'looks like false (2)');
	//assert.equal(r1.string(), 'foo', 'looks like a "foo" (2)');
	assert.equal(r1.raw(), 'foo', 'looks like a null (2)');
    });
    
    it('Trivially parsed nothing JSON', function(){
	var robj2 = null;
	var r2 = new response_json(robj2);
	assert.isFalse(r2.okay(), 'null not okay (3)');
	//assert.equal(r2.string(), null, 'looks like null (3)');
	assert.equal(r2.raw(), null, 'looks like a null (3)');
    });
    
    it('Bad JSON', function(){
	var robj3 = '{"foo":1, "bar"}';
	var r3 = new response_json(robj3);
	assert.isFalse(r3.okay(), 'looks like false (4)');
	// assert.equal(r3.string(), '{"foo":1, "bar"}',
	// 		  'looks like: {"foo":1, "bar"} 4)');
	assert.equal(r3.raw(), '{"foo":1, "bar"}', 'looks like a null (4)');
    });
    
    it('Good JSON', function(){
	var robj4 = '{"foo":1, "bar": {"bib":"a", "bab":2}}';
	var r4 = new response_json(robj4);
	assert.isTrue(r4.okay(), 'looks like okay (5)');
	// assert.equal(r4.string(), '{"foo":1, "bar": {"bib":"a", "bab":2}}',
	// 	  'looks like: {"foo":1, "bar": {"bib":"a", "bab":2}} (4)');
	assert.deepEqual(r4.raw()['bar'], {"bib":"a", "bab":2},
			 'looks like the same hash (5)');
	
    });
});

