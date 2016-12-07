////
//// Some unit testing for package bbop-manager-golr.
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

///
/// Helpers.
///

var each = us.each;

// Are two arrays the same, including order?
function _same_array(one, two){
    var retval = true;
    if( one.length !== two.length ){
	retval = false;
    }else{
	for( var i = 0; i < one.length; i++ ){
	    if( one[i] !== two[i] ){
		retval = false;
		break;
	    }
	}
    }
    return retval;
}

// Are two URLs the same.
function _link_comp(str1, str2){
    
    // Decompose links and arguments.
    var tmp1 = str1.split('?');
    var head1 = '';
    var args1 = [];
    if( ! tmp1[1] ){ // nothing before '?'
	args1 = tmp1[0].split('&');
    }else{ // normal structure
	head1 = tmp1[0];
	args1 = tmp1[1].split('&');
    }
    var sorted_args1 = args1.sort();
    
    var tmp2 = str2.split('?');
    var head2 = '';
    var args2 = [];
    if( ! tmp2[1] ){ // nothing before '?'
	args2 = tmp2[0].split('&');
    }else{ // normal structure
	head2 = tmp2[0];
	args2 = tmp2[1].split('&');
    }
    var sorted_args2 = args2.sort();
    
    // Compare heads and arguments.
    var retval = false;
    if( head1 === head2 &&
	_same_array(sorted_args1, sorted_args2) ){
	retval = true;
    }
    return retval;
}

///
/// Start unit testing.
///

describe('bbop-manager-golr', function(){

    it('1', function(){

	// Absolute basics.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	assert.equal(bbop.what_is(gm), 'bbop-manager-golr', "me");
	
	// Let's play a little like we did in the DrillExp.js demo.
	assert.equal(gm.get('rows'), 10, "default 10 rows");
	gm.set('rows', 100);
	assert.equal(gm.get('rows'), 100, "set/get 100 rows");
	
	// Does extra behave?
	var bits = "fq=-isa_partof_closure:[* TO *]";
	var url1 = gm.get_query_url();
	gm.set_extra(bits);
	var url2 = gm.get_query_url();
	gm.set_extra("");
	var url3 = gm.get_query_url();
	assert.notEqual(url1, url2, "not the same out of it");
	assert.include(url2, url1, '&' + encodeURI(bits),
		       "set_extra adds");
	assert.equal(url1, url3, "set_extra resets");
	
    });
});

describe('golr_manager - 2', function(){
    it('facets', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);

	// Let's play a little more...
	assert.sameMembers(gm.facets(), [], "no facets");
	gm.facets('foo');
	assert.sameMembers(gm.facets(), ['foo'], "one facet");
	assert.sameMembers(gm.facets('bar'), ['bar', 'foo'], "two facets");
	gm.set_personality('annotation');
	//console.log(gm.facets());
	assert.sameMembers(gm.facets(),
			   ['source',
			    'assigned_by',
			    'aspect',
			    'evidence_type_closure',
			    'panther_family_label',
			    'qualifier',
			    'taxon_label',
			    'annotation_class_label',
			    'regulates_closure_label',
			    'annotation_extension_class_closure_label'],
			   "personality");
	gm.facets([]);
	assert.sameMembers(gm.facets(), [], "no facets again");
    });
});

describe('golr manager - 3', function(){
    it('simulation', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf
	gm_ann.add_query_filter('document_category', 'annotation', ['+', '*']);
	gm_ann.add_query_filter('document_category', 'ontology_class', ['-']);
	gm_ann.add_query_filter('isa_partof_closure', 'GO:0022008', ['+', '*']);
	gm_ann.set_extra('foo=bar');

	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'fq=document_category:%22annotation%22',
				  'fq=-document_category:%22ontology_class%22',
				  'fq=isa_partof_closure:%22GO:0022008%22',
				  'q=*:*',
				  'foo=bar'].join('&'),
      				 "looks like the real thing"));
    });
});


