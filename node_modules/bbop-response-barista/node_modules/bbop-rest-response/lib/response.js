/**
 * This module contains two response handlers.
 *
 * First, a generic BBOP handler for dealing with the gross parsing of
 * responses from a REST server. This is just an example pass-thru
 * handler that needs to be overridden (see subclasses).
 * 
 * Second, a generic BBOP handler for dealing with the gross parsing
 * of responses from a REST JSON server. It will detect if the
 * incoming response is a string, and if so, try to parse it to
 * JSON. Otherwise, if the raw return is already an Object, we assume
 * that somebody got to it before us (e.g. jQuery's handling).
 *
 * A little more discussion of the base class.
 *
 * You may note that things like status and status codes are not part
 * of the base response. The reason is is that not all methods of REST
 * in the environments that we use support them. For example: readURL
 * in rhino. For this reason, the "health" of the response is left to
 * the simple okay() function--just enought to be able to choose
 * between "success" and "failure" in the managers. To give a bit more
 * information in case of early error, there is message and
 * message_type.
 * 
 * Similarly, there are no toeholds in the returned data except
 * raw(). All data views and operations are implemented in the
 * subclasses.
 *
 * This module includes the following objects:
 *  - base: essentially uninteresting base class
 *  - json: json parsing attmpted
 *
 * @module bbop-rest-response
 */

var bbop = require('bbop-core');
var us = require('underscore');

/**
 * Contructor for a REST query response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * @constructor
 * @param {String} in_data - the string returned from a request
 * @returns {Object} rest response object
 */
var response = function(in_data){
    this._is_a = 'bbop-rest-response';

    // The raw incoming document.
    this._raw = in_data;

    // Cache for repeated calls to okay().
    this._okay = null;
    this._message = null;
    this._message_type = null;
};

/**
 * Returns the initial response object, whatever it was.
 * 
 * @returns {Object} object
 */
response.prototype.raw = function(){
    return this._raw;
};

/**
 * Simple return verification of sane response from server.
 * 
 * This okay() caches its return value, so harder probes don't need to
 * be performed more than once.
 * 
 * @param {Boolean} [okay_p] - setter for okay
 * @returns {Boolean}
 */
response.prototype.okay = function(okay_p){

    // Optionally set from the outside.
    if( bbop.is_defined(okay_p) ){
	this._okay = okay_p;
    }

    //print('a: ' + this._okay);
    if( this._okay == null ){ // only go if answer not cached
	//print('b: ' + this._raw);
	if( ! this._raw || this._raw === '' ){
	    //print('c: if');
	    this._okay = false;
	}else{
	    //print('c: else');
	    this._okay = true;
	}
    }
    
    return this._okay;
};

/**
 * A message that the response wants to let you know about its
 * creation.
 * 
 * @param {String} [message] - setter for message
 * @returns {String} message string
 */
response.prototype.message = function(message){
    if( bbop.is_defined(message) ){
	this._message = message;
    }
    return this._message;
};

/**
 * A message about the message (a string classifier) that the response
 * wants to let you know about its message.
 * 
 * @param {String} [message_type] - setter for message_type
 * @returns {String} message type string
 */
response.prototype.message_type = function(message_type){
    if( bbop.is_defined(message_type) ){
	this._message_type = message_type;
    }
    return this._message_type;
};

///
///
///

/**
 * Contructor for a REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * @constructor
 * @param {Object|String} json_data - the JSON object as a string (as returned from a request)
 * @returns {response_json} rest response object
 */
var response_json = function(json_data){
    response.call(this);
    this._is_a = 'bbop-rest-response-json';

    // The raw incoming document.
    //this._raw_string = json_data_str;
    this._raw_string = null;
    this._okay = null;

    if( json_data ){

	if( bbop.what_is(json_data) === 'string' ){

	    // Try and parse out strings.
	    try {
		this._raw = JSON.parse(json_data);
		this._okay = true;
	    }catch(e){
		// Didn't make it, but still a string.
		this._raw = json_data;
		this._okay = false;
	    }

	}else if( bbop.what_is(json_data) === 'object' ||
		  bbop.what_is(json_data) === 'array' ){

	    // Looks like somebody else got here first.
	    this._raw = json_data;
	    this._okay = true;
	    
	}else{

	    // No idea what this thing is...
	    this._raw = null;
	    this._okay = null;
	}
    }
};
bbop.extend(response_json, response);

///
/// Exportable body.
///

module.exports = {

    'base': response,
    'json': response_json

};
