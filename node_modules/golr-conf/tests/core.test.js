////
//// Some unit testing for package bbop-golr.
////
//// Note that these tests use the data current in amigo2 as the test
//// set--these will need to be updated to stay in sync.
////

var us = require('underscore');

// Test stuff
var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;

// Correct environment, ready testing.
var bbop = require('bbop-core');
var amigo = require('amigo2');
var golr_conf = require('..');

///
/// Start unit testing.
///

// 
describe('golr-conf.conf_field', function(){

    it('1', function(){

	// Absolute basics.
	var fconf = amigo.data.golr['ontology']['fields_hash']['source'];
	var cf = new golr_conf.conf_field(fconf);
	assert.equal(cf._is_a, 'golr-conf.conf_field', "me");
	
	// Simple getters.
	assert.equal("Ontology source", cf.display_name(), "display_name");
	assert.equal("Term namespace.",
		     cf.description(), "field desc");
	assert.equal("source", cf.id(), "id");
	assert.equal(false, cf.searchable(), "searchable");
	assert.equal(false, cf.required(), "required");
	assert.equal(false, cf.is_multi(), "multi?");
	//assert.equal(false, cf.has_handler(), "handler?");
	assert.equal(false, cf.is_fixed(), "fixed?");
	assert.equal("getNamespace", cf.property(), "prop");
    });

});


describe('golr-conf.conf_class', function(){

    it('1', function(){

	// Absolute basics.
	var cc = new golr_conf.conf_class(amigo.data.golr['annotation']);
	assert.equal(cc._is_a, 'golr-conf.conf_class', "me");
	
	// Simple getters.
	assert.equal("Annotations", cc.display_name(), "display_name");
	assert.equal("Associations between GO terms and genes or gene products.",
		     cc.description(), "ann class desc");
	assert.equal(20, cc.weight(), "w");
	assert.equal("annotation", cc.id(), "id");
	assert.equal('_searchable', cc.searchable_extension(),
     		     "searchable_extension");
	
	// More complicated.
	assert.equal(null, cc.get_field('blork'), "s1");
	assert.equal('source', cc.get_field('source').id(), "s2");

	// Make sure we got all the fields.
	assert.equal(43, cc.get_fields().length, "can get all fields");
	
	// Look at weights individually.
	var boosts = cc.get_weights('boost');
	assert.equal(2.0, boosts['bioentity'], "boost 1");
	assert.equal(null, boosts['ashdlas'], "no boost");

	// Look at weights as a group.
	var ordered_filter_list_7 = cc.field_order_by_weight('filter', 5.0);
	assert.equal(7, ordered_filter_list_7.length, "ofl7 len");
	assert.deepEqual(ordered_filter_list_7,
		     ['source', 'assigned_by', 'aspect',
		      'evidence_type_closure', 'panther_family_label',
		      'qualifier', 'taxon_label'],
		     "ofl7 first");
	var ordered_filter_list_all = cc.field_order_by_weight('filter');
	assert.equal(10, ordered_filter_list_all.length, "ofla len");
	assert.equal('source', ordered_filter_list_all[0], "ofla first");

    });
});


describe('top-level golr-conf.conf', function(){

    it('1', function(){

	// Absolute basics.
	var c = new golr_conf.conf(amigo.data.golr);
	assert.equal(c._is_a, 'golr-conf.conf', "me");

	// Simple getters.
	assert.equal("Ontology", c.get_class('ontology').display_name(),
		     "display_name");
	// ont, assoc, bio, family, general, term_ac, ann_ev_agg, lego
	assert.equal(8, c.get_classes().length, "num classes");

	// Make sure that we get them ordered.
	// Check with: "grep weight: metadata/*.yaml".
	var ordered_classes = c.get_classes_by_weight();
	assert.equal(8, ordered_classes.length, "got a bunch");
	assert.equal('ontology', ordered_classes[0].id(), "first class");
	assert.equal('bbop_ann_ev_agg', ordered_classes[7].id(), "last class");

    });
});