describe('golr manager - 4', function(){

    it('new fq handling', function(){
	
        // Setup.
        var gconf = new golr_conf.conf(amigo.data.golr);
        var gm_ann = new golr_manager('http://golr.berkeleybop.org/', gconf);

	// Setup some filter set.
        gm_ann.add_query_filter('foo1', 'bar1a');
        gm_ann.add_query_filter('foo1', 'bar1b', ['+']);
        gm_ann.add_query_filter('foo2', 'bar2', ['-']);
        gm_ann.add_query_filter('foo3', 'bar3', ['+', '*']);
        gm_ann.add_query_filter('foo4', 'bar4', ['-', '*']);
	
        // Okay, now loop through the initial filters to make sure they are
        // set correctly.
        assert.sameDeepMembers(gm_ann.get_query_filters(),
			   [ { filter: 'foo1',
			       value: 'bar1a',
			       negative_p: false,
			       sticky_p: false },
			     { filter: 'foo1',
			       value: 'bar1b',
			       negative_p: false,
			       sticky_p: false },
			     { filter: 'foo2',
			       value: 'bar2',
			       negative_p: true,
			       sticky_p: false },
			     { filter: 'foo3',
			       value: 'bar3',
			       negative_p: false,
			       sticky_p: true },
			     { filter: 'foo4',
			       value: 'bar4',
			       negative_p: true,
			       sticky_p: true } ],
    			   'tried inital filter add: ');
	
        // Try and get rid of the first and third keys.
        gm_ann.remove_query_filter('foo1', 'bar1a');
        gm_ann.remove_query_filter('foo2', 'bar2');
        assert.sameDeepMembers(gm_ann.get_query_filters(),
			       [ { filter: 'foo1',
				   value: 'bar1b',
				   negative_p: false,
				   sticky_p: false },
				 { filter: 'foo3',
				   value: 'bar3',
				   negative_p: false,
				   sticky_p: true },
				 { filter: 'foo4',
				   value: 'bar4',
				   negative_p: true,
				   sticky_p: true } ],
    			       'took out 2: ');
	
        // Probe just for the stickies.
        assert.sameDeepMembers(gm_ann.get_sticky_query_filters(),
			       [ { filter: 'foo3',
				   value: 'bar3',
				   negative_p: false,
				   sticky_p: true },
				 { filter: 'foo4',
				   value: 'bar4',
				   negative_p: true,
				   sticky_p: true } ],
    			       'just stickies: ');
	
        // Then see if we can get the non-stickies out.
        gm_ann.reset_query_filters();
	gm_ann.debug(true);
	//console.log(gm_ann.query_filters);
	//console.log(gm_ann.get_query_filters());
        assert.sameDeepMembers(gm_ann.get_query_filters(),
			       [ { filter: 'foo3',
				   value: 'bar3',
				   negative_p: false,
				   sticky_p: true },
				 { filter: 'foo4',
				   value: 'bar4',
				   negative_p: true,
				   sticky_p: true } ],
    			   'only stickies left: ');
	gm_ann.debug(true);
	
        var p4 = gm_ann.get_query_filter_properties('foo4', 'bar4');
        var p5 = gm_ann.get_query_filter_properties('foo5nope', 'bar5nothinghere');
        assert.deepEqual(p4,
			 { filter: 'foo4',
			   value: 'bar4',
			   negative_p: true,
			   sticky_p: true },
			 'I see foo4/bar4');
        assert.isNull(p5, 'p5: there is nothing here');
    });
});


describe('golr manager - 5', function(){
    it('plist_to_property_hash', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);

	// Possible property hashes.
	var p1 = {
	    'negative_p': true,
	    'sticky_p': true
	};
	var p2 = {
	    'negative_p': true,
	    'sticky_p': false
	};
	var p3 = {
	    'negative_p': false,
	    'sticky_p': false
	};
	var p4 = {
	    'negative_p': false,
	    'sticky_p': true
	};

	assert.deepEqual(gm_ann.plist_to_property_hash(), p3,
			 'nothing default phash');
	assert.deepEqual(gm_ann.plist_to_property_hash([]), p3,
			 'empty default phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['+']), p3,
			 '+ default phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['+', '$']), p3,
			 '+ $ default phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['$']), p3,
			 '$ default phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['-']), p2,
			 '- phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['*']), p4,
			 '* phash');
	assert.deepEqual(gm_ann.plist_to_property_hash(['-', '*']), p1,
			 '- * phash');

    });
});

describe('golr manager - 6', function(){
    it('paging', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf

	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=*:*'].join('&'),
      				 "paging looks okay before"));
	gm_ann.page(7, 11);
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=7',
				  'start=11',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=*:*'].join('&'),
      				 "paging looks okay after"));
	gm_ann.search();
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=*:*'].join('&'),
      				 "paging resets properly"));
    });
});

describe('golr manager - 7', function(){
    it('double filter simulation', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf
	gm_ann.add_query_filter('document_category', 'annotation', ['-']);
	gm_ann.add_query_filter('document_category', 'ontology_class', ['-']);
	
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=qualifier',
				  'facet.field=panther_family_label',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'fq=-document_category:%22annotation%22',
				  'fq=-document_category:%22ontology_class%22',
				  'q=*:*'].join('&'),
      				 "looks like a correct double negative filter"));
    });
});


describe('golr manager - 8a', function(){
    it('packet counting', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);
	
	assert.equal(gm_ann.last_packet_sent(), 0, 'no packets sent');
	gm_ann.search();
	assert.equal(gm_ann.last_packet_sent(), 1, '1 packet sent');
    });
});


