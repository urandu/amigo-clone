=head1 AmiGO::WebApp::FacetMatrix

...

=cut

package AmiGO::WebApp::FacetMatrix;
use base 'AmiGO::WebApp';

use Clone;
use Data::Dumper;
use CGI::Application::Plugin::Session;
use CGI::Application::Plugin::TT;
use AmiGO::Input;
use AmiGO::External::HTML::Wiki::BBOPJS;

##
sub setup {

  my $self = shift;

  # ## Configure how the session stuff is going to be handled when and
  # ## if it is necessary.
  $self->{STATELESS} = 1;
  # $self->{STATELESS} = 0;
  # $self->session_config(CGI_SESSION_OPTIONS =>
  # 			["driver:File",
  # 			 $self->query,
  # 			 {Directory=>
  # 			  $self->{CORE}->amigo_env('AMIGO_SESSIONS_ROOT_DIR')}
  # 			],
  # 			COOKIE_PARAMS => {-path  => '/'},
  # 			SEND_COOKIE => 1);

  # ## Templates.
  # $self->tt_include_path($self->{CORE}->amigo_env('AMIGO_ROOT') .
  # 			 '/templates/html');

  $self->mode_param('mode');
  $self->start_mode('facet_matrix');
  $self->error_mode('mode_fatal');
  $self->run_modes(
		   'facet_matrix'    => 'mode_facet_matrix',
		   'AUTOLOAD' => 'mode_exception'
		  );
}


## Maybe how things should look in this framework?
sub mode_facet_matrix {

  my $self = shift;

  ## Incoming template.
  my $i = AmiGO::Input->new($self->query());
  my $params = $i->input_profile('facet_matrix');
  $self->_common_params_settings($params);

  ## 
  my $facet1 = $params->{facet1};
  my $facet2 = $params->{facet2};
  my $manager = $params->{manager};

  if( ! $facet1 ){
    $self->add_mq('warning', "The parameter \"facet1\" needs to be defined.");
  }
  if( ! $facet2 ){
    $self->add_mq('warning', "The parameter \"facet2\" needs to be defined.");
  }
  if( ! $manager ){
    $self->add_mq('warning', "The parameter \"manager\" needs to be defined.");
  }

  ## Page settings.
  $self->set_template_parameter('page_title',
				'Facet Matrix');
  $self->set_template_parameter('content_title',
				#'Facet Matrix: Compare Facet Counts');
				'Compare Facet Counts');

  ## Only attempt launch if everything is fine.
  if( $facet1 && $facet2 && $manager ){
    my $prep =
      {
       css_library =>
       [
	#'standard',
	'com.bootstrap',
	'com.jquery.jqamigo.custom',
	'amigo',
	'bbop'
       ],
     javascript_library =>
       [
	'org.d3',
	'com.jquery',
	'com.bootstrap',
	'com.jquery-ui',
	'com.jquery.tablesorter'
       ],
       javascript =>
       [
	$self->{JS}->make_var('global_facet1', $facet1),
	$self->{JS}->make_var('global_facet2', $facet2),
	$self->{JS}->make_var('global_manager', $manager),
	$self->{JS}->get_lib('GeneralSearchForwarding.js'),
	$self->{JS}->get_lib('FacetMatrix.js')
       ],
       content =>
       [
	'pages/facet_matrix.tmpl'
       ]
      };
    $self->add_template_bulk($prep);
    $output = $self->generate_template_page_with();
    return $output;
  }else{
    return $self->mode_fatal("Not enough information to bootstrap process.");
  }
}



1;
