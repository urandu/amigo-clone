////
//// Render pretty numbers!
////

// Let jshint pass over over our external globals (browserify takes
// care of it all).
/* global jQuery */
/* global global_statistics_cache */
/* global Plotly */

var us = require('underscore');
var bbop = require('bbop-core');
var widgets = require('bbop-widget-set');
var html = widgets.html;

// Config.
var amigo = new (require('amigo2-instance-data'))(); // no overload
var golr_conf = require('golr-conf');
var gconf = new golr_conf.conf(amigo.data.golr);
var sd = amigo.data.server;
var gserv = amigo.data.server.golr_base;
var gserv_download = amigo.data.server.golr_download_base;
var defs = amigo.data.definitions;
// Linker.
var linker = amigo.linker;
// Handler.
var handler = amigo.handler;
// Management.
var jquery_engine = require('bbop-rest-manager').jquery;
var golr_manager = require('bbop-manager-golr');
var golr_response = require('bbop-response-golr');

function BasePageInit(){    
    // Use jQuery UI to tooltip-ify doc.
    var tt_args = {'position': {'my': 'left bottom', 'at': 'right top'}};
    jQuery('.bbop-js-tooltip').tooltip(tt_args);
}

function BaseStatisticsInit(){

    var glob = global_statistics_cache;

    ///
    /// Annotation \ species | exp/non-exp
    ///
    
    (function(){

	var exp_trace = {
	    x: [],
	    y: [],
	    name: 'Experimental',
	    type: 'bar'
	};

	var nonexp_trace = {
	    x: [],
	    y: [],
	    name: 'Non-experimental',
	    type: 'bar'
	};
	
	// Okay, create some tracks.
	us.each(glob['species_of_interest'], function(spec){
	    var lbl = spec[0];
	    var id = spec[1];

	    // Add axis label.
	    exp_trace.x.unshift(lbl);
	    nonexp_trace.x.unshift(lbl);

	    // Add data.
	    exp_trace.y.unshift(glob.annotations.species_with_exp[id]);
	    nonexp_trace.y.unshift(glob.annotations.species_with_nonexp[id]);
	});

	var data = [exp_trace, nonexp_trace];
	
	var layout = {
	    title: 'Experimental annotations by species',
	    barmode: 'stack',
	    xaxis: {
		title: 'Species',
		autorange: 'reversed'
	    },
	    yaxis: {
		title: 'Annotations'
	    }
	};
	
	Plotly.newPlot('graph01', data, layout);

    })();

    ///
    /// Annotation \ assigners | exp/non-exp
    ///

    (function(){

	var exp_trace = {
	    x: [],
	    y: [],
	    name: 'Experimental',
	    type: 'bar'
	};

	var nonexp_trace = {
	    x: [],
	    y: [],
	    name: 'Non-experimental',
	    type: 'bar'
	};
	
	// Okay, create some tracks.
	us.each(glob['assigners_of_interest'], function(src){

	    // Add axis label.
	    exp_trace.x.unshift(src);
	    nonexp_trace.x.unshift(src);

	    // Add data.
	    exp_trace.y.unshift(glob.annotations.assigners_with_exp[src]);
	    nonexp_trace.y.unshift(glob.annotations.assigners_with_nonexp[src]);
	});

	var data = [exp_trace, nonexp_trace];
	
	var layout = {
	    title: 'Experimental annotations by assigner',
	    barmode: 'stack',
	    xaxis: {
		title: 'Assigners',
		autorange: 'reversed',
		tickfont: {
		    // 12, 10, 9 too big
		    size: 8
		}
	    },
	    yaxis: {
		title: 'Annotations'
	    }
	};
	
	Plotly.newPlot('graph02', data, layout);

    })();

    ///
    /// Annotation \ evidence
    ///

    (function(){

	var ev_trace = {
	    x: [],
	    y: [],
	    name: 'Evidence',
	    type: 'bar'
	};

	// Okay, create some tracks.
	us.each(glob['evidence_of_interest'], function(ev){

	    // Add axis label.
	    ev_trace.x.unshift(ev);

	    // Add data.
	    ev_trace.y.unshift(glob.annotations.evidence[ev]);
	});

	var data = [ev_trace];
	
	var layout = {
	    title: 'Annotations by evidence',
	    barmode: 'stack',
	    xaxis: {
		title: 'Evidence type',
		autorange: 'reversed'
	    },
	    yaxis: {
		title: 'Annotations'
	    }
	};
	
	Plotly.newPlot('graph03', data, layout);

    })();

    ///
    /// Annotation \ species | aspect | evidence
    ///

    (function(){

	var data = [];
	
	// Okay, create some tracks.
	us.each(glob['evidence_of_interest'], function(ev){
	    
	    // There will only be #ev "traces" here.
	    var ev_trace = {
		x: [],
		y: [],
		name: ev,
		type: 'bar'
	    };

	    us.each(glob['species_of_interest'], function(spc){
		var slbl = spc[0];
		var sid = spc[1];
	    
		us.each(['P', 'F', 'C'], function(aspect){
		    
		    // Add axis label.
		    ev_trace.x.unshift(aspect + ': ' + slbl);

		    // Add data.
		    ev_trace.y.unshift(glob.annotations.species_by_evidence_by_aspect[sid][ev][aspect]);
		});

	    });

	    // Onto data stack.
	    data.unshift(ev_trace);
	});

	var layout = {
	    title: 'Annotations by aspect/species by evidence',
	    barmode: 'stack',
	    xaxis: {
		title: 'Aspect: Species',
		autorange: 'reversed',
		tickfont: {
		    // 12, 10 too big; 9 okay right now
		    size: 8
		}
	    },
	    yaxis: {
		title: 'Annotations'
	    }
	};
	
	Plotly.newPlot('graph04', data, layout);

    })();

    ///
    /// Experimental annotation pub \ assigner
    ///

    (function(){

	var pub_trace = {
	    x: [],
	    y: [],
	    name: 'Experimental annotation publications',
	    type: 'bar'
	};

	// Okay, create some tracks.
	us.each(glob['assigners_of_interest'], function(src){

	    // Add axis label.
	    pub_trace.x.unshift(src);

	    // Add data.
	    pub_trace.y.unshift(glob.publications.assigners_with_exp[src]);
	});

	var data = [pub_trace];
	
	var layout = {
	    title: 'Experimental annotation publications by assigner',
	    barmode: 'stack',
	    xaxis: {
		title: 'Assigner',
		autorange: 'reversed',
		tickfont: {
		    // 12, 10 too big; 9 okay right now
		    size: 8
		}
	    },
	    yaxis: {
		title: 'Publications'
	    }
	};
	
	Plotly.newPlot('graph05', data, layout);

    })();

}

///
/// A slightly more complicated starter: don't start unless we got the
/// goods passed in from the server.
///

// Embed the jQuery setup runner.
(function (){
    jQuery(document).ready(function(){
	BasePageInit();
	if( us.isObject(global_statistics_cache) &&
	    ! us.isEmpty(global_statistics_cache) ){
	    BaseStatisticsInit();
	}
    });
})();