describe('golr manager - 8b', function(){
    it('playing with the default query', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann =
		new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf

	// Check all default.
	assert.equal(gm_ann.get_query(), "*:*", 'base default query');
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=*:*'].join('&'),
				 "default query"));

	// Try simply setting to foo.
	gm_ann.set_query("foo");
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=foo',

				  'qf=annotation_class%5E2',
				  'qf=annotation_class_label_searchable%5E1',
				  'qf=bioentity%5E2',
				  'qf=bioentity_label_searchable%5E1',
				  'qf=bioentity_name_searchable%5E1',
				  'qf=annotation_extension_class%5E2',
				  'qf=annotation_extension_class_label_searchable%5E1',
				  'qf=reference_searchable%5E1',
				  'qf=panther_family_searchable%5E1',
				  'qf=panther_family_label_searchable%5E1',
				  'qf=bioentity_isoform%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1'
				 ].join('&'),
				 "foo query"));
	assert.equal(gm_ann.get_query(), "foo", 'got query out');

	// Make sure reset works.
	gm_ann.reset_query();
	assert.equal(gm_ann.get_query(), "*:*", 'reset query safely');
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
 				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
 				  'facet.field=source',
 				  'facet.field=assigned_by',
 				  'facet.field=aspect',
 				  'facet.field=evidence_type_closure',
 				  'facet.field=panther_family_label',
 				  'facet.field=qualifier',
 				  'facet.field=taxon_label',
 				  'facet.field=annotation_class_label',
 				  'facet.field=regulates_closure_label',
     				  'facet.field=annotation_extension_class_closure_label',
     				  'q=*:*'].join('&'),
     				 "base again"));

	// Playing with default values.
	gm_ann.set_default_query("foo:bar");
	gm_ann.reset_query();
	assert.equal(gm_ann.get_query(), "foo:bar", 'new default query');
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
 				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
 				  'facet.field=source',
 				  'facet.field=assigned_by',
 				  'facet.field=aspect',
 				  'facet.field=evidence_type_closure',
 				  'facet.field=panther_family_label',
 				  'facet.field=qualifier',
 				  'facet.field=taxon_label',
 				  'facet.field=annotation_class_label',
 				  'facet.field=regulates_closure_label',
     				  'facet.field=annotation_extension_class_closure_label',
     				  'q=foo:bar',
     				  'qf=annotation_class%5E2',
     				  'qf=annotation_class_label_searchable%5E1',
     				  'qf=bioentity%5E2',
     				  'qf=bioentity_label_searchable%5E1',
     				  'qf=bioentity_name_searchable%5E1',
     				  'qf=annotation_extension_class%5E2',
     				  'qf=annotation_extension_class_label_searchable%5E1',
 				  'qf=reference_searchable%5E1',
     				  'qf=panther_family_searchable%5E1',
 				  'qf=panther_family_label_searchable%5E1',
 				  'qf=bioentity_isoform%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1'
				 ].join('&'),
     				 "q=foo:bar"));

	// Try rolling it back.
	gm_ann.reset_default_query();
	gm_ann.reset_query();
	assert.equal(gm_ann.get_query(), "*:*", 'default reset query safely');
	assert.isTrue(_link_comp(gm_ann.get_query_url(),
 				 ['http://golr.berkeleybop.org/select?defType=edismax',
 				  'qt=standard',
 				  'indent=on',
 				  'wt=json',
 				  'rows=10',
 				  'start=0',
 				  'fl=*,score',
 				  'facet=true',
 				  'facet.mincount=1',
 				  'facet.sort=count',
 				  'json.nl=arrarr',
 				  'facet.limit=25',
 				  'facet.field=source',
 				  'facet.field=assigned_by',
 				  'facet.field=aspect',
 				  'facet.field=evidence_type_closure',
 				  'facet.field=panther_family_label',
 				  'facet.field=qualifier',
 				  'facet.field=taxon_label',
 				  'facet.field=annotation_class_label',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=annotation_extension_class_closure_label',
 				  'q=*:*'].join('&'),
 				 "base again again"));

    });
});


describe('golr manager - 9', function(){
    it('debug', function(){
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.debug(false);
	assert.isFalse(gm_ann.debug(false), 'debug false');
	gm_ann.debug(true);
	assert.isTrue(gm_ann.debug(true), 'debug true');
    });
});


describe('golr manager - 10', function(){
    it('query_field (qf) and personalities', function(){

	var gconf = new golr_conf.conf(amigo.data.golr);
	var go = new golr_manager('http://golr.berkeleybop.org/', gconf);
	go.set_query('foo');
	
	assert.equal(null, go.get_personality(), 'no personality yet');

	assert.isTrue(_link_comp(go.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'q=foo'].join('&'),
				 "qf base"));
	
	go.query_field_set({'label': 2.0, 'id': 1});
	assert.isTrue(_link_comp(go.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'qf=label%5E2',
				  'qf=id%5E1',
				  'q=foo'].join('&'),
				 "qf base simple addition: no personality"));
	
	go.set_personality('ontology');
	assert.equal('ontology', go.get_personality(),
		     'personality is now ontology');
	assert.isTrue(_link_comp(go.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=subset',
				  'facet.field=regulates_closure_label',
				  'facet.field=is_obsolete',
				  'q=foo',
				  'qf=annotation_class%5E3',
				  'qf=annotation_class_label_searchable%5E5.5',
				  'qf=description_searchable%5E1',
				  'qf=comment_searchable%5E0.5',
				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
				  'qf=alternate_id%5E1'].join('&'),
				 "qf: automatic personality"));
	
	go.query_field_set({'label': 2.0, 'id': 1});
	assert.isTrue(_link_comp(go.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=subset',
				  'facet.field=regulates_closure_label',
				  'facet.field=is_obsolete',
				  'q=foo',
				  'qf=id%5E1',
				  'qf=label%5E2'].join('&'),
 				 "qf: forced reduced personality"));
	
    });
});


