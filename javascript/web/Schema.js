////
//// Render the schema information that we can squeeze out of the API.
////

var us = require('underscore');
var bbop = require('bbop-core');
var widgets = require('bbop-widget-set');
var html = widgets.html;

// Config.
var amigo = new (require('amigo2-instance-data'))(); // no overload
var golr_conf = require('golr-conf');
var gconf = new golr_conf.conf(amigo.data.golr);
var gserv = amigo.data.server.golr_base;
var sd = amigo.data.server;
// Linker.
var linker = amigo.linker;
// Management.
var jquery_engine = require('bbop-rest-manager').jquery;
var golr_manager = require('bbop-manager-golr');
var golr_response = require('bbop-response-golr');

//
function SchemaInit(){

    // Per-manager logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch(str); }

    // Aliases.
    var hashify = bbop.hashify;
    var get_keys = bbop.get_keys;
    var is_def = bbop.is_defined;

    // Helper: dedupe a list...might be nice in core?
    function dedupe(list){
	var retlist = [];
	if( list && list.length > 0 ){
	    retlist = get_keys(hashify(list));
	}
	return retlist;
    }

    // Helper: turn:
    // : {'string1': ['foo'], 'string2': ['foo', 'bar', 'foo'],}
    // Into:
    // : "string1 (foo)<br />string2 (foo, bar)"
    function sfuse(hash){
	var retval = '';

	var cache = [];
	us.each(hash, function(loc_list, str){
	    var locs = dedupe(loc_list);
	    cache.push( str + ' <small>[' + locs.join(', ') + ']</small>');
	});
	if( cache.length > 0 ){
	    retval = cache.join('<br />');	    
	}
	
	return retval;
    }

    //ll('');
    ll('SchemaInit start...');

    // // Make unnecessary things roll up.
    // amigo.ui.rollup(["inf01"]);

    var classes = gconf.get_classes_by_weight();

    // First, let's go through all of the fields and figure out their
    // capacities.
    //
    var field_cap_cache = {};
    var capacities = ['boost', 'result', 'filter'];
    us.each(classes, function(conf_class, ccindex){
	var personality = conf_class.id();
	
	us.each(capacities, function(capacity){
	    var by_weights = conf_class.get_weights(capacity);
	    us.each(by_weights, function(field){
		//var fid = field.id();
		var fid = field;
		if( ! is_def(field_cap_cache[fid]) ){
		    field_cap_cache[fid] = {};
		}
		if( ! is_def(field_cap_cache[fid][capacity]) ){
		    field_cap_cache[fid][capacity] = [];
		}
		field_cap_cache[fid][capacity].push(
		    personality);
	    });
	});
    });

    // Now cycle through the main schema and build up an object for
    // use in table building.
    var fields = {};
    us.each(classes, function(conf_class, ccindex){
	var personality = conf_class.id();

	var cfs = conf_class.get_fields();
	us.each(cfs, function(cf, cfindex){
	    // If we haven't seen it before, go ahead and
	    // add it.
	    var cid = cf.id();
	    if( ! bbop.is_defined( fields[cid]) ){
		fields[cid] = {
		    personality: [],
		    label: {},
		    description: {},
		    capacity: {},
		    //required: 
		    multi: '???',
		    id: cid
		};
	    }

	    // Personality is easy.
	    fields[cid]['personality'].push(personality);

	    // Multi is easy too since it must be uniform.
	    if( cf.is_multi() ){
		fields[cid]['multi'] = 'yes';
	    }else{
		fields[cid]['multi'] = 'no';
	    }
	    
	    // Capacity not too bad since we already
	    // did the work above.
	    if( field_cap_cache[cid] && ! us.isEmpty(field_cap_cache[cid]) ){
		fields[cid]['capacity'] = field_cap_cache[cid];
	    }
	    
	    // Label and description are harder. First grab
	    // raw versions, assert, then mark personality.
	    // Label.
	    var lbl = cf.display_name();
	    if( ! is_def(fields[cid]['label'][lbl]) ){
		fields[cid]['label'][lbl] = [];
	    }
	    fields[cid]['label'][lbl].push(personality);
	    // Description.
	    var desc = cf.description();
	    if( ! is_def(fields[cid]['description'][desc]) ){
		fields[cid]['description'][desc] = [];
	    }
	    fields[cid]['description'][desc].push(personality);
	});
    });

    // Generate a nice table head.    
    var thead = new html.tag('thead');
    us.each(['id', 'multi', 'display label(s)', 'description(s)',
	     'in capacity', 'personalities'], function(title_item){
		 thead.add_to('<th>' + title_item +
			      '<img style="border: 0px;" src="' +
			      sd.image_base + '/reorder.gif" />' +
			      '</th>');
	     });

    // Now a nice body. Add some buttons, but keep them for later.
    var tbody = new html.tag('tbody');
    us.each(fields, function(fobj, fkey){
	var cache = [];

	// Unique.
	cache.push(fobj['id']);
	cache.push(fobj['multi']);

	// Label and description need to be handled carefully.
	cache.push( sfuse(fobj['label']) );
	cache.push( sfuse(fobj['description']) );

	// Careful handling.
	cache.push( sfuse(fobj['capacity']) );

	// Personality easily deduped.
	cache.push(dedupe(fobj['personality']).join(', '));

	// Assemble.
	var tr = '<tr><td>' + cache.join('</td><td>') + '</td></tr>';
	tbody.add_to(tr);
    });

    // Generate the table itself.
    var tbl_attrs = {
	generate_id: true,
	'class': 'table table-hover table-striped'
    };
    var tbl = new html.tag('table', tbl_attrs);
    tbl.add_to(thead);
    tbl.add_to(tbody);

    var filter_inject_id = 'schema_info_search_div';
    var target_id = 'schema_info_table_div';

    // Add the table to the DOM.
    jQuery('#' + target_id).empty();
    jQuery('#' + target_id).append(tbl.to_string());

    ///
    /// Sorting, coloring, etc.
    ///

    // Apply the tablesorter to what we got.
    jQuery('#' + tbl.get_id()).tablesorter(); 

    // Add filtering to table.
    var ft = new widgets.display.filter_table(filter_inject_id, tbl.get_id(),
					      sd.image_base +'/waiting_ajax.gif',
					      null, 'Filter:&nbsp;');
    
    ll('SchemaInit done.');
}

// Embed the jQuery setup runner.
(function (){
    jQuery(document).ready(function(){ SchemaInit(); });
})();
