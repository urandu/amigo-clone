/* 
 * Package: linker.js
 * 
 * Namespace: amigo.linker
 * 
 * Generic AmiGO link generator, fed by <amigo.data.server> for local
 * links and <amigo.data.xrefs> for non-local links.
 * 
 * NOTE: A lot of this is lifted from the (defunct) amigo2.js
 * package. However, the future should be here.
 */

var us = require('underscore');
var bbop = require('bbop-core');

// Need acces to the server data.
var amigo_data_server = new (require('./data/server'))();
var amigo_data_xrefs = new (require('./data/xrefs'))();

/*
 * Constructor: linker
 * 
 * Create an object that can make URLs and/or anchors.
 * 
 * These functions have a well defined interface so that other
 * packages can use it.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
var linker = function (){
    this._is_a = 'amigo.linker';

    // Easy app base.
    var sd = amigo_data_server;
    this.app_base = sd.app_base();
    // Internal term matcher.
    this.term_regexp = null;
    var internal_regexp_str = sd.term_regexp();    
    if( internal_regexp_str ){
	this.term_regexp = new RegExp(internal_regexp_str);
    }

    // Categories for different special cases (internal links).
    this.ont_category = {
	'term': true,
	'ontology_class': true,
	'annotation_class': true,
	'annotation_class_closure': true,
	'annotation_class_list': true,
	// Noctua model stuff.
	'function_class': true,
	'function_class_closure': true,
	'process_class': true,
	'process_class_closure': true,
	'location_list': true,
	'location_list_closure': true
    };
    this.bio_category = {
        'gp': true,
	'gene_product': true,
	'bioentity': true
    };
    this.model_category = {
        'model': true
    };
    this.search_category = { // not including the trivial medial_search below
        'search': true,
	'live_search': true
    };
    this.search_modifier = {
	// Possibly "dynamic".
	'gene_product': '/bioentity',
	'bioentity': '/bioentity',
	'ontology': '/ontology',
	'annotation': '/annotation',
	'model': '/model',
	'family': '/family',
	'lego_unit': '/lego_unit',
	'general': '/general'
    };
    this.other_interlinks = {
	'medial_search': '/amigo/medial_search',
	'landing': '/amigo/landing',
	'tools': '/amigo/software_list',
	'schema_details': '/amigo/schema_details',
	'load_details': '/amigo/load_details',
	'browse': '/amigo/browse',
	'goose': '/goose',
	'grebe': '/grebe',
	'gannet': '/gannet',
	'repl': '/repl'	
    };
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id
 *  modifier - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (url); null if it couldn't create anything
 */
linker.prototype.url = function (id, xid, modifier){
    
    var retval = null;

    return 'foo';

    ///
    /// AmiGO hard-coded internal link types.
    ///

    // For us, having an xid means that we will be doing some more
    // complicated routing.
    if( xid && xid !== '' ){

	// First let's do the ones that need an associated id to
	// function--either data urls or searches.
	if( id && id !== '' ){
	    if( this.ont_category[xid] ){
		retval = this.app_base + '/amigo/term/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.bio_category[xid] ){
		retval = this.app_base + '/amigo/gene_product/' + id;
		//retval = _add_restmark_modifier(retval, modifier);
            }else if( this.model_category[xid] ){
		retval = this.app_base + '/amigo/model/'+ id;
            }else if( this.search_category[xid] ){

		// First, try and get the proper path out. Will
		// hardcode for now since some paths don't map
		// directly to the personality.
		var search_path = '';
		if( this.search_modifier[modifier] ){
		    search_path = this.search_modifier[modifier];
		}
		
		retval = this.app_base + '/amigo/search' + search_path;
		if( id ){
		    // Ugh...decide if the ID indicated a restmark or
		    // a full http action bookmark.
		    var http_re = new RegExp("^http");
		    if( http_re.test(id) ){
			// HTTP bookmark.
			retval = retval + '?bookmark='+ id;
		    }else{
			// minimalist RESTy restmark.
			retval = retval + '?' + id;
		    }
		}
	    }
	}

	// Things that do not need an id to function--like just
	// popping somebody over to Grebe or the medial search.
	if( ! retval ){
	    if( this.other_interlinks[xid] ){
		var extension = this.other_interlinks[xid];
		retval = this.app_base + extension;

		// Well, for medial search really, but it might be
		// general?
		if( xid === 'medial_search' ){
		    // The possibility of just tossing back an empty
		    // search for somebody downstream to fill in.
		    if( typeof(id) !== 'undefined' && id !== null ){
			retval = retval + '?q=' + id;
		    }
		}
	    }
	}
    }

    ///
    /// External resources. For us, if we haven't found something
    /// so far, try the data xrefs.
    ///
    
    // Since we couldn't find anything with our explicit local
    // transformation set, drop into the great abyss of the xref data.
    if( ! retval && id && id !== '' ){ // not internal, but still has an id
	
	// First, extract the probable source and break it into parts.
	var full_id_parts = bbop.first_split(':', id);
	if( full_id_parts && full_id_parts[0] && full_id_parts[1] ){
	    var src = full_id_parts[0];
	    var sid = full_id_parts[1];
	    
	    // Now, check to see if it is indeed in our store.
	    var lc_src = src.toLowerCase();
	    var xref = amigo_data_xrefs[lc_src];
	    if( xref && xref['url_syntax'] ){
		console.log('url_syntax', xref['url_syntax']);
		throw new Error();
		retval = xref['url_syntax'].replace('[example_id]', sid, 'g');
	    }
	}
    }
    
    return retval;
};