describe('bbop-manager-golr - 11', function(){
    it('comfy', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	//gm.set_personality('annotation'); // profile in gconf
	
	gm.set_comfy_query('fo');
	assert.equal(gm.get_query(), "fo", 'comfy: fo');
	
	gm.set_comfy_query('foo');
	assert.equal(gm.get_query(), "foo*", 'comfy: foo*');
	
	gm.set_comfy_query('fork f');
	assert.equal(gm.get_query(), "fork f*", 'comfy: fork f');
	
	gm.set_comfy_query('fork foo');
	assert.equal(gm.get_query(), "fork foo*", 'comfy: fork foo*');
	
	var cq = gm.set_comfy_query('fork foo ');
	assert.equal(gm.get_query(), "fork foo ", 'comfy: fork foo .');
	
	// Non-alphanum.
	gm.set_comfy_query('fo_k');
	assert.equal(gm.get_query(), "fo_k", 'comfy: fo_k');
	
	gm.set_comfy_query('fo_k foo');
	assert.equal(gm.get_query(), "fo_k foo", 'comfy: fo_k foo');

    });
});


describe('bbop-manager-golr - 11b: sensible_query_p', function(){

    it('nobody okay without query filter', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	
	gm.set_comfy_query('fo');
	assert.equal(gm.sensible_query_p(), false, '! sensible: "fo", no qf');
	
	gm.set_comfy_query('foo');
	assert.equal(gm.sensible_query_p(), false, '! sensible: "foo", no qf');
    });
	
    it('comfy around the perimeter', function(){

	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm.set_personality('annotation'); // profile in gconf
	//gm.add_query_filter('document_category', 'annotation', ['*']);

	gm.set_comfy_query('fo');
	assert.equal(gm.sensible_query_p(), false, '! sensible: "fo"');
	
	gm.set_comfy_query('foo');
	assert.equal(gm.sensible_query_p(), true, 'sensible: "foo"');
	
	gm.set_comfy_query('');
	assert.equal(gm.sensible_query_p(), true, 'sensible: ""');
	
	gm.set_comfy_query('*:*');
	assert.equal(gm.sensible_query_p(), true, 'sensible: "*:*"');
	
    });
});

describe('bbop-manager-golr - 12', function(){
    it('batch', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);

	// start
	assert.equal(gm.batch_urls().length, 0, 'batch: nil 1');
	assert.equal(gm.next_batch_url(), null, 'batch: nil 2');

	// add
	var foo1 = gm.add_to_batch();
	gm.set_default_query('***');
	gm.add_to_batch();
	gm.set_default_query(':::');
	gm.add_to_batch();
	assert.equal(gm.batch_urls().length, 3, 'batch: add 1');
	var foo2 = gm.next_batch_url();
	assert.equal(gm.batch_urls().length, 2, 'batch: add 2');
	// should be the standard one.
	assert.equal(foo1, foo2, 'batch: add 3');

	// reset
	gm.reset_batch();
	assert.equal(gm.batch_urls().length, 0, 'batch: nil 3');
	assert.equal(gm.next_batch_url(), null, 'batch: nil 4');

    });
});


describe('bbop-manager-golr - 13', function(){
    it('bookmark/loader - 1', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm.set_query('foo');
	
	// Notice how the query variants are all removed in the process.
	gm.load_url('?personality=ontology');
	assert.isTrue(_link_comp(gm.get_query_url(),
 				 ['http://golr.berkeleybop.org/select?facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
 				  'q=foo',
 				  'qf=annotation_class%5E3',
 				  'qf=annotation_class_label_searchable%5E5.5',
 				  'qf=description_searchable%5E1',
 				  'qf=comment_searchable%5E0.5',
 				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
 				  'qf=alternate_id%5E1'].join('&'),
 				 "load: constructed personality (1)"));
    });

    it('bookmark/loader - 2', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm.set_query('foo');
	
	// Again, notice how the query variants are all removed in the
	// process.
	gm.load_url('?personality=ontology&fq=foo:bar&q=***');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?facet.field=source',
				  'facet.field=subset',
				  'facet.field=regulates_closure_label',
				  'facet.field=is_obsolete',
				  'q=***',
				  'fq=foo:%22bar%22',
				  'qf=annotation_class%5E3',
				  'qf=annotation_class_label_searchable%5E5.5',
				  'qf=description_searchable%5E1',
				  'qf=comment_searchable%5E0.5',
				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
				  'qf=alternate_id%5E1'].join('&'),
				 "load: constructed personality (2)"));
    });

    // This time, we'll try some of the harder stuff...
    it('bookmark/loader - 3', function(){

	// Setup--a likely start.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm.set_personality('annotation');
	gm.add_query_filter('document_category', 'annotation', ['*']);
	gm.add_query_filter('assigned_by', 'MGI', ['-']);
	gm.set_query('foo');

	// Capture URL.
	var bookmark = gm.get_state_url();

	// Again, notice how the query variants are all removed in the
	// process.
	assert.isTrue(_link_comp(bookmark,
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'personality=annotation',
				  'sfq=document_category:%22annotation%22',
				  'fq=document_category:%22annotation%22',
				  'fq=-assigned_by:%22MGI%22',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=foo',
				  'qf=annotation_class%5E2',
				  'qf=annotation_class_label_searchable%5E1',
				  'qf=bioentity%5E2',
				  'qf=bioentity_label_searchable%5E1',
				  'qf=bioentity_name_searchable%5E1',
				  'qf=annotation_extension_class%5E2',
				  'qf=annotation_extension_class_label_searchable%5E1',
				  'qf=reference_searchable%5E1',
				  'qf=panther_family_searchable%5E1',
				  'qf=panther_family_label_searchable%5E1',
				  'qf=bioentity_isoform%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1'
				 ].join('&'),
				 "generated bookmark url"));

	// Okay, now let's generate a manager that recovers the correct
	// sticky state from this bookmark.
	var m2 = new golr_manager('http://golr.berkeleybop.org/', gconf);
	m2.load_url(bookmark);
	assert.isTrue(_link_comp(m2.get_state_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'personality=annotation',
				  'sfq=document_category:%22annotation%22',
				  'fq=document_category:%22annotation%22',
				  'fq=-assigned_by:%22MGI%22',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'q=foo',
				  'qf=annotation_class%5E2',
				  'qf=annotation_class_label_searchable%5E1',
				  'qf=bioentity%5E2',
				  'qf=bioentity_label_searchable%5E1',
				  'qf=bioentity_name_searchable%5E1',
				  'qf=annotation_extension_class%5E2',
				  'qf=annotation_extension_class_label_searchable%5E1',
				  'qf=reference_searchable%5E1',
				  'qf=panther_family_searchable%5E1',
				  'qf=panther_family_label_searchable%5E1',
				  'qf=bioentity_isoform%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1'
				 ].join('&'),
				 "manager state generated from bookmark url"));
    });
});


