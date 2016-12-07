////
//// Some unit testing for class-expression.
////
//// Usage (rhino):
//// : rhino -modules external/bbop.js -modules staging/bbopx.js -opt 1 -f lib/bbopx/minerva/class_expression.js -f lib/bbopx/minerva/class_expression.js.tests -f -
////
//// Usage (node, test only):
//// : make bundle && NODE_PATH=external:staging node lib/bbopx/minerva/class_expression.js.tests
////
//// Usage (node, interactive debugging):
//// : make bundle && TEST=lib/bbopx/minerva/class_expression.js.tests NODE_PATH=external:staging:lib/bbopx/minerva node -e "eval(require('fs').readFileSync(process.env.TEST)+''); require('repl').start('> ')"
////

var chai = require('chai');
chai.config.includeStack = true;
var assert = chai.assert;

var us = require('underscore');
var each = us.each;

var class_expression = new require('..');


describe('basic operations', function(){

    it('probe empty', function(){

	var ce = new class_expression();
	
	assert.isTrue(ce.id().length === 36,
		      'id is like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	assert.isFalse(ce.nested_p(), 'not nested');
	
	assert.equal(ce.category(), 'unknown', 'graphically a mystery');
	assert.isNull(ce.type(), 'instance of nope');

	assert.isNull(ce.class_id(), 'has no simple ID');
	assert.isNull(ce.class_label(), 'has no label');

	assert.isNull(ce.svf_class_expression(), 'nope SVF');
	assert.isNull(ce.property_id(), 'nope pid');
	assert.isNull(ce.property_label(), 'nope plbl');

	try {
	    ce.structure();
	    assert.equal(true, false, 'should never get here');
	}catch(e){	
	    assert.equal(null, null, 'attempts at structure explode');
	}

    });

    // Simple testing of simple properties, over three types of
    // constructors.
    it('multiple constructors', function(){

	var ce1 = new class_expression('GO:123');
	var ce2 = new class_expression({'type': 'class', 'id': 'GO:123' });
	var ce3 = new class_expression(new class_expression('GO:123'));

	// Make sure that all constructors behave as expected.
	each([ce1, ce2, ce3], function(ce, i){

	    assert.isTrue(ce.id().length === 36,
			  '['+i+'] like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	    assert.isFalse(ce.nested_p(), '['+i+'] not nested');
	    
	    assert.equal(ce.category(), 'instance_of',
			 '['+i+'] graphically, is a simple class');
	    assert.equal(ce.type(), 'class', '['+i+'] instance is type "class"');
	    
	    assert.equal(ce.class_id(), 'GO:123', '['+i+'] has a simple ID');
	    assert.equal(ce.class_label(), 'GO:123', '['+i+'] has a label');
	    
	    assert.isNull(ce.svf_class_expression(), '['+i+'] not SVF');
	    assert.isNull(ce.property_id(), '['+i+'] no pid');
	    assert.isNull(ce.property_label(), '['+i+'] no plbl');
	    
	    assert.deepEqual(ce.structure(), {'type': 'class', 'id': 'GO:123' },
			     '['+i+'] correct trivial structure');

	});
	
    });
    
});

describe('more operations', function(){

    it('try SVF after the fact', function(){

	var ce = new class_expression(null);
	ce.as_svf('RO:456', 'GO:123');
	
	assert.isTrue(ce.id().length === 36,
		     '[ssvf] id is like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	assert.isTrue(ce.nested_p(), '[ssvf] svf always a little nested');
	assert.equal(ce.category(), 'RO:456',
		     '[ssvf] graphically, is a simple class');
	assert.equal(ce.type(), 'svf', '[ssvf] instance is type of svf');
	
	assert.isNull(ce.class_id(), '[ssvf] has null ID--nested');
	assert.isNull(ce.class_label(), '[ssvf] has null label--nested');
	
	assert.deepEqual(ce.svf_class_expression().structure(),
			 { type: 'class', id: 'GO:123' },
			 '[ssvf] nested simple');
	assert.equal(ce.property_id(), 'RO:456', '[ssvf] has property id');
	assert.equal(ce.property_label(), 'RO:456', '[ssvf] had property lbl');
	
	assert.deepEqual(ce.structure(),
			 {
			     'type': 'svf',
			     'property': {
				 'type': 'property',
				 'id': 'RO:456'
			     },
			     'filler': {
				 'type': 'class',
				 'id': 'GO:123'
			     }
			 },
			 '[ssvf] correct trivial structure');    
    });

    it('try an after-the-fact intersection', function(){

	var ce = new class_expression();
	ce.as_set('intersection',
    		  ['GO:123', new class_expression('GO:456')]);
	
	assert.isTrue(ce.id().length === 36,
    		     '[sint] id is like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	assert.isTrue(ce.nested_p(), '[sint] sets always a little nested');
	
	assert.equal(ce.category(), 'intersection', '[sint] graphically, is nested');
	assert.equal(ce.type(), 'intersection', '[sint] instance is type of intersection');
	
	assert.isNull(ce.class_id(), '[sint] has null ID--nested');
	assert.isNull(ce.class_label(), '[sint] has null label--nested');
	
	assert.isNull(ce.svf_class_expression(), '[sint] not svf here');
	assert.isNull(ce.property_id(), '[sint] has no property id');
	assert.isNull(ce.property_label(), '[sint] has no property lbl');
	
	assert.deepEqual(
	    ce.structure(),
    	    {
    		'type': 'intersection',
    		'expressions': [
    		    {
    			'type': 'class',
    			'id': 'GO:123'
    		    },
    		    {
    			'type': 'class',
    			'id': 'GO:456'
    		    }
    		]
    	    },
    	    '[sint] correct trivial structure');
    });

    it('intersection nested into SVF', function(){

	var int_ce = new class_expression();
	int_ce.as_set('intersection', ['GO:123', 'GO:456']);
	var ce = new class_expression();
	ce.as_svf('RO:123', int_ce);

	assert.isTrue(ce.id().length === 36,
    		     '[svf(int)] id is like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	assert.isTrue(ce.nested_p(), '[svf(int)] sets always a little nested');
	
	assert.equal(ce.category(), 'RO:123', '[svf(int)] graphically a relation');
	assert.equal(ce.type(), 'svf', '[svf(int)] instance is type of svf');
	
	assert.isNull(ce.class_id(), '[svf(int)] has null ID--nested');
	assert.isNull(ce.class_label(), '[svf(int)] has null label--nested');
	
	assert.equal(ce.svf_class_expression().type(), 'intersection',
		     '[svf(int)] has svf ce');
	assert.equal(ce.property_id(), 'RO:123', '[svf(int)] has a property id');
	assert.equal(ce.property_label(), 'RO:123', '[svf(int)] has a property label');
	
	assert.deepEqual(
	    ce.structure(),
	    {
		"type": "svf",
		"property": {
		    'type': "property",
		    'id': "RO:123"
		},
		"filler": {
		    'type': 'intersection',
		    "expressions": [
			{
			    "type": "class",
			    "id": "GO:123"
			},
			{
			    "type": "class",
			    "id": "GO:456"
			}
				 ]
		}
	    },
	    '[svf(int)] correct nested structure');
	
    });
});

describe('free peanuts', function(){

    it("they're complementary", function(){

	var int_ce = new class_expression();
	int_ce.as_set('intersection', ['GO:123', 'GO:456']);
	var ce = new class_expression();
	ce.as_complement(int_ce);
	
	assert.isTrue(ce.id().length === 36,
    		      '[complement(int)] id is like 8ccbf846-d7e8-4d86-9e5c-0b48827d178d');
	assert.isTrue(ce.nested_p(), '[complement(int)] sets always a little nested');
	
	assert.equal(ce.category(), 'complement', '[complement(int)] graphically itself');
	assert.equal(ce.type(), 'complement', '[complment(int)] instance is type of complement');
	
	assert.isNull(ce.class_id(), '[complement(int)] has null ID--nested');
	assert.isNull(ce.class_label(), '[complement(int)] has null label--nested');
	
	assert.equal(ce.complement_class_expression().type(), 'intersection',
		     '[complement(int)] has complement ce');
	
	assert.deepEqual(
	    ce.structure(),
	    {
		"type": "complement",
		"filler": {
		    'type': 'intersection',
		    "expressions": [
			{
			    "type": "class",
			    "id": "GO:123"
			},
			{
			    "type": "class",
			    "id": "GO:456"
			}
		    ]
		}
	    },
	    '[complement(int)] correct nested structure');

    });
});
    
describe('expressing ourselves', function(){

    it("strings representations (! intersection)", function(){

	var int_ce = new class_expression();
	int_ce.as_set('intersection', ['GO:123', 'GO:456']);
	var ce = new class_expression();
	ce.as_complement(int_ce);
	
	assert.equal(ce.to_string(), '![intersection[2]]');
    });
    
    it("strings representations (svf intersection)", function(){

	var int_ce = new class_expression();
	int_ce.as_set('intersection', ['GO:123', 'GO:456']);
	var ce = new class_expression();
	ce.as_svf('RO:123', int_ce);

	assert.equal(ce.to_string(), 'svf[RO:123](intersection[2])');
    });
});

describe('writers', function(){

    it('take a look at the basic string writer', function(){

	var ce = new class_expression('GO:0022008');
	
	assert.equal(ce.class_id(), 'GO:0022008', 'id is string');
	assert.equal(ce.class_label(), 'GO:0022008', 'label is string');
	assert.equal(ce.to_string(), 'GO:0022008', 'string is string');
	assert.equal(ce.to_string_plus(), 'GO:0022008', 'extra is string');

    });

    it('ouput of more complicated entity', function(){

	var ce = new class_expression({
	    type: 'class',
	    id: 'GO:0022008',
	    label: 'neurogenesis'
	});
	
	assert.equal(ce.class_id(), 'GO:0022008', 'id is string');
	assert.equal(ce.class_label(), 'neurogenesis', 'label is string');
	assert.equal(ce.to_string(), 'neurogenesis', 'string is string');
	assert.equal(ce.to_string_plus(), '[GO:0022008] neurogenesis',
		     'extra is string');

    });

});

// // Toy REPL.
// (function(){

//     var union = class_expression.union;
//     var intersection = class_expression.intersection;
//     var svf = class_expression.svf;
//     var cls = class_expression.cls;

//     var x = svf(intersection([cls('GO:123'), 'GO:456']), 'RO:789');
//     assert.equal(x.structure(),
// 	 {
// 	     "type": "restriction",
// 	     "property": {
// 		 "type": "property",
// 		 "id": "RO:789"
// 	     },
// 	     "svf": [
// 		 {
// 		     'type': 'intersection',
// 		     "expressions": [
// 			 {
// 			     "type": "class",
// 			     "id": "GO:123"
// 			 },
// 			 {
// 			     "type": "class",
// 			     "id": "GO:456"
// 			 }
// 		     ]
// 		 }
// 	     ]
// 	 },
// 	 '[static functions] correct nested structure');

// })();
