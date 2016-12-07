/*
 * Package: amigo2-instance-server
 * 
 * This package was automatically created during AmiGO 2 installation.
 * 
 * Purpose: Useful information about GO and the AmiGO installation.
 *          Also serves as a repository and getter for web
 *          resources such as images.
 * 
 * NOTE: This file is generated dynamically at installation time.
 *       Hard to work with unit tests--hope it's not too bad.
 *       Want to keep this real simple.
 */

// All of the server/instance-specific meta-data.
var meta_data = {"js_base":"http://37.34.54.74:9999/static/js","beta":"1","species":[],"bbop_img_star":"http://37.34.54.74:9999/static/images/star.png","term_regexp":"all|SDGIO:[0-9]{7}","gp_types":[],"golr_base":"http://37.34.54.74:8983/solr/","sources":[],"evidence_codes":{},"css_base":"http://37.34.54.74:9999/static/css","browse_filter_idspace":"SDGIO","galaxy_base":"http://galaxy.berkeleybop.org/","noctua_base":"http://noctua.berkeleybop.org/","html_base":"http://37.34.54.74:9999/static","image_base":"http://37.34.54.74:9999/static/images","root_terms":[{"label":"sustainable development goal","id":"SDGIO:00000000"}],"js_dev_base":"http://37.34.54.74:9999/static/staging","ontologies":[],"app_base":"http://37.34.54.74:9999","species_map":{},"golr_bulk_base":"http://37.34.54.74:8983/solr/"};

/*
 * Constructor: server
 * 
 * The configuration for the server settings.
 * Essentially a JSONification of the config.pl AmiGO 2 file.
 * 
 * Arguments:
 *  n/a
 */
var server = {

    ///
    /// Da chunk...
    ///

    meta_data: meta_data,

    ///
    /// Break out the data and various functions to access them...
    ///

    /*
     * Function: sources
     * 
     * Access to AmiGO variable sources.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    sources: meta_data.sources,

    /*
     * Function: app_base
     * 
     * Access to AmiGO variable app_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    app_base: meta_data.app_base,

    /*
     * Function: term_regexp
     * 
     * Access to AmiGO variable term_regexp.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    term_regexp: meta_data.term_regexp,

    /*
     * Function: noctua_base
     * 
     * Access to AmiGO variable noctua_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    noctua_base: meta_data.noctua_base,

    /*
     * Function: golr_base
     * 
     * Access to AmiGO variable golr_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    golr_base: meta_data.golr_base,

    /*
     * Function: golr_bulk_base
     * 
     * Access to AmiGO variable golr_bulk_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    golr_bulk_base: meta_data.golr_bulk_base,

    /*
     * Function: evidence_codes
     * 
     * Access to AmiGO variable evidence_codes.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    evidence_codes: meta_data.evidence_codes,

    /*
     * Function: root_terms
     * 
     * Access to AmiGO variable root_terms.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  object
     */
    root_terms: meta_data.root_terms,

    /*
     * Function: beta
     * 
     * Access to AmiGO variable beta.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    beta: meta_data.beta,

    /*
     * Function: html_base
     * 
     * Access to AmiGO variable html_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    html_base: meta_data.html_base,

    /*
     * Function: gp_types
     * 
     * Access to AmiGO variable gp_types.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    gp_types: meta_data.gp_types,

    /*
     * Function: browse_filter_idspace
     * 
     * Access to AmiGO variable browse_filter_idspace.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    browse_filter_idspace: meta_data.browse_filter_idspace,

    /*
     * Function: species_map
     * 
     * Access to AmiGO variable species_map.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    species_map: meta_data.species_map,

    /*
     * Function: js_base
     * 
     * Access to AmiGO variable js_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    js_base: meta_data.js_base,

    /*
     * Function: species
     * 
     * Access to AmiGO variable species.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    species: meta_data.species,

    /*
     * Function: js_dev_base
     * 
     * Access to AmiGO variable js_dev_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    js_dev_base: meta_data.js_dev_base,

    /*
     * Function: galaxy_base
     * 
     * Access to AmiGO variable galaxy_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    galaxy_base: meta_data.galaxy_base,

    /*
     * Function: css_base
     * 
     * Access to AmiGO variable css_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    css_base: meta_data.css_base,

    /*
     * Function: bbop_img_star
     * 
     * Access to AmiGO variable bbop_img_star.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    bbop_img_star: meta_data.bbop_img_star,

    /*
     * Function: ontologies
     * 
     * Access to AmiGO variable ontologies.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    ontologies: meta_data.ontologies,

    /*
     * Function: image_base
     * 
     * Access to AmiGO variable image_base.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  string
     */
    image_base: meta_data.image_base,
};

///
/// Exportable body.
///

module.exports = server;