describe('bbop-manager-golr - 14', function(){
    it('unset', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	
	gm.set('foo', 'bar');     
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'foo=bar',
				  'q=*:*'].join('&'),
				 "unset: set foo"));    

	var c1 = gm.unset('foo');
	assert.isTrue(c1, 'unset: unset got true');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'q=*:*'].join('&'),
				 "unset: unset foo"));    

	var c2 = gm.unset('foo');
	assert.isFalse(c2, 'unset: unset got false');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'q=*:*'].join('&'),
				 "unset: unset foo"));
    });
});


describe('15', function(){
    it('include_highlighting', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	
	var c1 = gm.include_highlighting(false);
	assert.isFalse(c1, 'hilite: unset got false--none there');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'q=*:*'].join('&'),
				 "hilite: unset false url"));

	var c2 = gm.include_highlighting();
	assert.isFalse(c2, 'hilite: current state nothing');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'q=*:*'].join('&'),
				 "hilite: current state nothing url"));

	var c3 = gm.include_highlighting(true);
	assert.equal(c3, '<em class="hilite">', 'hilite: simple turn on');
	assert.isTrue(_link_comp(gm.get_query_url(),
				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'hl=true',
				  'hl.simple.pre=%3Cem%20class=%22hilite%22%3E',
				  'q=*:*'].join('&'),
				 "hilite: simple turn on url"));

	var c4 = gm.include_highlighting(false);
	assert.isFalse(c4, 'hilite: simple turn off');
	assert.isTrue(_link_comp(gm.get_query_url(),
 				 ['http://golr.berkeleybop.org/select?defType=edismax',
 				  'qt=standard',
 				  'indent=on',
 				  'wt=json',
 				  'rows=10',
 				  'start=0',
 				  'fl=*,score',
 				  'facet=true',
 				  'facet.mincount=1',
 				  'facet.sort=count',
 				  'json.nl=arrarr',
 				  'facet.limit=25',
 				  'q=*:*'].join('&'),
 				 "hilite: simple turn off url"));

	var c5 = gm.include_highlighting(true, '<em class="blah">');
	assert.equal(c5, '<em class="blah">', 'hilite: turn on');
	assert.isTrue(_link_comp(gm.get_query_url(),
 				 ['http://golr.berkeleybop.org/select?defType=edismax',
 				  'qt=standard',
 				  'indent=on',
 				  'wt=json',
 				  'rows=10',
 				  'start=0',
 				  'fl=*,score',
 				  'facet=true',
 				  'facet.mincount=1',
 				  'facet.sort=count',
 				  'json.nl=arrarr',
 				  'facet.limit=25',
 				  'hl=true',
 				  'hl.simple.pre=%3Cem%20class=%22blah%22%3E',
 				  'q=*:*'].join('&'),
 				 "hilite: turn on url")); 

	var c6 = gm.include_highlighting(false);
	assert.isFalse(c6, 'hilite: turn off');
	assert.isTrue(_link_comp(gm.get_query_url(),
 				 ['http://golr.berkeleybop.org/select?defType=edismax',
 				  'qt=standard',
 				  'indent=on',
 				  'wt=json',
 				  'rows=10',
 				  'start=0',
 				  'fl=*,score',
 				  'facet=true',
 				  'facet.mincount=1',
 				  'facet.sort=count',
 				  'json.nl=arrarr',
 				  'facet.limit=25',
 				  'q=*:*'].join('&'),
 				 "hilite: turn off url"));

    });
});

