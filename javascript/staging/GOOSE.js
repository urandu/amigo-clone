(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
////
//// For now, a simple hook into GOOSE once live. Just three lines, so
//// will probably leave DEBUG in.
////

var bbop = require('bbop-core');

//
function GOOSEInit(){

    // Per-manager logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    //ll('');
    ll('GOOSEInit start...');

    // LEAD: Enter things from pulldown into textarea on change.
    jQuery("#" + "goose_lead_example_selection").change(
	function(){
	    var sql = jQuery(this).val();
	    jQuery("#" + "query").val(sql);
	});

    // TODO: scan and add things to the page.
    // Check to see if a results-only id shows up.
    var results_ping = jQuery("#" + "results_generated");
    if( results_ping && results_ping.attr('id') ){
	ll('Looks like a results page.');
    }else{
	ll('Looks like a starting page.');
    }

    ll('GOOSEInit done.');
}

// Embed the jQuery setup runner.
(function (){
    jQuery(document).ready(function(){ GOOSEInit(); });
})();

},{"bbop-core":2}],2:[function(require,module,exports){
/**
 * BBOP language extensions to JavaScript, complimenting Underscore.js.
 * Purpose: Helpful basic utilities and operations to fix common needs in JS.
 *
 * @module bbop-core 
 */

var us = require('underscore');
var each = us.each;

///
///
///

/**
 * Return the best guess (true/false) for whether or not a given
 * object is being used as a hash.
 *
 * @function
 * @name module:bbop-core#is_hash
 * @param {} in_thing - the thing in question
 * @returns {boolean} boolean
 */
function _is_hash(in_thing){
    var retval = false;
    if( in_thing && us.isObject(in_thing) &&
	! us.isArray(in_thing) &&
	! us.isFunction(in_thing) ){
	retval = true;
    }
    return retval;
}

/**
 * Return the string best guess for what the input is, null if it
 * can't be identified. In addition to the _is_a property convention,
 * current core output strings are: 'null', 'array', 'boolean',
 * 'number', 'string', 'function', and 'object'.
 * 
 * @function
 * @name module:bbop-core#what_is
 * @param {any} in_thing - the thing in question
 * @returns {string} string
 */
function _what_is(in_thing){
    var retval = null;
    if( typeof(in_thing) != 'undefined' ){
	
	// If it's an object, try and guess the 'type', otherwise, let
	// typeof.
	if( in_thing == null ){
	    retval = 'null';
	}else if( typeof(in_thing) == 'object' ){
	    
	    // Look for the 'is_a' property that I should be using.
	    if( typeof(in_thing._is_a) != 'undefined' ){
		retval = in_thing._is_a;
	    }else{
		if( us.isArray(in_thing) ){
		    retval = 'array';
		}else{
		    retval = 'object';
		}		
	    }
	}else{
	    retval = typeof(in_thing);
	}
    }
    return retval;
}

/**
 * Dump an object to a string form as best as possible. More meant for
 * debugging. This is meant to be an Object walker. For a slightly
 * different take (Object identification), see <to_string>.
 *
 * @see module:bbop-core.to_string
 * @function
 * @name module:bbop-core#dump
 * @param {} in_thing - something
 * @returns {string} string
 */
function _dump(thing){

    var retval = '';
    
    var what = _what_is(thing);
    if( what == null ){
	retval = 'null';
    }else if( what == 'null' ){
	retval = 'null';
    }else if( what == 'string' ){
	retval = '"' + thing + '"';
    }else if( what == 'boolean' ){
	if( thing ){
	    retval = "true";
	}else{
	    retval = "false";
	}
    }else if( what == 'array' ){
	
	var astack = [];
	each(thing, function(item, i){
	    astack.push(_dump(item));
	});
	retval = '[' + astack.join(', ') + ']';
	
    }else if( what == 'object' ){
	
	var hstack = [];
	each(thing, function(val, key){
	    hstack.push('"'+ key + '": ' + _dump(val));
	});
	retval = '{' + hstack.join(', ') + '}';
	
    }else{
	retval = thing;
    }
    
    return retval;
}

/**
 * (Deep) clone an object down to its atoms.
 *
 * @function
 * @name module:bbop-core#clone
 * @param {any} thing - whatever
 * @returns {any} a new whatever
 */
function _clone(thing){

    var clone = null;
    
    if( typeof(thing) === 'undefined' ){
	// Nothin' doin'.
	//print("looks undefined");
    }else if( typeof(thing) === 'function' ){
	// Dunno about this case...
	//print("looks like a function");
	clone = thing;
    }else if( typeof(thing) === 'boolean' ||
	      typeof(thing) === 'number' ||
	      typeof(thing) === 'string' ){
		  // Atomic types can be returned as-is (i.e. assignment in
		  // JS is the same as copy for atomic types).
		  //print("cloning atom: " + thing);
		  clone = thing;
	      }else if( typeof(thing) === 'object' ){
		  // Is it a null, hash, or an array?
		  if( thing == null ){
		      clone = null;
		  }else if( Array.isArray(thing) ){
		      // Looks like an array!
		      //print("looks like an array");
		      clone = [];
		      for(var i = 0; i < thing.length; i++){
			  clone[i] = _clone(thing[i]);
		      }
		  }else{
		      // Looks like a hash!
		      //print("looks like a hash");
		      clone = {};
		      for(var h in thing){
			  clone[h] = _clone(thing[h]);
		      }
		  }
	      }else{
		  // Then I don't know what it is--might be platform dep.
		  //print("no idea what it is");
	      }
    return clone;
}

/**
 * Attempt to return a two part split on the first occurrence of a
 * character.
 *
 * Returns '' for parts not found.
 * 
 * Unit tests make the edge cases clear.
 * 
 * @function
 * @name module:bbop-core#first_split
 * @param {String} character - the character to split on
 * @param {String} string - the string to split
 * @returns {Array} list of first and second parts
 */
function _first_split(character, string){

    var retlist = null;
    
    var eq_loc = string.indexOf(character);
    if( eq_loc == 0 ){
	retlist = ['', string.substr(eq_loc +1, string.length)];
    }else if( eq_loc > 0 ){
	var before = string.substr(0, eq_loc);
	var after = string.substr(eq_loc +1, string.length);
	retlist = [before, after];
    }else{
	retlist = ['', ''];
    }
    
    return retlist;
}

// Exportable body.
module.exports = {

    clone: _clone,
    dump: _dump,
    first_split: _first_split,
    is_hash: _is_hash,
    what_is: _what_is,

    /**
     * Crop a string nicely.
     * 
     * Returns: Nothing. Side-effects: throws an error if the namespace
     * defined by the strings is not currently found.
     * 
     * @param {} str - the string to crop
     * @param {} lim - the final length to crop to (optional, defaults to 10)
     * @param {} suff - the string to add to the end (optional, defaults to '')
     * @returns {string} cropped string
     */
    crop: function(str, lim, suff){
	var ret = str;
	
	var limit = 10;
	if( lim ){ limit = lim; }

	var suffix = '';
	if( suff ){ suffix = suff; }
	
	if( str.length > limit ){
	    ret = str.substring(0, (limit - suffix.length)) + suffix;
	}
	return ret;
    },

    /**
     * Fold a pair of hashes together, using the first one as an initial
     * template--only the keys in the default hash will be defined in the
     * final hash--and the second hash getting precedence.
     * 
     * The can be quite useful when defining functions--essentially
     * allowing a limited default value system for arguments.
     * 
     * @see module:bbop-core.merge
     * @param {object} default_hash - Template hash.
     * @param {object} arg_hash - Argument hash to match.
     * @returns {object} a new hash
     */
    fold: function(default_hash, arg_hash){

	if( ! default_hash ){ default_hash = {}; }
	if( ! arg_hash ){ arg_hash = {}; }

	var ret_hash = {};
	for( var key in default_hash ){
	    if( ! us.isUndefined(arg_hash[key]) ){
		ret_hash[key] = arg_hash[key];
	    }else{
		ret_hash[key] = default_hash[key];
	    }
	}
	return ret_hash;
    },

    /**
     * Merge a pair of hashes together, the second hash getting
     * precedence. This is a superset of the keys both hashes.
     * 
     * @see module:bbop-core.fold
     * @param {} older_hash - first pass
     * @param {} newer_hash - second pass
     * @returns {object} a new hash
     */
    merge: function(older_hash, newer_hash){

	if( ! older_hash ){ older_hash = {}; }
	if( ! newer_hash ){ newer_hash = {}; }

	var ret_hash = {};
	function _add (val, key){
	    ret_hash[key] = val;
	}
	each(older_hash, _add);
	each(newer_hash, _add);
	return ret_hash;
    },

    /**
     * Get the hash keys from a hash/object, return as an array.
     *
     * @param {} arg_hash - the hash in question
     * @returns {Array} an array of keys
     */
    get_keys: function(arg_hash){

	if( ! arg_hash ){ arg_hash = {}; }
	var out_keys = [];
	for (var out_key in arg_hash) {
	    if (arg_hash.hasOwnProperty(out_key)) {
		out_keys.push(out_key);
	    }
	}
	
	return out_keys;
    },

    /**
     * Returns a hash form of the argument array/list. For example ['a',
     * 'b'] would become {'a': true, 'b': true} or [['a', '12'], ['b',
     * '21']] would become {'a': '12', 'b': '21'}. Using mixed sub-lists
     * is undefined.
     *
     * @param {Array} list - the list to convert
     * @returns {object} a hash
     */
    hashify: function(list){
	var rethash = {};

	if( list && list[0] ){
	    if( us.isArray(list[0]) ){
		each(list, function(item){
		    var key = item[0];
		    var val = item[1];
		    if( ! us.isUndefined(key) ){
			rethash[key] = val;
		    }
		});
	    }else{
		each(list, function(item){
		    rethash[item] = true;
		});
	    }
	}

	return rethash;
    },

    // /**
    //  * Returns true if it things the two incoming arguments are value-wise
    //  * the same.
    //  * 
    //  * Currently only usable for simple (atomic single layer) hashes,
    //  * atomic lists, boolean, null, number, and string values. Will return
    //  * false otherwise.
    //  * 
    //  * @param {} thing1 - thing one
    //  * @param {} thing2 - thing two
    //  *
    //  * Returns: boolean
    //  */
    // is_same: function(thing1, thing2){

    // 	var retval = false;

    // 	// If is hash...steal the code from test.js.
    // 	if( _is_hash(thing1) && _is_hash(thing2) ){
    
    // 	    var same_p = true;
    
    // 	    // See if the all of the keys in hash1 are defined in hash2
    // 	    // and that they have the same ==.
    // 	    for( var k1 in thing1 ){
    // 		if( typeof thing2[k1] === 'undefined' ||
    // 		    thing1[k1] !== thing2[k1] ){
    // 			same_p = false;
    // 			break;
    // 		    }
    // 	    }

    // 	    // If there is still no problem...
    // 	    if( same_p ){
    
    // 		// Reverse of above.
    // 		for( var k2 in thing2 ){
    // 		    if( typeof thing1[k2] === 'undefined' ||
    // 			thing2[k2] !== thing1[k2] ){
    // 			    same_p = false;
    // 			    break;
    // 			}
    // 		}
    // 	    }

    // 	    retval = same_p;

    // 	}else if( bbop.core.is_array(thing1) && bbop.core.is_array(thing2) ){
    // 	    // If it's an array convert and pass it off to the hash function.
    // 	    retval = bbop.core.is_same(bbop.core.hashify(thing1),
    // 				       bbop.core.hashify(thing2));
    // 	}else{
    
    // 	    // So, we're hopefully dealing with an atomic type. If they
    // 	    // are the same, let's go ahead and try.
    // 	    var t1_is = _what_is(thing1);
    // 	    var t2_is = _what_is(thing2);
    // 	    if( t1_is == t2_is ){
    // 		if( t1_is == 'null' ||
    // 		    t1_is == 'boolean' ||
    // 		    t1_is == 'null' ||
    // 		    t1_is == 'number' ||
    // 		    t1_is == 'string' ){
    // 			if( thing1 == thing2 ){
    // 			    retval = true;
    // 			}
    // 		    }
    // 	    }
    // 	}

    // 	return retval;
    // },

    /**
     * Return the best guess (true/false) for whether or not a given
     * object is being used as an array.
     *
     * @param {} in_thing - the thing in question
     * @returns {boolean} boolean
     */
    is_array: function(in_thing){
	var retval = false;
	if( in_thing &&
	    Array.isArray(in_thing) ){
	    retval = true;
	}
	return retval;
    },

    /**
     * Return true/false on whether or not the object in question has any
     * items of interest (iterable?).
     *
     * @param {} in_thing - the thing in question
     * @returns {boolean} boolean
     */
    is_empty: function(in_thing){
	var retval = false;
	if( us.isArray(in_thing) ){
	    if( in_thing.length == 0 ){
		retval = true;
	    }
	}else if( _is_hash(in_thing) ){
	    var in_hash_keys = us.keys(in_thing);
	    if( in_hash_keys.length == 0 ){
		retval = true;
	    }
	}else{
	    // TODO: don't know about this case yet...
	    //throw new Error('unsupported type in is_empty');	
	    retval = false;
	}
	return retval;
    },

    /**
     * Return true/false on whether or not the passed object is defined.
     *
     * @param {} in_thing - the thing in question
     * @returns {boolean} boolean
     */
    is_defined: function(in_thing){
	var retval = true;
	if( typeof(in_thing) === 'undefined' ){
	    retval = false;
	}
	return retval;
    },

    /**
     * Take an array or hash and pare it down using a couple of functions
     * to what we want.
     * 
     * Both parameters are optional in the sense that you can set them to
     * null and they will have no function; i.e. a null filter will let
     * everything through and a null sort will let things go in whatever
     * order.
     *
     * @param {Array|Object} in_thing - hash or array
     * @param {Function} filter_function - hash (function(key, val)) or array (function(item, i)); this function must return boolean true or false.
     * @param {Function} sort_function - function to apply to elements: function(a, b); this function must return an integer as the usual sort functions do.
     * @returns {Array} array
     */
    pare: function(in_thing, filter_function, sort_function){

	var ret = [];
	
	// Probably an not array then.
	if( typeof(in_thing) === 'undefined' ){
	    // this is a nothing, to nothing....
	}else if( typeof(in_thing) != 'object' ){
	    throw new Error('Unsupported type in bbop.core.pare: ' +
			    typeof(in_thing) );
	}else if( us.isArray(in_thing) ){
	    // An array; filter it if filter_function is defined.
	    if( filter_function ){	
		each(in_thing, function(item, index){
		    if( filter_function(item, index) ){
			// filter out item if true
		    }else{
			ret.push(item);
		    }
		});
	    }else{
		each(in_thing, function(item, index){ ret.push(item); });
	    }
	}else if( us.isFunction(in_thing) ){
	    // Skip is function (which is also an object).
	}else if( us.isObject(in_thing) ){
	    // Probably a hash; filter it if filter_function is defined.
	    if( filter_function ){	
		each(in_thing, function(val, key){
		    if( filter_function(key, val) ){
			// Remove matches to the filter.
		    }else{
			ret.push(val);
		    }
		});
	    }else{
		each(in_thing, function(val, key){ ret.push(val); });
	    }
	}else{
	    // No idea what this is--skip.
	}

	// For both: sort if there is anything.
	if( ret.length > 0 && sort_function ){
	    ret.sort(sort_function);	    
	}

	return ret;
    },

    /**
     * Essentially add standard 'to string' interface to the string class
     * and as a stringifier interface to other classes. More meant for
     * output--think REPL. Only atoms, arrays, and objects with a
     * to_string function are handled.
     *
     * @see module:bbop-core.dump
     * @param {any} in_thing - something
     * @returns {string} string
     */
    to_string: function(in_thing){

	// First try interface, then the rest.
	if( in_thing &&
	    typeof(in_thing.to_string) !== 'undefined' &&
	    typeof(in_thing.to_string) == 'function' ){
		return in_thing.to_string();
	    }else{
		
		var what = _what_is(in_thing);
		if( what == 'number' ){
		    return in_thing.toString();
		}else if( what == 'string' ){
		    return in_thing;
		}else if( what == 'array' ){
		    return _dump(in_thing);
		    // }else if( what == 'object' ){
		    //     return bbop.core.dump(in_thing);
		    // }else{
		    //     return '[unsupported]';
		}else{
		    return in_thing;
		}
	    }
    },

    /**
     * Check to see if all top-level objects in a namespace supply an
     * "interface".
     * 
     * Mostly intended for use during unit testing.
     *
     * TODO: Unit test this to make sure it catches both prototype (okay I
     * think) and uninstantiated objects (harder/impossible?).
     *
     * @param {} iobj - the object/constructor in question
     * @param {} interface_list - the list of interfaces (as a strings) we're looking for
     * @returns {boolean} boolean
     */
    has_interface: function(iobj, interface_list){
	var retval = true;
	each(interface_list, function(iface){
	    //print('|' + typeof(in_key) + ' || ' + typeof(in_val));
	    //print('|' + in_key + ' || ' + in_val);
	    if( typeof(iobj[iface]) == 'undefined' &&
		typeof(iobj.prototype[iface]) == 'undefined' ){
		    retval = false;
		    throw new Error(_what_is(iobj) +
				    ' breaks interface ' + iface);
                }
	});
	return retval;
    },

    /**
     * Assemble an object into a GET-like query. You probably want to see
     * the tests to get an idea of what this is doing.
     * 
     * The last argument of double hashes gets quoted (Solr-esque),
     * otherwise not. It will try and avoid adding additional sets of
     * quotes to strings.
     *
     * This does nothing to make the produced "URL" in any way safe.
     * 
     * WARNING: Not a hugely clean function--there are a lot of special
     * cases and it could use a good (and safe) clean-up.
     * 
     * @param {} qargs - hash/object
     * @returns {string} string
     */
    get_assemble: function(qargs){

	var mbuff = [];
	for( var qname in qargs ){
	    var qval = qargs[qname];

	    // null is technically an object, but we don't want to render
	    // it.
	    if( qval != null ){
		if( typeof qval == 'string' || typeof qval == 'number' ){
		    // Is standard name/value pair.
		    var nano_buffer = [];
		    nano_buffer.push(qname);
		    nano_buffer.push('=');
		    nano_buffer.push(qval);
		    mbuff.push(nano_buffer.join(''));
		}else if( typeof qval == 'object' ){
		    if( typeof qval.length != 'undefined' ){
			// Is array (probably).
			// Iterate through and double on.
			for(var qval_i = 0; qval_i < qval.length ; qval_i++){
			    var nano_buff = [];
			    nano_buff.push(qname);
			    nano_buff.push('=');
			    nano_buff.push(qval[qval_i]);
			    mbuff.push(nano_buff.join(''));
			}
		    }else{
			// // TODO: The "and" case is pretty much like
			// // the array, the "or" case needs to be
			// // handled carefully. In both cases, care will
			// // be needed to show which filters are marked.
			// Is object (probably).
			// Special "Solr-esque" handling.
			for( var sub_name in qval ){
			    var sub_vals = qval[sub_name];
			    
			    // Since there might be an array down there,
			    // ensure that there is an iterate over it.
			    if( _what_is(sub_vals) != 'array' ){
				sub_vals = [sub_vals];
			    }
			    
			    each(sub_vals, function(sub_val){
				var nano_buff = [];
				nano_buff.push(qname);
				nano_buff.push('=');
				nano_buff.push(sub_name);
				nano_buff.push(':');
				if( typeof sub_val !== 'undefined' && sub_val ){
				    // Do not double quote strings.
				    // Also, do not requote if we already
				    // have parens in place--that
				    // indicates a complicated
				    // expression. See the unit tests.
				    var val_is_a = _what_is(sub_val);
				    if( val_is_a == 'string' &&
					sub_val.charAt(0) == '"' &&
					sub_val.charAt(sub_val.length -1) == '"' ){
					    nano_buff.push(sub_val);
					}else if( val_is_a == 'string' &&
						  sub_val.charAt(0) == '(' &&
						  sub_val.charAt(sub_val.length -1) == ')' ){
						      nano_buff.push(sub_val);
						  }else{
						      nano_buff.push('"' + sub_val + '"');
						  }
				}else{
				    nano_buff.push('""');
				}
				mbuff.push(nano_buff.join(''));
			    });
			}
		    }
		}else if( typeof qval == 'undefined' ){
		    // This happens in some cases where a key is tried, but no
		    // value is found--likely equivalent to q="", but we'll
		    // let it drop.
		    // var nano_buff = [];
		    // nano_buff.push(qname);
		    // nano_buff.push('=');
		    // mbuff.push(nano_buff.join(''));	    
		}else{
		    throw new Error("bbop.core.get_assemble: unknown type: " + 
				    typeof(qval));
		}
	    }
	}
	
	return mbuff.join('&');
    },

    /**
     * Random number generator of fixed length. Return a random number
     * string of length len.
     *
     * @param {} len - the number of random character to return.
     * @returns {string} string
     */
    randomness: function(len){

	var random_base = [
	    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
	    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
	];
	var length = len || 10;
	var cache = new Array();
	for( var ii = 0; ii < length; ii++ ){
	    var rbase_index = Math.floor(Math.random() * random_base.length);
	    cache.push(random_base[rbase_index]);
	}
	return cache.join('');
    },

    /**
     * Return the parameters part of a URL.
     *
     * Unit tests make the edge cases clear.
     * 
     * @param {} url - url (or similar string)
     * @returns {Array} list of part lists
     */
    url_parameters: function(url){

	var retlist = [];

	// Pull parameters.
	var tmp = url.split('?');
	var path = '';
	var parms = [];
	if( ! tmp[1] ){ // catch bad url--nothing before '?'
	    parms = tmp[0].split('&');
	}else{ // normal structure
	    path = tmp[0];
	    parms = tmp[1].split('&');
	}

	// Decompose parameters.
	each(parms, function(p){
	    var c = _first_split('=', p);
	    if( ! c[0] && ! c[1] ){
		retlist.push([p]);
	    }else{
		retlist.push(c);		  
	    }
	});
	
	return retlist;
    },

    /**
     * Convert a string into something consistent for urls (getting icons,
     * etc.). Return a munged/hashed-down version of the resource.
     * Assembles, converts spaces to underscores, and all lowercases.
     * 
     * @param {} base - base url for the resource(s)
     * @param {} resource - the filename or whatever to be transformed
     * @param {} extension - *[optional]* the extension of the resource
     * @returns {string} string
     */
    resourcify: function(base, resource, extension){

	var retval = base + '/' + resource;

	// Add the extension if it is there.
	if( extension ){
	    retval += '.' + extension;	
	}

	// Spaces to underscores and all lowercase.
	//return retval.replace(/\ /g, "_", "g").toLowerCase();
	return retval.replace(/\ /g, "_").toLowerCase();
    },

    /**
     * RFC 4122 v4 compliant UUID generator.
     * From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
     *
     * @returns {string} string
     */
    uuid: function(){

	// Replace x (and y) in string.
	function replacer(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	}
	var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
	return target_str.replace(/[xy]/g, replacer);
    },

    /**
     * A sort function to put numbers in ascending order.
     * 
     * Useful as the argument to .sort().
     * 
     * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     * 
     * @param {number} a - the first number
     * @param {number} b - the second number
     * @returns {number} number of their relative worth
     */
    numeric_sort_ascending: function(a, b){
	return a - b;
    },

    /**
     * A sort function to put numbers in descending order.
     * 
     * Useful as the argument to .sort().
     * 
     * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
     * 
     * @param {number} a - the first number
     * @param {number} b - the second number
     * @returns {number} number of their relative worth
     */
    numeric_sort_descending: function(a, b){
	return b - a;
    },

    /**
     * Remove the quotes from a string.
     * 
     * @param {string} str - the string to dequote
     * @returns {string} the dequoted string (or the original string)
     */
    dequote: function(str){
	var retstr = str;

	if( ! us.isUndefined(str) && str.length > 2 ){
	    var end = str.length -1;
	    if( str.charAt(0) == '"' && str.charAt(end) == '"' ){
		retstr = str.substr(1, end -1);
	    }
	}

	return retstr;
    },

    /**
     * Make sure that a substring exists at the beginning or end (or both)
     * of a string.
     * 
     * @param {} str - the string to ensure that has the property
     * @param {} add - the string to check for (and possibly add)
     * @param {} place - *[optional]* "front"|"back", place to ensure (defaults to both)
     * @returns {string} a new string with the property enforced
     */
    ensure: function(str, add, place){

	// 
	var do_front = false;
	var do_back = false;
	if( us.isUndefined(place) ){
	    do_front = true;
	    do_back = true;
	}else if( place == 'front' ){
	    do_front = true;
	}else if( place == 'back' ){
	    do_back = true;
	}else{
	    // Don't know what it is, not doing anything.
	}

	//
	var strlen = str.length;
	var addlen = add.length;
	var front_substr = str.substr(0, addlen);
	var back_substr = str.substr((strlen - addlen), (strlen -1));

	//
	var front_add = '';
	if( do_front && front_substr != add ){
	    front_add = add;
	}
	var back_add = '';
	if( do_back && back_substr != add ){
	    back_add = add;
	}

	// console.log('do_front: ' + do_front);
	// console.log('do_back: ' + do_back);
	// console.log('str.length: ' + strlen);
	// console.log('add.length: ' + addlen);
	// console.log('front_substr: ' + front_substr);
	// console.log('back_substr: ' + back_substr);
	// console.log('front_add: ' + front_add);
	// console.log('back_add: ' + back_add);

	return front_add + str + back_add;
    },

    /**
     * Trim the leading and trailing whitespace from a string.
     * Named differently so as not to confuse with JS 1.8.1's trim().
     * 
     * @param {string} str - the string to ensure that has the property
     * @returns {string} the trimmed string
     */
    chomp: function(str){

	var retstr = '';

	retstr = str.replace(/^\s+/,'');
	retstr = retstr.replace(/\s+$/,'');

	return retstr;
    },

    /**
     * Break apart a string on certain delimiter.
     * 
     * @param {} str - the string to ensure that has the property
     * @param {} delimiter - *[optional]* either a string or a simple regexp; defaults to ws
     *
     * @returns {Array} a list of separated substrings
     */
    splode: function(str, delimiter){

	var retlist = null;

	if( ! us.isUndefined(str) ){
	    if( us.isUndefined(delimiter) ){
		delimiter = /\s+/;
	    }
	    
	    retlist = str.split(delimiter);
	}

	return retlist;
    },

    // // Giving up on this for now: the general case seems too hard to work with 
    // // in so many different, contradictory, and changing environments.
    // /**
    //  * Getting a cross-platform that can evaluate to the global namespace
    //  * seems a little bit problematic. This is an attempt to wrap that all
    //  * away.
    //  * 
    //  * This is not an easy problem--just within browsers there are a lot
    //  * of issues:
    //  * http://perfectionkills.com/global-eval-what-are-the-options/ After
    //  * that, the server side stuff tries various ways to keep you from
    //  * affecting the global namespace in certain circumstances.
    //  * 
    //  * @param {} to_eval - the string to evaluate
    //  * 
    //  * Returns:
    //  *  A list with the following fields: retval, retval_str, okay_p, env_type.
    //  */
    // evaluate: function(to_eval){

    //     var retval = null;
    //     var retval_str = '';
    //     var okay_p = true;
    //     var env_type = 'server';

    //     // Try and detect our environment.
    //     try{
    // 	if( bbop.core.is_defined(window) &&
    // 	    bbop.core.is_defined(window.eval) &&
    // 	    bbop.core.what_is(window.eval) == 'function' ){
    // 		env_type = 'browser';
    // 	    }
    //     } catch (x) {
    // 	// Probably not a browser then, right? Hopefully all the
    // 	// servers that we'll run into are the same (TODO: check
    // 	// nodejs).
    //     }
    //     print('et: ' + env_type);

    //     // Now try for the execution.
    //     try{
    // 	// Try and generically evaluate.
    // 	if( env_type == 'browser' ){
    // 	    print('eval as if (browser)');
    // 	    retval = window.eval(to_eval);
    // 	}else{
    // 	    // TODO: Does this work?
    // 	    print('eval as else (server)');
    // 	    //retval = this.eval(to_eval);		
    // 	    retval = bbop.core.global.eval(to_eval);
    // 	}
    //     }catch (x){
    // 	// Bad things happened.
    // 	print('fail on: (' + retval +'): ' + to_eval);
    // 	retval_str = '[n/a]';
    // 	okay_p = false;
    //     }
    
    //     // Make whatever the tmp_ret is prettier for the return string.
    //     if( bbop.core.is_defined(retval) ){
    // 	if( bbop.core.what_is(retval) == 'string' ){
    // 	    retval_str = '"' + retval + '"';
    // 	}else{
    // 	    retval_str = retval;
    // 	}
    //     }else{
    // 	// Return as-is.
    //     }

    //     return [retval, retval_str, okay_p, env_type];
    // };

    /**
     * What seems to be a typical idiom for subclassing in JavaScript.
     * 
     * This attempt has been scraped together from bits here and there and
     * lucid explanations from Mozilla:
     * 
     * https://developer.mozilla.org/en-US/docs/JavaScript/Introduction_to_Object-Oriented_JavaScript
     * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Details_of_the_Object_Model
     * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Inheritance_Revisited
     * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/new
     * 
     * @param {} subclass - the subclass object
     * @param {} superclass - the superclass object
     */
    extend: function(subclass, baseclass){

	// Create a temporary nothing so that we don't fiddle the
	// baseclass's(?) with what we do to subclass later on.
	function tmp_object(){}

	// This nothings prototype gets the base class's.
	tmp_object.prototype = baseclass.prototype;

	// We instantiate the tmp_object, whose prototype is the
	// baseclass's; we make subclass's prototype this object, giving
	// us something that is very much like baseclass.
	subclass.prototype = new tmp_object; // same as: "new tmp_object();"

	// Now we go back and make the constructor of subclass actually
	// subclass again--we blew it away in the last step. Now we have a
	// subclass constructor with the protoype of baseclass.
	subclass.prototype.constructor = subclass;

	// // Create a property to allow access to the constructor of
	// // baseclass. This is useful when subclass needs access to
	// // baseclass's constructor for property setting.
	// subclass.base_constructor = baseclass;

	// // Create a property to
	// subclass.parent_class = baseclass.prototype;
    },

    /**
     * BBOP JS logger object. Using .kvetch(), you can automatically log a
     * message in almost any environment you find yourself in--browser,
     * server wherever. Also, if you have jQuery available and an element
     * with the id "bbop-logger-console-textarea",
     * "bbop-logger-console-text", or "bbop-logger-console-html", the
     * logger will append to that element (with a "\n" (autoscroll), "\n",
     * or "<br />" terminator respectively) instead.
     *
     * @constructor
     * @param {string} initial_context - (optional) initial context as string.
     */
    logger: function(initial_context){

	/**
	 * Different debugging available per object. Externally toggle
	 * between true and false to switch on and off the logging.
	 *
	 * @variable {boolean}
	 */
	this.DEBUG = false;

	var anchor = this;

	// Define an optional context to tag onto the front of messages.
	this._context = [];
	if( initial_context ){
	    this._context = [initial_context];
	}

	/**
	 * Define the ability to reset the contex.
	 * 
	 * @param {string} new_initial_context - (optional) new context to start with
	 */
	this.reset_context = function(new_initial_context){
	    if( new_initial_context ){
		this._context = [new_initial_context];
	    }else{
		this._context = [];	    
	    }
	};

	/**
	 * Add an additional logging context to the stack.
	 * 
	 * @param {string} new_context - New context to add to the context stack.
	 */
	this.push_context = function(new_context){
	    this._context.push(new_context);
	};

	/**
	 * Remove the last context if it's there.
	 */
	this.pop_context = function(){
	    var popped_context = null;
	    if( this._context.length > 0 ){
		popped_context = this._context.pop();
	    }
	    return popped_context;
	};

	// Generalizer console (or whatever) printing.
	this._console_sayer = function(){};

	if( typeof(jQuery) != 'undefined' && jQuery('#' + 'bbop-logger-console-html') != 'undefined' && jQuery('#' + 'bbop-logger-console-html').length ){
	    // Our own logging console takes precedence. 
	    this._console_sayer = function(msg){
		var area = jQuery('#'+ 'bbop-logger-console-html');
		area.append(msg + "<br />");
		try{
    		    area.scrollTop(area[0].scrollHeight);
		} catch (x) {
		    // could scroll
		}
		//jQuery('#'+'bbop-logger-console-html').append(msg + "<br />");
	    };
	}else if( typeof(console) != 'undefined' && typeof(console.log) == 'function' ){
	    // This may be okay for Chrome and a subset of various
	    // console loggers. This should now include FF's Web
	    // Console and NodeJS.  this._console_sayer =
	    // function(msg){ console.log(msg + "\n"); }; These
	    // usually seem to have "\n" incorporated now.
	    this._console_sayer = function(msg){ console.log(msg); };
	}else if( typeof(opera) != 'undefined' && typeof(opera.postError) == 'function' ){
	    // If Opera is in there, probably Opera.
	    this._console_sayer = function(msg){ opera.postError(msg + "\n"); };
	}else if( typeof(window) != 'undefined' && typeof(window.dump) == 'function' ){
	    // From developer.mozilla.org: To see the dump output you
	    // have to enable it by setting the preference
	    // browser.dom.window.dump.enabled to true. You can set
	    // the preference in about:config or in a user.js
	    // file. Note: this preference is not listed in
	    // about:config by default, you may need to create it
	    // (right-click the content area -> New -> Boolean).
	    this._console_sayer = function(msg){ dump( msg + "\n"); };
	}else if( typeof(window) != 'undefined' && typeof(window.console) != 'undefined' && typeof(window.console.log) == 'function' ){
	    // From developer.apple.com: Safari's "Debug" menu allows
	    // you to turn on the logging of JavaScript errors. To
	    // display the debug menu in Mac OS X, open a Terminal
	    // window and type: "defaults write com.apple.Safari
	    // IncludeDebugMenu 1" Need the wrapper function because
	    // safari has personality problems.
	    this._console_sayer = function(msg){ window.console.log(msg + "\n"); };
	}else if( typeof(build) == 'function' && typeof(getpda) == 'function' && typeof(pc2line) == 'function' && typeof(print) == 'function' ){
	    // This may detect SpiderMonkey on the comand line.
	    this._console_sayer = function(msg){ print(msg); };
	}else if( typeof(org) != 'undefined' && typeof(org.rhino) != 'undefined' && typeof(print) == 'function' ){
	    // This may detect Rhino on the comand line.
	    this._console_sayer = function(msg){ print(msg); };
	}
	
	/**
	 * Log a string to somewhere. Also return a string to (mostly for
	 * the unit tests).
	 * 
	 * @param {string} initial_context - (optional) initial context as string
	 * @returns {string} string to print out to wherever we found
	 */
	this.kvetch = function(string){
	    var ret_str = null;
	    if( anchor.DEBUG == true ){

		// Make sure there is something there no matter what.
		if( typeof(string) == 'undefined' ){ string = ''; }

		// Redefined the string a little if we have contexts.
		if( anchor._context.length > 0 ){
		    var cstr = anchor._context.join(':');
		    string = cstr + ': '+ string;
		}

		// Actually log to the console.
		anchor._console_sayer(string);

		// Bind for output.
		ret_str = string;
	    }
	    return ret_str;
	};
    }

};

},{"underscore":3}],3:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[1]);