/*
 * Function: anchor
 * 
 * Return a link as a chunk of HTML, all ready to consume in a
 * display.
 * 
 * Arguments:
 *  args - hash--'id' required; 'label' and 'hilite' are inferred if not extant
 *  xid - *[optional]* an internal transformation id
 *  rest - *[optional]* modify xid; only used with xid
 * 
 * Returns:
 *  string (link); null if it couldn't create anything
 */
linker.prototype.anchor = function(args, xid, modifier){
    
    var anchor = this;
    var retval = null;

    // Don't even start if there is nothing.
    if( args ){

	// Get what fundamental arguments we can.
	var id = args['id'];
	if( id ){
	
	    // Infer label from id if not present.
	    var label = args['label'];
	    if( ! label ){ label = id; }
	    
	    // Infer hilite from label if not present.
	    var hilite = args['hilite'];
	    if( ! hilite ){ hilite = label; }
	
	    // See if the URL is legit. If it is, make something for it.
	    var url = this.url(id, xid, modifier);
	    if( url ){
		
		// First, see if it is one of the internal ones we know about
		// and make something special for it.
		if( xid ){
		    if( this.ont_category[xid] ){
		    
			// Possible internal/external detection here.
			// var class_str = ' class="amigo-ui-term-internal" ';
			var class_str = '';
			var title_str = 'title="' + // internal default
			id + ' (go to the term details page for ' +
			    label + ')"';
			if( this.term_regexp ){
			    if( this.term_regexp.test(id) ){
			    }else{
				class_str = ' class="amigo-ui-term-external" ';
				title_str = ' title="' +
				    id + ' (is an external term; click ' +
				    'to view our internal information for ' +
				    label + ')" ';
			    }
			}
			
			//retval = '<a title="Go to the term details page for '+
 			retval = '<a ' + class_str + title_str +
			    ' href="' + url + '">' + hilite + '</a>';
		    }else if( this.bio_category[xid] ){
 			retval = '<a title="' + id +
			    ' (go to the details page for ' + label +
			    ')" href="' + url + '">' + hilite + '</a>';
		    }else if( this.search_category[xid] ){
			retval = '<a title="Reinstate bookmark for ' + label +
			    '." href="' + url + '">' + hilite + '</a>';
		    }
		}
		
		// If it wasn't in the special transformations, just make
		// something generic.
		if( ! retval ){
		    retval = '<a title="' + id +
			' (go to the page for ' + label +
			')" href="' + url + '">' + hilite + '</a>';
		}
	    }
	}
    }

    return retval;
};

///
/// Exportable body.
///

module.exports = linker;