describe('16', function(){
    it('lite', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     

	// Trivialities.
	assert.isFalse(gm.lite(), 'no lite set yet');
	gm.set_personality('dsfsdfsdf');
	assert.isFalse(gm.lite(), 'bad lite does nothing');
	assert.isFalse(gm.lite(false), 'false to false 1');     
	assert.isFalse(gm.lite(), 'false to false 2');
	assert.isFalse(gm.lite(true), 'true/no good personality does nothing 1');
	assert.isFalse(gm.lite(), 'true/no good personality does nothing 2');
	
	// On.
	gm.set_personality('ontology');
	assert.isFalse(gm.lite(), 'defined personality not enough');
	assert.isTrue(gm.lite(true), 'okay, this is sufficient for lite 1');
	assert.isTrue(gm.lite(), 'okay, this is sufficient for lite 2');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
				  'fl=annotation_class,description,source,synonym,alternate_id,annotation_class_label,score,id',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=subset',
				  'facet.field=regulates_closure_label',
				  'facet.field=is_obsolete',
     				  'q=*:*'].join('&'),
     				 "liteness on for ontology on"));

	// Toggle.
	assert.isFalse(gm.lite(false), 'toggle lite off 1');
	assert.isFalse(gm.lite(), 'toggle lite off 2');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
 				  'facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
     				  'q=*:*'].join('&'),
     				 "liteness on for ontology off"));

    });
});

describe('17', function(){
    it('facet limits', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     

	// Trivialities.
	assert.equal(gm.get_facet_limit(), 25, 'limit: std limit');
	assert.equal(gm.get_facet_limit('foo'), null,
		     'limit: no field limit');
	assert.isTrue(gm.reset_facet_limit(), 'limit: can always reset all');
	assert.isFalse(gm.reset_facet_limit('foo'), 'limit: cannot reset nothing');
	
	// Change limit, then reset it.
	assert.isTrue(gm.set_facet_limit(5), 'limit: global to 5 success');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=5',
     				  'q=*:*'].join('&'),
     				 "limit: global to 5"));
	assert.equal(gm.get_facet_limit(), 5, 'limit: limited to 5');
	assert.equal(gm.get_facet_limit('foo'), null,
		     'limit: still no field limit');
	assert.isTrue(gm.reset_facet_limit(), 'limit: can always reset all');
	assert.isFalse(gm.reset_facet_limit('foo'), 'limit: cannot reset nothing');
	assert.equal(gm.get_facet_limit(), 25, 'limit: reset std limit');
	assert.equal(gm.get_facet_limit('foo'), null,
 		     'limit: again no field limit');
	
	// Change limit and field limit, then reset it.
	assert.isTrue(gm.set_facet_limit(10), 'limit: global to 10 success');
	assert.isTrue(gm.set_facet_limit('foo', 1), 'limit: foo to 1 success');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=10',
     				  'f.foo.facet.limit=1',
     				  'q=*:*'].join('&'),
     				 "limit: global to 10, foo to 1"));
	assert.equal(gm.get_facet_limit(), 10, 'limit: limited to 10');
	assert.equal(gm.get_facet_limit('foo'), 1, 'limit: foo to 1');
	
	assert.isTrue(gm.reset_facet_limit('foo'), 'limit: foo reset');
	assert.equal(gm.get_facet_limit(), 10, 'limit: limited to 10');
	assert.equal(gm.get_facet_limit('foo'), null,
 		     'limit: foo gone again');
	
	assert.isTrue(gm.reset_facet_limit(), 'limit: can always reset all, again');
	assert.equal(gm.get_facet_limit(), 25,
 		     'limit: reset std limit, again');
	assert.equal(gm.get_facet_limit('foo'), null,
 		     'limit: again no field limit, again');

	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=*:*'].join('&'),
     				 "limit: all back to normal"));
    });
});


