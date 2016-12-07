////
//// Some unit testing for package bbop-manager-golr.
//// This time, try the node engine against the beta server.
////

var us = require('underscore');

// Test stuff
var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;

// Correct environment, ready testing.
var bbop = require('bbop-core');
var amigo = require('amigo2');
var golr_manager = require('..');
var golr_conf = require('golr-conf');
var golr_response = require('bbop-response-golr');

// The likely main scripting engine.
var sync_engine = require('bbop-rest-manager').sync_request;
// The likely main browser engine.
var jquery_engine = require('bbop-rest-manager').jquery;
// Everybody else engine.
var node_engine = require('bbop-rest-manager').node;

///
/// Helpers.
///

var each = us.each;
var golr_url = 'http://golr.berkeleybop.org/solr/';

///
/// Start unit testing.
///

describe('bbop-manager-golr: sync engine test', function(){

    var gconf = null;
    var engine_to_use = null;
    before(function(done){
	gconf = new golr_conf.conf(amigo.data.golr);
	engine_to_use = new sync_engine(golr_response);
	done();
    });

    it('sync direct response', function(done){
	
	//engine_to_use.debug(true);
	engine_to_use.method('GET');
	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'sync');
	
	var r = manager.search();
	//console.log('r', r);
	
	assert.isTrue(r.paging_p(), 'paging off defult query: yes');
	assert.isAbove(r.total_documents(), 10, 'got ten docs: yes');
	
	done();
    });

    it('sync registered callback', function(done){

	//engine_to_use.debug(true);
	engine_to_use.method('GET');
	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'sync');
	
	manager.register('search', function(resp, man){
	    
	    assert.isTrue(resp.paging_p(), 'paging off defult query: yes');
	    assert.isAbove(resp.total_documents(), 10, 'got ten docs: yes');

	    done();
	});

	var r = manager.search();
	//console.log('r', r);
    });
});


describe('bbop-manager-golr: node engine test', function(){

    var gconf = null;
    var engine_to_use = null;
    before(function(done){
	gconf = new golr_conf.conf(amigo.data.golr);
	engine_to_use = new node_engine(golr_response);
	done();
    });

    it('node direct promise', function(complete){
	
	// Create an engine (technically a lower-level manager) to
	// make it all run.
	//engine_to_use.debug(true);
	engine_to_use.method('GET');
	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'async');

	// 
	manager.search().then(function(r){
	    
	    //console.log('r', r);
	    
	    assert.isTrue(r.paging_p(), 'paging off defult query: yes');
	    assert.isAbove(r.total_documents(), 10, 'got ten docs: yes');
    	    complete();

    	}).done();
    });
    
    it('node registered callback', function(done){

    	// Create an engine (technically a lower-level manager) to
    	// make it all run.
    	//engine_to_use.debug(true);
    	engine_to_use.method('GET');
    	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'async');
	
    	manager.register('search', function(resp, man){
	    
    	    assert.isTrue(resp.paging_p(), 'paging off defult query: yes');
    	    assert.isAbove(resp.total_documents(), 10, 'got ten docs: yes');

    	    done();
    	});

    	var p = manager.search();
    });

});


describe('bbop-manager-golr: jquery engine test', function(){

    var mock_jQuery = null;
    var engine_to_use = null;
    var gconf = null;
    before(function(done){
        // Modify the manager into functioning--will need this to get
        // tests working for jQuery in this environment.
        var domino = require('domino');
        mock_jQuery = require('jquery')(domino.createWindow());
        var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
        mock_jQuery.support.cors = true;
        mock_jQuery.ajaxSettings.xhr = function() {
	    return new XMLHttpRequest();
        };
	
	// Setup a reusable engine and manager.
	// We need to do some fiddling to get the jQuery manager to
	// operate correctly in this land of node.
	engine_to_use = new jquery_engine(golr_response);
	engine_to_use.JQ = mock_jQuery;
	
	gconf = new golr_conf.conf(amigo.data.golr);

	done();
    });

    it('jQuery direct promise', function(complete){
	
	// Manager init.
    	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'async');
	
	// 
	
	manager.search().then(function(r){

    	    assert.isTrue(r.paging_p(), 'paging off defult query: yes');
    	    assert.isAbove(r.total_documents(), 10, 'got ten docs: yes');

	    complete();
	}).done();

    });

    it('jquery registered callback', function(done){

    	// Create an engine (technically a lower-level manager) to
    	// make it all run.
    	//engine_to_use.debug(true);
    	engine_to_use.method('GET');
    	var manager = new golr_manager(golr_url, gconf, engine_to_use, 'async');
	
    	manager.register('search', function(resp, man){
	    
    	    assert.isTrue(resp.paging_p(), 'paging off defult query: yes');
    	    assert.isAbove(resp.total_documents(), 10, 'got ten docs: yes');

    	    done();
    	});

    	var p = manager.search();
    });

});


describe('bbop-manager-golr: jquery engine test for coordination', function(){

    var mock_jQuery = null;
    var engine_to_use = null;
    var gconf = null;
    before(function(done){
        // Modify the manager into functioning--will need this to get
        // tests working for jQuery in this environment.
        var domino = require('domino');
        mock_jQuery = require('jquery')(domino.createWindow());
        var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
        mock_jQuery.support.cors = true;
        mock_jQuery.ajaxSettings.xhr = function() {
	    return new XMLHttpRequest();
        };
	
	// Setup a reusable engine and manager.
	// We need to do some fiddling to get the jQuery manager to
	// operate correctly in this land of node.
	engine_to_use = new jquery_engine(golr_response);
	engine_to_use.JQ = mock_jQuery;
	
	gconf = new golr_conf.conf(amigo.data.golr);

	done();
    });

    it('jquery registered callback', function(done){
	
    	engine_to_use.method('GET');
    	var m = new golr_manager(golr_url, gconf, engine_to_use, 'async');
	
	//
	assert.isFunction(m.run_promise_functions, 'should have inherited this');

	//
		// Define three promise producing functions.
	function f1(){
    	    return m.search();
	}
	function f2(){
    	    return m.search();
	}
	function f3(){
    	    return m.search();
	}

	var count = 0;
	function acc_fun(resp, man){
	    count++;
	}

	function fin_fun(man){
    	    assert.equal(count, 3, 'got three calls: ' + count);
    	    // assert.equal('bbop-manager-golr.jquery', man._is_a,
	    // 		 'right manager: ' + man._is_a);
    	    done();
	}

	function err_fun(err, man){
	    console.log(err);
	    console.log(man);
	    console.log(man._is_a);
    	    assert.isTrue(false,
			  'should not have hit an error here: '+err.toString());
    	    done();
	}

	// Run.
	m.run_promise_functions([f1, f2, f3], acc_fun, fin_fun, err_fun);

    });
});