describe('download - 18', function(){
    it('get download url (easy)', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	
	// Trivialities.
	// We should round trip back to where we came from.
	var start_url = gm.get_query_url();
	var dl_url = gm.get_download_url(['foo', 'bar']);
	var end_url = gm.get_query_url();     
	assert.isTrue(_link_comp(start_url, end_url, "dl 1: start and end at same place"));
	assert.isTrue(_link_comp(dl_url,
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=foo,bar',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'csv.encapsulator=',
				  'csv.separator=%09',
				  'csv.header=false',
				  'csv.mv.separator=%7C',
     				  'q=*:*'].join('&'),
     				 "dl 1: proper url"));
	
    });

    it('get download url (hard)', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	gm.set_personality('ontology');
	gm.add_query_filter('abc', 'def');
	gm.set_query("***");

	// Harder.
	// We should round trip back to where we came from.
	var start_url = gm.get_query_url();
	var dl_url = gm.get_download_url(['foo', 'bar']);
	var end_url = gm.get_query_url();
	assert.isTrue(_link_comp(start_url, end_url, "dl 2: start and end at same place"));
	assert.isTrue(_link_comp(dl_url,
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=foo,bar',
     				  'facet=true',
     				  'facet.mincount=1',
     				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'csv.encapsulator=',
     				  'csv.separator=%09',
     				  'csv.header=false',
     				  'csv.mv.separator=%7C',
     				  'fq=abc:%22def%22',
     				  'facet.field=source',
     				  'facet.field=subset',
     				  'facet.field=regulates_closure_label',
     				  'facet.field=is_obsolete',
     				  'q=***',
     				  'qf=annotation_class%5E3',
     				  'qf=annotation_class_label_searchable%5E5.5',
     				  'qf=description_searchable%5E1',
     				  'qf=comment_searchable%5E0.5',
     				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
     				  'qf=alternate_id%5E1'].join('&'),
     				 "dl 2: proper url"));
	
    });

    it('get download url (session and negative)', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	gm.set_personality('ontology');
	gm.add_query_filter('foo', 'bar', ['-']);
	gm.add_query_filter('123', '456', ['*']);
	gm.add_query_filter('abc', 'def', ['*', '-']);

	// Harder.
	// We should round trip back to where we came from.
	var start_url = gm.get_query_url();
	var dl_url = gm.get_download_url(['id1', 'id2']);
	var end_url = gm.get_query_url();
	assert.isTrue(_link_comp(start_url, end_url, "dl 3: start and end at same place"));
	assert.isTrue(_link_comp(dl_url,
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=id1,id2',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'csv.encapsulator=',
				  'csv.separator=%09',
				  'csv.header=false',
				  'csv.mv.separator=%7C',
				  'fq=-foo:%22bar%22',
				  'fq=123:%22456%22',
				  'fq=-abc:%22def%22',
 				  'facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
     				  'q=*:*'].join('&'),
     				 "dl 3: proper url"));

	assert.equal(3, gm.get_query_filters().length,
		     "dl 3: 3 filters");
	assert.equal(2, gm.get_sticky_query_filters().length,
		     "dl 3: 2 sticky filters");

	// bbop.dump(gm.get_query_filters())

    });
});


describe('21', function(){
    it('query field add', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	gm.set_personality('ontology');
	gm.set_query('***');
	gm.add_query_field('foo', 5.0);

	var dl_url = gm.get_download_url(['foo', 'bar']);
	assert.isTrue(_link_comp(dl_url,
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=foo,bar',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'csv.encapsulator=',
				  'csv.separator=%09',
				  'csv.header=false',
				  'csv.mv.separator=%7C',
 				  'facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
     				  'q=***',
				  'qf=annotation_class%5E3',
				  'qf=annotation_class_label_searchable%5E5.5',
				  'qf=description_searchable%5E1',
				  'qf=comment_searchable%5E0.5',
				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
				  'qf=foo%5E5',
				  'qf=alternate_id%5E1'].join('&'),
     				 "q field add: proper url"));
	
    });
});

describe('22', function(){
    it('manipulating the results count', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     

	// Trivialities--get and reset.
	assert.equal(gm.get_results_count(), 10, 'count: std count');
	assert.equal(gm.reset_results_count(), 10, 'count: reset does beans');
	assert.equal(gm.get_results_count(), 10, 'count: std count again');
	
	// Change count, then reset it.
	assert.equal(gm.set_results_count(25), 25, 'count: global to 25');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=25',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=*:*'].join('&'),
     				 "count: global to 25 in URL"));
	assert.equal(gm.get_results_count(), 25, 'count: shifted to 25');
	assert.equal(gm.reset_results_count(), 10, 'count: and back down');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=*:*'].join('&'),
     				 "count: return global to 10 in URL"));
	
    });
});


describe('23', function(){
    it('set_id and set_ids', function(){
	
	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	// Just something to clobber for giggles.
	gm.set_query('foo');
	
	// set_id
	gm.set_id('MGI:MGI:1');
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=id:%22MGI:MGI:1%22'].join('&'),
     				 "set_id: just fine"));
	
	// set_ids
	gm.set_ids(['MGI:MGI:1', 'MGI:MGI:2']);
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=id:(%22MGI:MGI:1%22%20OR%20%22MGI:MGI:2%22)'].join('&'),
     				 "set_ids: just fine"));

    });
});


describe('24', function(){
    it('another type of bookmarking, input/output', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf
	gm_ann.add_query_filter_as_string('document_category:annotation', ['*']);
	gm_ann.add_query_filter_as_string('+document_category:ontology_class', []);
	gm_ann.add_query_filter_as_string('-isa_partof_closure:GO:0022008', ['*']);

	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'fq=document_category:%22annotation%22',
				  'fq=document_category:%22ontology_class%22',
				  'fq=-isa_partof_closure:%22GO:0022008%22',
				  'q=*:*'].join('&'),
      				 "added query filters as strings"));

	assert.isTrue(_link_comp('/?' + gm_ann.get_filter_query_string(),
				 ['/?q=*:*',
				  'fq=document_category:%22ontology_class%22',
				  'sfq=document_category:%22annotation%22',
				  'sfq=-isa_partof_closure:%22GO:0022008%22'].join('&'),
				 "reads out as RESTy bookmark"));
	
    });

    it('same as above, but use implied empy argument', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm_ann = new golr_manager('http://golr.berkeleybop.org/', gconf);
	gm_ann.set_personality('annotation'); // profile in gconf
	gm_ann.add_query_filter_as_string('document_category:annotation', ['*']);
	gm_ann.add_query_filter_as_string('+document_category:ontology_class');
	gm_ann.add_query_filter_as_string('-isa_partof_closure:GO:0022008', ['*']);

	assert.isTrue(_link_comp(gm_ann.get_query_url(),
      				 ['http://golr.berkeleybop.org/select?defType=edismax',
				  'qt=standard',
				  'indent=on',
				  'wt=json',
				  'rows=10',
				  'start=0',
				  'fl=*,score',
				  'facet=true',
				  'facet.mincount=1',
				  'facet.sort=count',
				  'json.nl=arrarr',
				  'facet.limit=25',
				  'facet.field=source',
				  'facet.field=assigned_by',
				  'facet.field=aspect',
				  'facet.field=evidence_type_closure',
				  'facet.field=panther_family_label',
				  'facet.field=qualifier',
				  'facet.field=taxon_label',
				  'facet.field=annotation_class_label',
				  'facet.field=regulates_closure_label',
				  'facet.field=annotation_extension_class_closure_label',
				  'fq=document_category:%22annotation%22',
				  'fq=document_category:%22ontology_class%22',
				  'fq=-isa_partof_closure:%22GO:0022008%22',
				  'q=*:*'].join('&'),
      				 "added query filters as strings"));

	assert.isTrue(_link_comp('/?' + gm_ann.get_filter_query_string(),
				 ['/?q=*:*',
				  'fq=document_category:%22ontology_class%22',
				  'sfq=document_category:%22annotation%22',
				  'sfq=-isa_partof_closure:%22GO:0022008%22'].join('&'),
				 "reads out as RESTy bookmark"));
	
    });
});


// Necessary for bulk search locking
describe('25', function(){
    it('set_targets', function(){
	
	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);
	// Just something to clobber for giggles.
	// gm.set_query('foo');
	
	// set target docs
	gm.set_targets(['id1', 'id2'],['f1', 'f2']);
	assert.isTrue(_link_comp(gm.get_query_url(),
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=json',
     				  'rows=10',
     				  'start=0',
     				  'fl=*,score',
     				  'facet=true',
     				  'facet.mincount=1',
     				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
     				  'q=f1:(%22id1%22%20OR%20%22id2%22)%20OR%20f2:(%22id1%22%20OR%20%22id2%22)'].join('&'),
     				 "set_targets: 2x2"));

    });
});

describe('playing with get_download_url', function(){

    it('switch', function(){

	// Setup.
	var gconf = new golr_conf.conf(amigo.data.golr);
	var gm = new golr_manager('http://golr.berkeleybop.org/', gconf);     
	gm.set_personality('ontology');
	gm.set_query('***');
	gm.add_query_field('foo', 5.0);

	var dl_url = gm.get_download_url(['foo', 'bar']);
	assert.isTrue(_link_comp(dl_url,
     				 ['http://golr.berkeleybop.org/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=foo,bar',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'csv.encapsulator=',
				  'csv.separator=%09',
				  'csv.header=false',
				  'csv.mv.separator=%7C',
 				  'facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
     				  'q=***',
				  'qf=annotation_class%5E3',
				  'qf=annotation_class_label_searchable%5E5.5',
				  'qf=description_searchable%5E1',
				  'qf=comment_searchable%5E0.5',
				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
				  'qf=foo%5E5',
				  'qf=alternate_id%5E1'].join('&'),
     				 "download url before"));
	

	dl_url = gm.get_download_url(['foo', 'bar'], {
	    'golr_download_url': 'http://foo.com/solr/'
	});
	assert.isTrue(_link_comp(dl_url,
     				 ['http://foo.com/solr/select?defType=edismax',
     				  'qt=standard',
     				  'indent=on',
     				  'wt=csv',
     				  'rows=1000',
     				  'start=0',
     				  'fl=foo,bar',
     				  'facet=true',
     				  'facet.mincount=1',
				  'facet.sort=count',
     				  'json.nl=arrarr',
     				  'facet.limit=25',
				  'csv.encapsulator=',
				  'csv.separator=%09',
				  'csv.header=false',
				  'csv.mv.separator=%7C',
 				  'facet.field=source',
 				  'facet.field=subset',
 				  'facet.field=regulates_closure_label',
 				  'facet.field=is_obsolete',
     				  'q=***',
				  'qf=annotation_class%5E3',
				  'qf=annotation_class_label_searchable%5E5.5',
				  'qf=description_searchable%5E1',
				  'qf=comment_searchable%5E0.5',
				  'qf=synonym_searchable%5E1',
				  'qf=regulates_closure%5E1',
				  'qf=regulates_closure_label_searchable%5E1',
				  'qf=foo%5E5',
				  'qf=alternate_id%5E1'].join('&'),
     				 "download url after"));
	
    });
});

