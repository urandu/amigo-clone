=head1 AmiGO

This is the core AmiGO class. It is responsible for simple error
handling, environment (including config.pl variables), and getting in
all of the install-time DB meta data. Most other tasks should be left
to subclasses.

TODO: Perhaps simple error should be taken out and the Messaging stuff
should be core in here. Then again, maybe it should just be left as
the internal fault checker...maybe an array instead of just the last
error message?

TODO: This should all be made ENV safe. Should this core file should
still behave well in a non-installed AmiGO environment; all core
functions having non-env overrides?

=cut

package AmiGO;

## Try to get the local environment sane. This is necessary for *any*
## operation, so we're really going to die.
BEGIN {
  ## The "if" is necessary for using in-place make commands and the
  ## like, places where it won't affect the run and the config.pl file
  ## does not (yet) exist.
  require "config.pl" if -f "config.pl" ;
}


## Bring in necessaries.
use utf8;
use strict;
use POSIX qw(strftime floor);
use Data::Dumper;

use URI::Escape;
#use JSON;
#use JSON::PP;
use JSON::XS;
use File::Slurp;
use Data::UUID;
use List::Util 'shuffle';

## Trying to work with YAML.
use Config::YAML;

## File type guessing games.
#use File::MMagic;
use File::Type;
use FileHandle;

use FreezeThaw qw(freeze thaw);


## TODO: Make sure that the variables that must be defined for a sane
## environment are defined.


=item new

Constr.

=cut
sub new {

  ##
  my $class = shift;
  my $self = {};

  ## Internal JSON libraries; choose between the XS and pure perl.
  if( 0 == 1 ){
    # $self->{JSON} = JSON->new();
    # $self->{JSON_TRUE} = JSON::true;
    # $self->{JSON_FALSE} = JSON::false;
  }else{
    #$self->{JSON_PP} = JSON::PP->new();
    # $self->{JSON_TRUE} = JSON::PP::true;
    # $self->{JSON_FALSE} = JSON::PP::false;
    # $self->{JSON}->allow_bignum(1);
    $self->{JSON} = JSON::XS->new();
    $self->{JSON_TRUE} = JSON::XS::true;
    $self->{JSON_FALSE} = JSON::XS::false;
    #$self->{JSON}->allow_bignum(1); # if needed, go back to ::PP
  }

  $self->{UUID_SOURCE} = Data::UUID->new();

  ## Internal caching.
  $self->{MISC_KEYS} = undef;
  $self->{SPECIES} = undef;
  $self->{SOURCE} = undef;
  $self->{GPTYPE} = undef;
  $self->{ONTOLOGY} = undef;
  $self->{SUBSET} = undef;
  $self->{DB_INFO} = undef;
  $self->{EVCODES} = undef;
  $self->{RELATIONS} = undef;
  $self->{RELEASE_NAME} = undef;
  $self->{RELEASE_TYPE} = undef;
  $self->{GOOGLE_ANALYTICS_ID} = undef;

  ## Standard internal error checking.
  $self->{ERROR_MESSAGE} = undef;

  ## Logging verbosity.
  $self->{VERBOSE} = int(amigo_env($self, 'AMIGO_VERBOSE') || '0');
  #print STDERR "___" . $self->{VERBOSE} . "\n";

  bless $self, $class;
  return $self;
}


###
### Resource reader.
###

# =item read_config_resource

# Returns a hash object with the correct defaults from the GOlr config files.

# =cut
# sub read_config_resource {

#   my $self = shift;
# }


###
### GO database connection.
###


=item db_connector

Returns an array for connecting to the database described in the GO_*
environment.

NOTE: MySQL only.

DEPRECATED?

=cut
sub db_connector {

  my $self = shift;

  my $check = sub {
    my $str = shift || '';
    my $retval = 0;
    if( $ENV{$str} && defined($ENV{$str}) &&  length($ENV{$str}) ){
      $retval = 1;
    }
    return $retval;
  };

  my @mbuf = ();
  if( &$check('GO_DBSOCKET') ){
    push @mbuf, 'mysql_socket=' . $ENV{GO_DBSOCKET};
  }
  if( &$check('GO_DBNAME') ){
    push @mbuf, 'database=' . $ENV{GO_DBNAME};
  }
  if( &$check('GO_DBHOST') ){
    push @mbuf, 'host=' . $ENV{GO_DBHOST};
  }
  if( &$check('GO_DBPORT') ){
    push @mbuf, 'port=' . $ENV{GO_DBPORT};
  }
  my $dsn = join ';', @mbuf;
  $dsn = 'dbi:mysql:' . $dsn;

  $self->kvetch("dsn " . $dsn);

  ##
  my $retref = [];
  push @$retref, $dsn;

  ## Credentials and add them to the return.
  # $ENV{GO_DBPASS};
  push @$retref, $ENV{GO_DBUSER};
  push @$retref, $ENV{GO_DBAUTH};

  return @$retref;
}


###
### General convenience.
###


=item html_safe

Arguments: string
Returns: HTML-safe escaped string

Stolen from CGI.pm with some modification. It is disappointingly small.

TODO: This can be more extensive. Much more extensive.

=cut
sub html_safe {

  my $self = shift;
  my $string = shift || '';

  $string =~ s{&}{&amp;}gso;
  $string =~ s{<}{&lt;}gso;
  $string =~ s{>}{&gt;}gso;
  $string =~ s{"}{&quot;}gso;
  #%23 is a # (hash)
  #$string =~ s{\ }{%20}gso;
  #$string =~ s{\n}{\ }gso;
  #   my $latin = uc $self->{'.charset'} eq 'ISO-8859-1' ||
  #     uc $self->{'.charset'} eq 'WINDOWS-1252';
  #   if ($latin) {  # bug in some browsers
  #     $string =~ s{'}{&#39;}gso;
  #     $string =~ s{\x8b}{&#8249;}gso;
  #     $string =~ s{\x9b}{&#8250;}gso;
  #     if (defined $newlinestoo && $newlinestoo) {
  #       $string =~ s{\012}{&#10;}gso;
  #       $string =~ s{\015}{&#13;}gso;
  #     }
  #   }
  return $string;
}


=item html_break_safe

Arguments: string
Returns: HTML string with spaces converted to "&nbsp;"

=cut
sub html_break_safe {

  my $self = shift;
  my $string = shift || '';

  $string =~ s/\s/\&nbsp\;/g;

  return $string;
}


=item unique_id

Arguments: n/a
Returns: A universally unique id (a string) for any use.

=cut
sub unique_id {

  my $self = shift;
  return $self->{UUID_SOURCE}->to_string( $self->{UUID_SOURCE}->create() );
}


=item uri_safe

Arguments: string
Returns: uri-safe escaped string

=cut
sub uri_safe {

  my $self = shift;
  my $string = shift || '';
  return uri_escape($string);
}


=item term_regexp

Return: a term-matching regexp.

=cut
sub term_regexp {

  my $self = shift;
  my $rstr = $self->amigo_env('AMIGO_TERM_REGEXP');
  return qr/$rstr/;
}


=item is_term_acc_p

Return: 0 or 1 on string input

=cut
sub is_term_acc_p {

  my $self = shift;
  my $str = shift || "";
  my $regexp = $self->amigo_env('AMIGO_TERM_REGEXP');
  return $str =~ /$regexp/;
}


=item term_regexp_string

Return: a string that can be used to compile a term-matching regexp.

=cut
sub term_regexp_string {
  my $self = shift;
  return $self->amigo_env('AMIGO_TERM_REGEXP');
}


=item dbxref_db_regexp_string

Return: a string that can be used to compile a regexp that matches a
dbxref database name.

=cut
sub dbxref_db_regexp_string {
  my $self = shift;
  return '[\w\d\-\_\.\/]+';
}


=item dbxref_key_regexp_string

Return: a string that can be used to compile a regexp that matches a
dbxref database key.

=cut
sub dbxref_key_regexp_string {
  my $self = shift;
  return '[\w\d\:\-\_\.\/\(\)\+\,\'\\\[\]\|\?]+';
}


=item clean_term_list

Arg: a string with or without whitespace defining one or more go ids
Return: a clean aref of go term ids.

=cut
sub clean_term_list {

  my $self = shift;

  my $in_str = shift || '';
  my @ret_list = ();

  ## Fish out all of the good terms in the string.
  #my $regexp = $self->term_regexp_string();
  my $regexp = "[\:\_A-Za-z0-9]+\:[0-9]+";
  @ret_list = $in_str =~ /($regexp)/g;

  $self->kvetch("" . scalar(@ret_list));

  return \@ret_list;
}


=item clean_list

Arg: a string with or without whitespace defining one or more ids
Return: a clean aref of ids.

=cut
sub clean_list {

  my $self = shift;

  my $in_str = shift || '';
  my @ret_list = ();

  ## TODO: is there a more robust detection possible like in the case
  ## (above) of terms?
  #@ret_list = split(' ', $in_str);
  $in_str =~ s/^[\r\s]+//;
  $in_str =~ s/[\r\s]+$//;
  $in_str =~ s/[\r\s]+/\n/g;
  @ret_list = split /\s+/, $in_str;

  #$self->kvetch("" . scalar(@ret_list));

  return \@ret_list;
}


=item split_gene_product_acc

Arg: a gene product string
Return: an array with dbname first and key second

=cut
sub split_gene_product_acc {

  my $self = shift;

  my $in_str = shift || '';
  #my @ret_list = ();

  ## Assemble regexp from variables.
  my $db = $self->dbxref_db_regexp_string();
  my $key = $self->dbxref_key_regexp_string();

  ##
  $in_str =~ /^($db)\:($key)$/;
  # $self->kvetch("$1:$2");
  return ($1, $2);
}


=item atoi

Anything to integer
from perliac

=cut
sub atoi {

  my $self = shift;
  my $t = 0;
  foreach my $d (split(//, shift())) {
    $t = $t * 10 + $d;
  }
  return $t;
}


###
### Environment.
###

=item google_analytics_id

Arguments: /
Returns: empty string, or the google analytics id string

Searches for the existance of a google analytics file (.analytics.json) in the cgi directory. if found, read in the file and extract the id.

=cut
sub google_analytics_id {

  my $self = shift;

  my $retval = '';

  ## Use the cache if it is there. And keep trying (if somebody
  ## changes it after install).
  if( ! defined $self->{GOOGLE_ANALYTICS_ID} ||
      defined $self->{GOOGLE_ANALYTICS_ID} eq '' ){
    $self->{GOOGLE_ANALYTICS_ID} =
      $self->amigo_env('google_analytics_id') || '';
  }

  return $self->{GOOGLE_ANALYTICS_ID};
}


=item amigo_env

Gets an environmental variable, including (and specically for)
variables designated in config.pl.

Arguments: name string/<>
Returns: value string/hash pointer

=cut
sub amigo_env {
  my $self = shift;
  my $var = shift;

  my $retval = undef;
  if ( $var && defined($ENV{uc('AMIGO_' . $var)})) {
    $retval = $ENV{uc('AMIGO_' . $var)};
  }elsif ( $var && defined($ENV{uc('GO_' . $var)})) {
    $retval = $ENV{uc('GO_' . $var)};
  }elsif ( $var && defined($ENV{uc($var)})) {
    ## A "nice" fallback.
    $retval = $ENV{uc($var)};
  }elsif ( ! defined($var) ){
    ## Fallback and try and find old "GO_"-style variables.
    $retval = {};
    foreach my $k (%ENV){
      if( $k =~ /^GO_(.+)/ ){
	$retval->{$1} = $ENV{$k};
      }
    }
  }

  return $retval;
}


###
### Messages and verbosity.
###


=item verbose_p

Whether or not the AMIGO_VERBOSE variable has been set.

Return 1 or 0;

=cut
sub verbose_p {

  my $self = shift;
  my $retval = 0;
  $retval = 1 if defined($self->{VERBOSE}) && $self->{VERBOSE};
  return $retval;
}

=item current_time

Returns: the current local time as a string.

=cut
sub current_time {
  my $self = shift;
  my $now = POSIX::strftime("%H:%M:%S", localtime);
  return $now;
}

=item kvetch

Prints a message to STDERR if AMIGO_VERBOSE is set.
If the log/kvetch.log files exists, it writes to that instead.

Arguments: message string, bool (for 1 second pause, useful for
console debugging)
Returns: t if message written, nil otherwise.

=cut
sub kvetch {
  my $self = shift;
  my $message = shift || '';
  my $pause = shift || 0;

  ## Only do stuff on verbose.
  my $retval = 1;
  if( $self->verbose_p() ){


    my $now = $self->current_time();

    ## Add paerent caller package to top of message if
    ## possible. Otherwise, as much as we can...
    my $final_str = "";
    #my $caller = (caller(1))[0];
    my $subroutine = (caller(1))[3];
    #if( defined $caller || defined $subroutine ){
    if( defined $subroutine
	&& $subroutine ne ''
	&& $subroutine ne '::' ){
      #$caller = '?' if ! defined $caller;
      #$subroutine = '?' if ! defined $subroutine;
      #$final_str = "[$now] $caller" . '::' . "$subroutine: $message\n";
      $final_str = "[$now] $subroutine: $message\n";
    }else{
      $final_str = "[$now] $message\n";
    }

    ## File logging handling.
    my $ald = $self->amigo_env('AMIGO_LOG_DIR') || '';
    my $log = $ald . '/kvetch.log';
    if( -f $log && -w $log ){
      eval{
	my $fh = FileHandle->new(">>$log");
	$fh->autoflush(1);
	$fh->print($final_str);
	undef $fh;
      };
      if( $@ ){
	$retval = 0;
	# print STDERR "AmiGO: kvetch: $@";
      }
    }else{
      ## Log to console/STDERR.
      print STDERR $final_str;
    }

    ## Pause if we want.
    sleep 1 if $pause;
  }

  return $retval;
}


###
### HTTP
###


sub status_error_client{ print "Status: 400 Bad Request\n"; }
sub status_error_server{ print "Status: 500 Internal Server Error\n"; }
sub html_header{ print "content-type:text/html\n\n"; }
sub tab_header{ print "content-type:text/plain\n\n"; }
sub xml_header{ print "content-type:text/xml\n\n"; }
sub unknown_header{ print "content-type:unknown\n\n"; }


###
### Cross-references.
###


## Make sure that our info is read and cached.
sub _ensure_xref_data {
  my $self = shift;
  ## Revive the cache from the JSON if we don't have it.

  if( ! defined($self->{DB_INFO}) ){
    ## Populate our hash.  First, look for the file--this toggle is
    ## used because of the relative path differences between apache
    ## and the static server.
    my $json_path = 'xrefs.json';
    if( ! -r $json_path ){
      $json_path = $self->amigo_env('AMIGO_DYNAMIC_PATH') . '/' . 'xrefs.json';
    }

    my($ret_hash) = _read_json_file($self, $json_path);
    $self->{DB_INFO} = $ret_hash || {};
    #print STDERR "_init_...\n";
    #print STDERR "_keys: " . scalar(keys %$ret_hash) . "\n";
  }
}

=item database_link

Args: database id, entity id
Returns: URL string

=cut
sub database_link {

  my $self = shift;
  my $db = shift || '';
  my $id = shift || '';

  #$self->kvetch("_db_" . $db);
  #$self->kvetch("_id_" . $id);

  # ## WARNING
  # ## TODO: Temporary Reactome special case. This should be removeable
  # ## in a couple of months when Reactome has entirely switched over to
  # ## satable ids...
  # ## Stable id:
  # ## http://www.reactome.org/cgi-bin/link?SOURCE=Reactome&ID=REACT_604
  # ## DB id:
  # ## http://www.reactome.org/cgi-bin/eventbrowser?DB=gk_current&ID=10046
  # # $self->kvetch("Reactome test: $db $id");
  # if( $db =~ /^reactome$/i && $id =~ /^[0-9]+$/i ){
  # $self->kvetch("looks like a Reactome db id--special case!");
  # return 'http://www.reactome.org/cgi-bin/eventbrowser?DB=gk_current&ID='.$id;
  # }

  ## Revive the cache from the JSON if we don't have it.
  $self->_ensure_xref_data();

  #$self->kvetch("DB_INFO: " . Dumper($self->{DB_INFO}));

  ## Get the link string through the cache.
  $db = lc($db);
  my $retval = undef;
  if( defined $self->{DB_INFO}{$db} ){

    my $link_string = $self->{DB_INFO}{$db}{url_syntax};

    #print STDERR "_Ls_ $link_string\n";

    ## Insert the id through the link string if one was available.
    if( $link_string ){
      # ## Special case for UniGene?
      # if( $db eq lc('UniGene') ){
      # 	## Split id on '.'. First part goes to
      # 	## [organism_abbreviation], second part goes to [cluster_id].
      # 	my($first, $second) = split(/\./, $id);
      # 	$link_string =~ s/\[organism\_abbreviation\]/$first/g;
      # 	$link_string =~ s/\[cluster\_id\]/$second/g;
      # }else{
      $link_string =~ s/\[example\_id\]/$id/g;
      # }
      $retval = $link_string;
    }
  }

  return $retval;
}

=item database_bulk

Args: n/a
Returns: hashref keyed on database id for database xref info

=cut
sub database_bulk {

  my $self = shift;

  ## Revive the cache from the JSON if we don't have it.
  $self->_ensure_xref_data();

  ## Copy it out.
  my $ret = {};
  foreach my $db (keys %{$self->{DB_INFO}}){
    $ret->{$db} =
      {
       id => $self->{DB_INFO}{$db}{id} || $db,
       abbreviation => $self->{DB_INFO}{$db}{abbreviation} || undef,
       name => $self->{DB_INFO}{$db}{name} || undef,
       fullname => $self->{DB_INFO}{$db}{fullname} || undef,
       datatype => $self->{DB_INFO}{$db}{datatype} || undef,
       database => $self->{DB_INFO}{$db}{database} || undef,
       object => $self->{DB_INFO}{$db}{object} || undef,
       example_id => $self->{DB_INFO}{$db}{example_id} || undef,
       generic_url => $self->{DB_INFO}{$db}{generic_url} || undef,
       url_syntax => $self->{DB_INFO}{$db}{url_syntax} || undef,
       url_example => $self->{DB_INFO}{$db}{url_example} || undef,
       uri_prefix => $self->{DB_INFO}{$db}{uri_prefix} || undef,
      };
  }

  #print STDERR Dumper($ret);

  return $ret;
}

=item database_link_set

Args: list of database IDs
Returns: list if hashes structured like [{id: "db:id", link: "http://url"}, ...]

=cut
sub database_link_set {

  my $self = shift;
  my $dbids = shift || [];
  my $retlist = [];

  foreach my $dbid (@$dbids){

    my($db, $id) = $self->split_gene_product_acc($dbid);

    #$self->kvetch('FOO dbid: ' . $dbid);
    #$self->kvetch('FOO db: ' . $db);
    #$self->kvetch('FOO id: ' . $id);

    push @$retlist,
      {
       id => $dbid,
       dbname => $db,
       key => $id,
       link => $self->database_link($db, $id)
      };
  }

  return $retlist;
}


###
### Linking within AmiGO.
###


## Fuse a hash into a URL.
sub _fuse_hash {

  my $self = shift;
  my $in_hash = shift || {};
  my $retstr = '';

  if( defined $in_hash->{action} &&
      defined $in_hash->{arguments} ){

    ##
    my $hash = $in_hash->{arguments};
    my @buf = ();
    foreach my $i (keys %$hash){

      ##
      if( ref($hash->{$i}) eq 'ARRAY' ){
	foreach my $a (@{$hash->{$i}}){
	  push @buf, $i . '=' . $a;
	}
      }else{
	push @buf, $i . '=' . $hash->{$i};
      }
    }

    ##
    #$retstr = $in_hash->{action} . '?' . join('&', @buf);
    # $self->uri_safe(join('&', @buf));
    my $tstr = join('&', @buf);
    #$tstr =~ s{\ }{%20}gso;
    $retstr = $in_hash->{action} . '?' . $tstr;
  }

  return $retstr;
}


## Fuse a hash into a URL.
sub _fuse_arguments {

  my $self = shift;
  my $in_hash = shift || {};
  my $retstr = '';

  my $hash = $in_hash;
  my @buf = ();
  foreach my $i (keys %$hash){

    ##
    if( ref($hash->{$i}) eq 'ARRAY' ){
      foreach my $a (@{$hash->{$i}}){
	push @buf, $i . '=' . $a;
      }
    }else{
      push @buf, $i . '=' . $hash->{$i};
    }
  }

  ##
  my $tstr = join('&', @buf);
  $retstr = $tstr;

  return $retstr;
}


=item get_interlink

Gets an environmental variable, including (and specically for)
variables designated in config.pl.

Arguments: ex: {mode=>'homolset_graph', arg=>{set=>1, format=>'png'}}
Returns: string for an href

Other args: public=>(0|1) # use the public url instead of local installation
            full=>(0|1) # return the complete url instead of the local one
            hash=>(0|1) # returns a hash of all args instead of string
     Both of the above default to 0.
            html_safe
            frag # optional fragment identifier

NOTE: Not all interlinks sanely support the hash argument yet.

=cut
## You'll want to take a look at the code--the main set is separated
## from the "exp" set.
sub get_interlink {

  my $self = shift;
  my $arg_hash = shift || {};
  my $ilink = '';
  my $ihash = {};

  ## Mode extant?
  my $mode = undef;
  if( defined $arg_hash->{mode} ) {
    $mode = $arg_hash->{mode};
  }
  die "interlink requires a 'mode' argument" if ! defined $mode;

  ## Optional extant? Override the defaults if they are defined.
  my $optional_public_p = 0; # Give the public URL.
  my $optional_full_p = 1; # Give the full URL instead of just the partial.
  # my $optional_url_safe_p = 0; # Return a URL safe string.
  my $optional_html_safe_p = 1; # Return an HTML safe string (defaults to 1).
  my $optional_hash_p = 0; # Are we more interested in the args (for
                           # form generation)?
  my $optional_frag = ''; # Do we want a fragment at the end?
  if( defined $arg_hash->{optional} ) {
    $optional_public_p = $arg_hash->{optional}{public}
      if defined $arg_hash->{optional}{public};
    $optional_full_p = $arg_hash->{optional}{full}
      if defined $arg_hash->{optional}{full};
    #$optional_uri_safe_p = $arg_hash->{optional}{url_safe}
    #  if defined $arg_hash->{optional}{url_safe};
    $optional_html_safe_p = $arg_hash->{optional}{html_safe}
      if defined $arg_hash->{optional}{html_safe};
    $optional_hash_p = $arg_hash->{optional}{hash}
      if defined $arg_hash->{optional}{hash};
    $optional_frag = $arg_hash->{optional}{frag}
      if defined $arg_hash->{optional}{frag};
  }

  ## A hash may be more clear than a switch at this point...
  my $args = $arg_hash->{arg};
  my %fun_hash =
    (

     ## First, things that are in the main app set...the trivially
     ## called pages.
     'landing' => sub { $ilink = 'amigo/landing'; },
     'tools' => sub { $ilink = 'amigo/software_list'; },
     'schema_details' => sub { $ilink = 'amigo/schema_details'; },
     'load_details' => sub { $ilink = 'amigo/load_details'; },
     'owltools_details' => sub { $ilink = 'amigo/owltools_details'; },
     'browse' => sub { $ilink = 'amigo/browse'; },
     'dd_browse' => sub { $ilink = 'amigo/dd_browse'; },
     'base_statistics' => sub { $ilink = 'amigo/base_statistics'; },
     'free_browse' => sub { $ilink = 'amigo/free_browse'; },
     'goose' => sub { $ilink = 'goose'; },
     'grebe' => sub { $ilink = 'grebe'; },
     'gannet' => sub { $ilink = 'gannet'; },
     'repl' => sub { $ilink = 'repl'; },
     'xrefs' => sub { $ilink = 'xrefs'; },
     'rte' => sub { $ilink = 'rte'; },

     'gp_details' =>
     sub {
       die "interlink mode 'gp_details' requires args" if ! defined $args;
       my $gp = $args->{gp} || '';
       my $acc = $args->{acc} || undef;
       my $db = $args->{db} || undef;
       if( defined($acc) && defined($db) ){
	 $gp = $db . ':' . $acc;
       }
       #$ilink = 'amigo?mode=gene_product&gp=' . $gp;
       $ilink = 'amigo/gene_product/' . $gp;
     },

     'reference_details' =>
     sub {
	 die "interlink mode 'reference_details' requires args"
	     if ! defined $args;
	 die "interlink mode 'reference_details' requires ref arg"
	     if ! defined $args->{'ref'};
	 my $rid = $args->{'ref'} || '';
	 $ilink = 'amigo/reference/' . $rid;
     },

     'model_details' =>
     sub {
       die "interlink mode 'model_details' requires args" if ! defined $args;
       my $acc = $args->{acc} || undef;
       #$ilink = 'amigo?mode=gene_product&gp=' . $gp;
       $ilink = 'amigo/model/' . $acc;
     },

     # 'term_subset' =>
     # sub {
     #   die "interlink mode 'term-subset' requires args" if ! defined $args;
     #   my $acc = $args->{acc} || '';
     #   my $sid = $args->{session_id} || '';
     #   $ilink = 'term_details?term=' .
     # 	 #$self->html_safe($acc) . '&session_id=' . $sid;
     # 	 $acc . '&session_id=' . $sid;
     # },

     ##
     'term_details_base' =>
     sub {
       $ilink = 'amigo/term';
     },

     ## NOTE: Should now be the same as term-details.
     'term_details' =>
     sub {
       die "interlink mode 'term_details' requires args" if ! defined $args;
       my $acc = $args->{acc} || '';
       #$ilink = 'term_details?term=' . $acc;
       #$ilink = 'amigo?mode=term&term=' . $acc;
       $ilink = 'amigo/term/' . $acc;
     },

     ##
     'phylo_graph' =>
     sub {
       #die "interlink mode 'phylo_graph' requires args" if ! defined $args;
       #my $gp = $args->{gp} || '';
       #my $acc = $args->{acc} || undef;
       #my $db = $args->{db} || undef;
       # if( defined($acc) && defined($db) ){
       # 	 $gp = $db . ':' . $acc;
       # }
       #$ilink = 'amigo?mode=phylo_graph&gp=' . $gp;
       #$ilink = 'amigo/phylo_graph/' . $gp;
       $ilink = 'amigo/phylo_graph';
     },

     # ## Slightly different than the others.
     # 'gaffer' =>
     # sub {
     #  my $gmode = $args->{mode} || die 'need mode';
     #  my $gurl = $args->{url} || die 'need url';
     #  $ilink = 'gaffer?mode=' . $gmode . '&data_url=' . $self->uri_safe($gurl);
     # },

     ## The various visualize clients, now part of VisualizeServer
     ## instead of AmiGO proper (prevent horrible redirect problems).
     'visualize_client_freeform' => sub { $ilink = 'visualize?mode=client_freeform';},
     'visualize_client_amigo' => sub { $ilink = 'visualize?mode=client_amigo'; },

     ## The actual visualize services.
     'visualize_service_freeform' =>
     sub {
       #print STDERR Dumper($arg_hash);
       my $term_data = $args->{term_data} || '';
       my $graph_data = $args->{graph_data} || '';
       my $format = $args->{format} || 'png';

       my $final_term_data = $term_data;
       my $final_graph_data = $graph_data;
       if( ! $optional_hash_p ){
	 $final_term_data = $self->uri_safe($term_data);
	 $final_graph_data = $self->uri_safe($graph_data);
       }
       $ihash = {
		 action => 'visualize',
		 arguments =>
		 {
		  mode => 'freeform',
		  inline => 'false',
		  format => $format,
		  graph_data => $final_graph_data,
		  term_data => $final_term_data,
		 },
		};
       $ilink = $self->_fuse_hash($ihash);
       # $ilink = 'amigo/visualize/' .
       # 	 $self->_fuse_arguments($ihash->{arguments});
     },
     ## The actual "visualize" is more a call to the data server.
     'visualize_service_amigo' =>
     sub {
       #print STDERR Dumper($arg_hash);
       my $data = $args->{data} || '';
       my $data_type = $args->{data_type} || 'string';
       my $format = $args->{format} || 'png';

       my $final_data = $data;
       if( ! $optional_hash_p ){
	 $final_data = $self->uri_safe($data);
       }
       $ihash = {
		 action => 'visualize',
		 arguments =>
		 {
		  mode => 'amigo',
		  inline => 'false',
		  format => $format,
		  term_data_type => $data_type,
		  term_data => $final_data,
		  #term_data => $self->uri_safe($data),
		  #term_data => $data, # going through hash, not uri
		 },
		};
       $ilink = $self->_fuse_hash($ihash);
       # $ilink = 'amigo/visualize/' .
       # 	 $self->_fuse_arguments($ihash->{arguments});
     },

     ## Takes an array ref of term ids.
     'visualize_service_term_list' =>
     sub {
       my $in_terms = $args->{terms} || [];

       my $final_data = $self->uri_safe(join(' ', @$in_terms));
       $ihash = {
		 action => 'visualize',
		 arguments =>
		 {
		  mode => 'amigo',
		  inline => 'false',
		  format => 'png',
		  term_data_type => 'string',
		  term_data => $final_data,
		 },
		};

       $ilink = $self->_fuse_hash($ihash);
     },

     'visualize_service_simple' =>
     sub {
       my $engine = $args->{engine} || '';
       my $term = $args->{term} || '';
       my $inline = $args->{inline} || 'false';
       my $beta = $args->{beta} || '0';
       $ihash = {
		 action => 'visualize',
		 arguments =>
		 {
		  mode => $engine,
		  inline => $inline,
		  term => $term,
		  beta => $beta,
		 },
		};

       $ilink = $self->_fuse_hash($ihash);
     },

     # 'visualize_subset' =>
     # sub {
     #   my $subset = $args->{subset} || '';
     #   my $inline = $args->{inline} || 'false';
     #   $ihash = {
     # 		 action => 'visualize',
     # 		 arguments =>
     # 		 {
     # 		  mode => 'subset',
     # 		  inline => $inline,
     # 		  subset => $subset,
     # 		 },
     # 		};

     #   $ilink = $self->_fuse_hash($ihash);
     # },

     'simple_search' =>
     sub {
       if( ! $self->empty_hash_p($args) ){
	 # $args->{query}
	 # $args->{document_category}
	 # $args->{page}
     	 #$ilink = 'amigo?mode=simple_search&'.
     	 #  $self->hash_to_query_string($args);
     	 $ilink = 'amigo/simple_search?'.
     	   $self->hash_to_query_string($args);
       }else{
     	 #$ilink = 'amigo?mode=simple_search';
     	 $ilink = 'amigo/simple_search';
       }
     },

     'medial_search' =>
     sub {
       my $query = $args->{query} || '';
       if( $query ){
	 $ilink = 'amigo/medial_search?q='. $query;
       }else{
	 $ilink = 'amigo/medial_search';
       }
       # }else{
       # 	 die "The medial_search system requires a query argument.";
       # }
     },

     'reference_search' =>
     sub {
       my $query = $args->{ref_id} || '';
       if( $query ){
	 $ilink = 'amigo/reference?q='. $query;
       }else{
	 $ilink = 'amigo/reference';
       }
       # }else{
       # 	 die "The medial_search system requires a query argument.";
       # }
     },

     'live_search' =>
     sub {
       if( ! $self->empty_hash_p($args) ){
	 my $type = $args->{type} ||
	   die "require a type for non-default searches";
	 $ilink = 'amigo/search/' . $type;

	 ## In the case that we also have an incoming query, add that.
	 if( defined $args->{query} && $args->{query} ne '' ){
	   $ilink = $ilink . '?q=' . $args->{query};
	 }

       }else{
	 ## Just the most generic search we have.
	 ## TODO/BUG: Likely DEFUNCT at this point.
	 $ilink = 'amigo/search';
       }
     },

     'bulk_search' =>
     sub {
       if( ! $self->empty_hash_p($args) ){
	 my $type = $args->{type} ||
	   die "require a type for non-default searches";
	 $ilink = 'amigo/bulk_search/' . $type;

	 # ## In the case that we also have an incoming query, add that.
	 # if( defined $args->{query} && $args->{query} ne '' ){
	 #   $ilink = $ilink . '?q=' . $args->{query};
	 # }

       }else{
	 ## Just the most generic search we have.
	 ## TODO/BUG: Likely DEFUNCT at this point.
	 $ilink = 'amigo/bulk_search';
       }
     },

     'id_request' =>
     sub {
       my $data = $args->{data} || '';
       $ilink = 'aserve_exp?mode=id_request&data=' . $data;
     },

     ## TODO/BUG: redo later when can see how this (Phylotree stuff)
     ## will all hang together.
     'display_tree' =>
     sub {
       my $id = $args->{id} || '';
       $ilink = 'amigo_exp?mode=ptree&id=' . $id;
     },

     # 'style' =>
     # sub {
     #   my $sheet = $args->{sheet} || '';
     #   #$ilink = 'amigo?mode=css' . $sheet . '.css';
     #   $ilink = 'amigo?mode=css';
     # },

     'olsvis_go' =>
     sub {
       die "interlink mode 'gp_details' requires args" if ! defined $args;
       my $tacc = $args->{term} || '';
       $ilink = 'http://ols.wordvis.com/q=' . $tacc;
     },

     ## I don't *think* this would be Seth approved. -Sven
     ## Seth thinks it's fine, but jiggered it to see. -Seth
     phylotree =>
     sub {
       $ilink = 'phylotree';
       if (keys %$args) {
	 $ilink .= '?' .
	   join('&',
		map {
		  $_ . '=' . $args->{$_};
		} keys %$args);
       }
     },

     ## Well, only interlink some of the time.
     ## This will only return if the internal galaxy URL is set.
     'galaxy_by_tool' =>
     sub {
       die "interlink mode 'galaxy_by_tool' requires args" if ! defined $args;
       my $gtid = $args->{tool_id} || die 'needs tool_id argument';

       ## This is by definition always an external URL, so make sure
       ## that we override to nothing odd.
       $optional_public_p = 0;
       $optional_full_p = 0;

       $ilink = ''; # not really defined if we don't have it
       my $in_galaxy = $self->amigo_env('AMIGO_PUBLIC_GALAXY_URL');

       if( $in_galaxy ){ # we have our galaxy defined, so make the URL real.
	 if( $in_galaxy =~ /\/$/ ){
	   $ilink = $in_galaxy . 'tool_runner?tool_id=' . $gtid;
	 }else{
	   $ilink = $in_galaxy . '/tool_runner?tool_id=' . $gtid;
	 }
       }
     }

    );

  ## Check hash for our link function and run it if found.
  if( defined $fun_hash{$mode} ){
    $fun_hash{$mode}->();
  }

  ## Do we return the link or the hash?
  my $final_ret = undef;
  if( $optional_hash_p ){

    $final_ret = $ihash;

  }else{

    ## Use full URL?
    if( $ilink ){
      if( $optional_public_p ){
	#$self->kvetch('PUBLIC LINK');
	$ilink = $self->amigo_env('AMIGO_PUBLIC_CGI_BASE_URL') . '/' . $ilink;
      }elsif( $optional_full_p ){
	#$self->kvetch('FULL LINK');
	$ilink = $self->amigo_env('AMIGO_DYNAMIC_URL') . '/' . $ilink;
      }else{
	#$self->kvetch('LOCAL LINK');
      }
    }

    ## Add optional fragment identifier to URL?
    if( $optional_frag ){
      $ilink = $ilink . '#' . $optional_frag;
    }

    ## Safety last.
    if( $ilink ){
      if( $optional_html_safe_p ){
	$ilink = $self->html_safe($ilink);
	# }elsif( $optional_url_safe_p ){
	# $ilink = $self->url_safe($ilink);
      }else{
	# die "both kinds of safety cannot be used at the same time :$!"
      }
    }

    $final_ret = $ilink;
  }

  return $final_ret;
}

###
### JSON handling--finally centralized.
###

=item render_json

Args: a perl data scalar.
Returns: a JSONified string.

TODO: Switch to more complete JSON backend once packages reach Ubuntu.

=cut
sub render_json {

  my $self = shift;
  my $perl_var = shift || undef;

  # $self->kvetch('HERE');
  # die "here";

  my $retval = '';
  ## Pass the recursive buck...mine is better at simple things--the
  ## real one seems to require a ref.
  if( ref($perl_var) eq "HASH" ||
      ref($perl_var) eq "ARRAY" ){
    ## Try the new version, if not, use the old version.
    eval{
      $retval = JSON::XS->new->utf8->allow_blessed->encode($perl_var);
    };
    if ($@) {
      #    $retval = $self->{JSON}->to_json($perl_var);
      $retval = $self->{JSON}->encode($perl_var);
    }
  }else{
    #$retval = $self->emit_json_scalar($perl_var);
    $retval =
      JSON::XS->new->utf8->allow_blessed->allow_nonref->encode($perl_var);
  }

  return $retval;
}


##
sub emit_json_scalar {
  my $self = shift;
  my $scalar = shift || undef;

  my @mbuf = ();

  ## Right now, we're mostly interested in scalars and hash pointers.
  if( ! $scalar ){

    ## Nothingness.
    push @mbuf, 'null';

  }elsif( ref($scalar) eq 'HASH' ){

    ## Examine the hash and descend.
    push @mbuf, $self->rec_des_on_hash($scalar);

  }else{

    ## Typical.
    push @mbuf, '"';
    push @mbuf, $scalar;
    push @mbuf, '"';
  }

  return join '', @mbuf;
}


##
sub rec_des_on_hash {
  my $self = shift;
  my $hash = shift || undef;

  my @mbuf = ();
  push @mbuf, '{';
  if( $hash && %$hash && keys %{$hash} ){
    foreach my $key (keys %{$hash}){
      push @mbuf, '"';
      push @mbuf, $key;
      push @mbuf, '":';
      push @mbuf, $self->emit_json_scalar($hash->{$key});
      push @mbuf, ',';
    }
    pop @mbuf;
  }

  push @mbuf, '}';
  return join '', @mbuf;
}


## Write a JSON string from perl object.
sub _write_json_string {

  my $self = shift;
  my $perl_obj = shift || die 'yes, but what object do you want write';

  my $retstr = undef;
  # eval {
  $retstr = $self->{JSON}->encode($perl_obj);
  # };
  # if( $@ ){
  # die "nope: $@: $!";
  # }
  # $self->kvetch("passed: " . Dumper($rethash));

  return $retstr;
}


## Parse a JSON string to perl object.
sub _read_json_string {

  my $self = shift;
  my $json_str = shift || die 'yes, but what string do you want read?';

  #$self->kvetch("JSON contents: " . $json_str);
  #$| = 1;
  #print STDOUT "JSON contents|||" . $json_str . '|||';

  ## Read in data.
  # $self->kvetch("json: " . $self->{JSON});
  # $self->kvetch("json max depth: " . $self->{JSON}->get_max_depth());
  # $self->kvetch("json max size: " . $self->{JSON}->get_max_size());

  my $rethash = undef;
  # eval {
  if( $self ){
      $rethash = $self->{JSON}->decode($json_str);
  }else{
      #my $local_json = JSON::XS->new();
      #$rethash = $local_json->decode($json_str);
      $rethash = JSON::XS->new->utf8->decode($json_str);
  }
  # };
  # if( $@ ){
  # die "nope: $@: $!";
  # }
  # $self->kvetch("passed: " . Dumper($rethash));

  return $rethash;
}


## Parse a JSON file to perl object.
sub _read_json_file {

  my $self = shift;
  my $file = shift || die 'yes, but what file do you want read?';

  ## Try and get it.
  die "No hash file found ($file): $!" if ! -f $file;
  # open(FILE, '<', $file) or die "Cannot open $file: $!";
  # my $json_str = <FILE>;
  # close FILE;
  my $json_str = read_file($file);

  ## Punt to string reader.
  my $retval = undef;
  if( $self ){
      $retval = $self->_read_json_string($json_str);
  }else{
      $retval = _read_json_string(undef, $json_str);
  }

  return $retval;
}


###
### GOlr configurations.
###


=item golr_timestamp_log

Takes the full path of a GOlr timestamp log file. Why not just read
the variable directly? In some cases we'll want to use this helper
before the AmiGO environment is actually setup.

Return aref of hrefs of the OWLTools-produced GOlr load timestamp file.

If no suitable file was found, or the structure was significantly off,
undef will be returned.

=cut
sub golr_timestamp_log {

  my $self = shift;
  my $glog = shift || die "need a full file argument: $!";
  #my $glog = $self->amigo_env('GOLR_TIMESTAMP_LOCATION');
  my $ret_aref = undef;

  if( $glog && -f $glog ){
    eval {
      open(GLOGFILE, '<', $glog);# or die "Cannot open open $glog: $!";
      $ret_aref = [];
      while( <GLOGFILE> ){
	## TSV.
	my @fields = split /\t/, $_;
	if( scalar(@fields) == 4 ){
	  ## line okay.
	  push @$ret_aref,
	    {
	     type => $fields[0],
	     version => $fields[1],
	     time => $fields[2],
	     file => $fields[3],
	    };
	}
      }
      close GLOGFILE;
    };
  }else{
    #die "ARGH!: $glog";
  }

  return $ret_aref;
}


=item golr_configuration

Return href of the GOlr configuration from the installation.

TODO/BUG: this could be made faster by caching the values instead of
parsing them each time...

=cut
sub golr_configuration {

  my $self = shift;
  my $json_file = $self->amigo_env('AMIGO_ROOT') .
    '/javascript/npm/amigo2-instance-data/lib/data/golr.js';

  ## Try and get the string out.
  ## Crop to just the parts that are interesting.
  die "No hash file found ($json_file): $!" if ! -f $json_file;
  open(FILE, '<', $json_file) or die "Cannot open $json_file: $!";
  my $read_buffer = [];
  my $read_p = 0;
  while( <FILE> ){
    if( /var golr\ \=\ \{/ ){
      $read_p = 1;
      push @$read_buffer, '{';
    }elsif( /^\}\;/ ){
      $read_p = 0;
      push @$read_buffer, '}';
    }elsif( $read_p ){
      push @$read_buffer, $_;
    }
  }
  #my $json_str = <FILE>;
  my $json_str = join '', @$read_buffer;
  close FILE;

  #$self->kvetch("looking up conf: " . $json_file);

  ## Punt to string reader.
  return $self->_read_json_string($json_str);
  #return $self->_read_json_file($json_file);
}


=item golr_class_info

Arguments: golr class id
Return href of info.

TODO

=cut
sub golr_class_info {

  my $self = shift;
  my $gcid = shift || "need a golr class id";

  ## Gather golr info.
  my $ret = undef;
  my $gconf = $self->golr_configuration();
  if( defined $gconf->{$gcid} ){
    $ret = $gconf->{$gcid};
  }
  return $ret;
}


=item golr_class_info_list_by_weight

Return aref of necessary info for conduction simple searches.
Default cutoff is 0.

TODO

=cut
sub golr_class_info_list_by_weight {

  my $self = shift;
  my $cutoff = shift || 0;

  ## Gather golr info.
  my $gconf = $self->golr_configuration();

  ## Collect the good bits.
  my $rets = [];
  foreach my $id (keys(%{$gconf})){
    if( defined $gconf->{$id}{weight} &&
    	$gconf->{$id}{weight} >= $cutoff ){
      push @$rets, $gconf->{$id};
    }
  }

  ## Sort by weight.
  my @sorted_rets = sort { $b->{weight} <=> $a->{weight} } @$rets;

  #$self->kvetch('sorted rets: ' . Dumper(\@sorted_rets));

  return \@sorted_rets;
}


=item golr_class_searchable_extension

Arguments: string identifying the golr class
Return: the searchable extension string

=cut
sub golr_class_searchable_extension {

  my $self = shift;
  my $id = shift || die "which golr class?";

  ## Gather golr info.
  my $gconf = $self->golr_configuration();

  ##
  my $ret = undef;
  if( defined $gconf->{$id} &&
      defined $gconf->{$id}{searchable_extension} ){
    $ret = $gconf->{$id}{searchable_extension};
  }

  return $ret || die "we seem to be trying to work with a damaged conf";
}


=item golr_class_document_category

Arguments: string identifying the golr class
Return: the document_category string

=cut
sub golr_class_document_category {

  my $self = shift;
  my $id = shift || die "which golr class?";

  ## Gather golr info.
  my $gconf = $self->golr_configuration();

  ##
  my $ret = undef;
  if( defined $gconf->{$id} &&
      defined $gconf->{$id}{document_category} ){
    $ret = $gconf->{$id}{document_category};
  }

  return $ret || die "we seem to be trying to work with a damaged conf";
}


=item golr_class_field_searchable_p

Arguments: string identifying the golr class and a string identifying a field
Return: 0 or 1 on whether the field in question is searchable.

=cut
sub golr_class_field_searchable_p {

  my $self = shift;
  my $class_id = shift || die "which golr class?";
  my $field_id = shift || die "which field?";

  ## Gather golr info.
  my $gconf = $self->golr_configuration();

  ##
  my $ret = undef;
  if( defined $gconf->{$class_id} &&
      defined $gconf->{$class_id}{fields_hash} &&
      defined $gconf->{$class_id}{fields_hash}{$field_id} &&
      defined $gconf->{$class_id}{fields_hash}{$field_id}{searchable} ){
    $ret = 0;
    if( $gconf->{$class_id}{fields_hash}{$field_id}{searchable} eq 'true' ){
      $ret = 1;
    }
  }

  die "we seem to be trying to work with a damaged conf"
    if !defined $ret;

  return $ret;
}


=item golr_class_weights

Arguments: string identifying the golr class and the weights desired
('boost', 'result', or 'filter').

Return: href of {field => weight, ...}

=cut
sub golr_class_weights {

  my $self = shift;
  my $gc_id = shift || die "which golr class?";
  my $weights_id = shift || die "which golr class weights category?";

  ## Only the defined few.
  if( $weights_id ne 'boost' &&
      $weights_id ne 'result' &&
      $weights_id ne 'filter' ){
    die "not a known weights_id: $weights_id";
  }else{
    $weights_id = $weights_id . '_weights';
  }

  ## Gather golr info.
  my $gconf = $self->golr_configuration();

  ## Collect the good bits.
  my $rethash = {};
  if( !defined $gconf->{$gc_id} ||
      ! defined $gconf->{$gc_id}{$weights_id} ){
    $self->kvetch('failed to find: ' . $gc_id . ', '. $weights_id);
  }else{
    my $dfab = $gconf->{$gc_id}{$weights_id};
    my @fields = split /\s+/, $dfab;
    foreach my $p (@fields){
      my($field, $value) = split /\^/, $p;
      $rethash->{$field} = $value + 0.0; # convert?
    }
  }

  #$self->kvetch(Dumper($rethash));
  return $rethash;
}

###
###
###

=item amigo_statistics_cache

Return href of the statistics cache, if found.
Empty otherwise.

=cut
sub amigo_statistics_cache {

  my $self = shift;
  my $ret = {};

  my $json_file = $self->amigo_env('AMIGO_ROOT') .
    '/perl/bin/amigo-base-statistics-cache.json';

  ## Try and get the string out.
  ## Crop to just the parts that are interesting.
  if( -f $json_file ){
    $ret = $self->_read_json_file($json_file);
  }

  return $ret;
}

###
### Public bookmark API.
###


=item bookmark_api_configuration

Return href of the public-facing configuration from the installation.

TODO/BUG: this could be made faster by caching the values instead of
parsing them each time...

=cut
sub bookmark_api_configuration {

  my $self = shift;

  ## TODO/BUG: Use YAML configuration that was created at install
  ## time.
  my $mapping = {
      'term' => 'annotation_class',
      'taxon' => 'taxon',
      'bioentity' => 'bioentity',
      'aspect' => 'aspect',
      'evidence' => 'evidence_type'
  };

  return $mapping;
}


###
### Misc.
###

=item get_root_terms

Arguments: n/a

Return: an ordered aref of id/value and label/value hashref pairs.

=cut
sub get_root_terms {

  my $self = shift;

  my $retlist = [];

  ## 
  my $str_raw = $self->amigo_env('AMIGO_ROOT_TERMS') || '';
  if( $str_raw ){
      my $root_set = $self->_read_json_string($str_raw);
      foreach my $try_root (@$root_set){
	  if( $try_root->{'id'} && $try_root->{'label'} ){
	      push @$retlist, $try_root;
	  }
      }
  }

  return $retlist;
}


=item get_amigo_layout

Arguments: the AMIGO_LAYOUT_* variable that contains a list of GOlr classes

Return: an ordered aref of GOlr class information for the list IDs.

=cut
sub get_amigo_layout {

  my $self = shift;
  my $layout_env_id = shift || die "which AMIGO_LAYOUT_* do you mean?";

  my $retlist = [];

  ## Extract the landing page search order from the ID.
  my $str_raw = $self->amigo_env($layout_env_id) || '';
  my $clist = $self->clean_list($str_raw);
  foreach my $citem (@$clist){
    my $try_class = $self->golr_class_info($citem);
    #$self->kvetch('layout entry: ' . $citem . ', ' . $try_class);
    if( $try_class ){
      push @$retlist, $try_class;
    }
  }

  return $retlist;
}


=item query_string_to_hash

Turn a query string into a single-level hash. Multiple values for a
single key will turn a hash entry into an aref.

Accepts strings.

=cut
sub query_string_to_hash {

  my $self = shift;
  my $in_str = shift || '';
  my $rethash = {};

  if( $in_str ){
    my @pairs = split /\&/, $in_str;
    foreach my $pair (@pairs){
      my($key, $new_val) = split /=/, $pair;
      chomp $new_val;

      # $self->kvetch('$key: ' . $key);
      # $self->kvetch('$new_val: ' . $new_val);

      ## If it's already there, push it on an aref (which itself might
      ## need to be created). Threee cases.
      if( ! defined $rethash->{$key} ){
	$rethash->{$key} = $new_val;
      }elsif( defined $rethash->{$key} && ref($rethash->{$key}) eq 'ARRAY' ){
	push @{$rethash->{$key}}, $new_val;
      }else{
	## Value there, but no aref yet...
	my $curr_val = $rethash->{$key};
	$rethash->{$key} = [];
	push @{$rethash->{$key}}, $curr_val;
	push @{$rethash->{$key}}, $new_val;
      }
    }
  }

  # $self->kvetch('$rethash: ' . Dumper($rethash));
  return $rethash;
}


=item hash_to_query_string

Turn a single-level hash ref into a remarkably URL-like string using
the keys as the...keys...

Accepts array refs as values.

=cut
sub hash_to_query_string {

  my $self = shift;
  my $hash = shift || {};

  my $mega_buf = [];
  foreach my $key (keys %{$hash}){

    ## Array ref or not...
    if( ref($hash->{$key}) eq 'ARRAY' ){

      my $mini_buf = [];
      foreach my $elt (@{$hash->{$key}}){
	push @$mini_buf,  $key . '=' . $elt;
      }
      push @$mega_buf, join('&', @$mini_buf);

    }else{
      push @$mega_buf,  $key . '=' . $hash->{$key};
    }
  }
  return join('&', @$mega_buf);
}


=item hash_to_golr_query

Turn a single-level hash ref into a GOlr URL.

Accepts array refs as values.

=cut
sub hash_to_golr_query {

  my $self = shift;
  my $hash = shift || {};

  my $qstr = $self->hash_to_query_string($hash);
  my $url = $self->amigo_env('AMIGO_PUBLIC_GOLR_URL') . '/select?' . $qstr;

  return $url;
}


=item to_hash

Turn an array ref (or scalar) into a single level hash ref.

Accepts array refs or scalar, with optional fill value.
Returns hashrefs.

=cut
sub to_hash {

  my $self = shift;
  my $iarray = shift || [];
  my $fill = shift;
  my $ohash = {};

  ## Use any given fill value.
  if( ! defined $fill ){
    $fill = 1;
  }

  ## Roll in array.
  if( ref($iarray) ne 'ARRAY' ){
    $ohash->{$iarray} = $fill;
  }else{
    foreach my $item (@$iarray){
      $ohash->{$item} = $fill;
    }
  }

  return $ohash;
}


=item merge

Merges two hashes (as hashrefs) together, using the first one as a template.
Using shallow copying.

=cut
sub merge {

  my $self = shift;
  my $default_hash = shift || {};
  my $in_hash = shift || {};

  ##
  my $ret_hash = {};

  ## For defined in default, incoming over default.
  foreach my $key (keys %$default_hash){
    if( defined $in_hash->{$key} ){
      $ret_hash->{$key} = $in_hash->{$key};
    }else{
      $ret_hash->{$key} = $default_hash->{$key};
    }
  }

  ## For undefined in default, just use incoming.
  foreach my $key (keys %$in_hash){
    if( ! defined $default_hash->{$key} ){
      $ret_hash->{$key} = $in_hash->{$key};
    }
  }

  return $ret_hash;
}


=item random_hash_key

Returns a random hash key from a hashref.

=cut
sub random_hash_key {
  my $self = shift;
  my $hash = shift || {};
  return (keys %$hash)[rand(keys %$hash)];
}


=item random_hash_keys

Returns a random aref of hash keys from a hashref.

=cut
sub random_hash_keys {
  my $self = shift;
  my $hash = shift || {};
  my @shuffled_keys = shuffle(keys %$hash);
  return \@shuffled_keys;
}


=item randomness

Returns a random string.

Most uses of this would be better done by uuid.

First argument is the length if the randomness returned (default 10).
Second argument is an array ref of characters to be used (defaults to
[0-9a-z])

=cut
sub randomness {

  my $self = shift;
  my $len = shift || 10;
  my $random_base =
    shift || ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
	      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	      'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

  my $cache = [];
  for( my $i = 0; $i < $len; $i++ ){
    my $rbase_index = floor(rand() * scalar(@$random_base));
    push @$cache, $$random_base[$rbase_index];
  }

  return join '', @$cache;
}


=item empty_hash_p

Returns bool on whether or not a hash ref is empty.

=cut
sub empty_hash_p {
  my $self = shift;
  my $hash = shift || {};

  my $num_keys = scalar(keys %$hash);
  if( $num_keys == 0 ){
    return 1;
  }else{
    return 0;
  }
}


# =item listref_ify

# Attempts to turn the input into some kind of list ref on expected
# input of undef, scalar, listref, or list.

# Returns a listref (empty if no contents or coersion).

# =cut
# sub listref_ify {
#   my $self = shift;
#   my $input = shift || undef;

#   my $ret = [];

#   if( defined $input ){
#     if( ref($input) eq 'ARRAY' ){
      
#     }
#   }

#   return $ret;
# }


###
### Resource and images.
###

=item get_image_resource

Get a named resource as a url string from the meta_data hash if
possible.

=cut
sub get_image_resource {

  my $self = shift;
  my $res = shift || '';
  my $mod = shift || undef;

  my $lower = lc($res);
  my $mangled_res = 'bbop_img_' . $lower;
  my $ibase = $self->amigo_env('AMIGO_IMAGE_URL');
  my $img_data =
    {
     bbop_img_star => $ibase . '/star.png',
     bbop_img_ptree => $ibase . '/ptree.png',
     bbop_img_forward => $ibase . '/media_forward.png',
     bbop_img_jump_forward => $ibase . '/media_jump_forward.png',
     bbop_img_back => $ibase . '/media_back.png',
     bbop_img_jump_back => $ibase . '/media_jump_back.png',
    };

  ##
  my $retval = undef;
  if( defined $img_data->{$mangled_res} ){
    $retval = $img_data->{$mangled_res};
  }else{
    ## TODO: sensible fall-through?
    $retval = $ibase . '/' . $lower;
  }

  ## Add optional size.
  if( defined $mod && $mod ){
    $retval =~ s/(.*)\.png$/$1_$mod\.png/;
  }

  return $retval;
}


=item vanilla_filehandle_p

WARNING: using this runs the file forward a little, which caused
problems in the past. We now run back to zero before leaving, but who
knows what other dumb things perl might do...

Return 1 or 0

=cut
sub vanilla_filehandle_p {

  my $self = shift;
  my $fh = shift || undef;
  my $retval = 0;
  my $cdata = undef;

  if( $fh ){

    ## Other tests--the above is remarkably unreliable...
    if( -T $fh ){
      $self->kvetch('is text');
      $retval = 1;
    }else{
      $self->kvetch('is binary?');

      ## File::MMagic permonks hack.
      push @Fh::ISA, 'IO::Seekable' unless Fh->isa('IO::Seekable');
      push @Fh::ISA, 'IO::Handle' unless Fh->isa('IO::Handle');

      ## Try again.
      my $ft = File::Type->new();
      $fh->read($cdata, 0x8564);
      my $tfd = $ft->checktype_contents($cdata);
      seek $fh, 0, 0; # rewind for future use.
      $self->kvetch('contents type: ' . $tfd);

      ## Decide.
      #if( $mt =~ /text\/plain/ ){
      if( $tfd =~ /text/ ){
	$retval = 1;
      }
    }
  }

  return $retval;
}


###
### Error message passing and internal errors.
###


=item ok

Return 1 or 0 for all operations.

=cut
sub ok {
  my $self = shift;
  my $retval = 1;
  $retval = 0 if defined $self->{ERROR_MESSAGE};
  return $retval;
}


=item error_p

Getter.
Return 1 or 0 for all operations.

=cut
sub error_p {
  my $self = shift;
  my $retval = 0;
  $self->kvetch("in: " . $retval . " " . $self->{ERROR_MESSAGE});
  $retval = 1 if defined $self->{ERROR_MESSAGE};
  return $retval;
}


=item error_message

Getter.
Returns the reason for the above error.

=cut
sub error_message {
  my $self = shift;
  return $self->{ERROR_MESSAGE};
}


=item set_error_message

Setter.
TODO: Add current package to the front of the error message.

=cut
sub set_error_message {
  my $self = shift;
  my $arg = shift || undef;
  $self->{ERROR_MESSAGE} = $arg;
  return $self->{ERROR_MESSAGE};
}


=item dynamic_dispatch_table_amigo

Return a list for the dispatch table used by bin/amigo and
AmiGO::WebApp::HTMLClient::Dispatch.pm.

Note: Can use as a static method.

Returns list ref.

=cut
sub dynamic_dispatch_table_amigo {
  my $self = shift || undef; # can use as static method

  my $aapp = 'AmiGO::WebApp::HTMLClient';
  my $dispatch_table =
    [
     ''                    => { app => $aapp }, # defaults to landing
     '/'                   => { app => $aapp }, # defaults to landing
     ## This rm should only come into play when using amigo-runner
     ## in "embedded" mode (as in that case, the dynamic dispatch
     ## is handling the fall-through case; otherwise it would be handled
     ## by the apache config or whatever).
     'robots.txt'          => { app => $aapp, rm => 'special' },
     'landing'             => { app => $aapp, rm => 'landing' },
     'software_list'       => { app => $aapp, rm => 'software_list' },
     'schema_details'      => { app => $aapp, rm => 'schema_details' },
     'load_details'        => { app => $aapp, rm => 'load_details' },
     'owltools_details'    => { app => $aapp, rm => 'owltools_details' },
     'dd_browse'           => { app => $aapp, rm => 'dd_browse' },
     'base_statistics'     => { app => $aapp, rm => 'base_statistics' },
     'free_browse'         => { app => $aapp, rm => 'free_browse' },
     ##
     ## Soft applications (may take some parameters, browser-only).
     ##
     'browse/:term?'       => { app => $aapp, rm => 'specific_browse',
				'term' => 'term' },
     'browse'              => { app => $aapp, rm => 'browse'},
     'medial_search'       => { app => $aapp, rm => 'medial_search' },
     'simple_search'       => { app => $aapp, rm => 'simple_search' },
     'bulk_search/:personality' => { app => $aapp, rm => 'bulk_search',
				     personality => 'personality' },
     'bulk_search' => { app => $aapp, rm => 'bulk_search'},
     'search/:personality' => { app => $aapp, rm => 'specific_search',
				personality => 'personality' },
     'search'              => { app => $aapp, rm => 'search' },
     'phylo_graph/:family' =>
     { app => $aapp, rm => 'phylo_graph', family => 'family' },
     'phylo_graph'         => { app => $aapp, rm => 'phylo_graph' },
     ##
     ## RESTy (can be consumed as service).
     ##
     'term/:cls/:format?'         => { app => $aapp, rm => 'term',
				       'cls' => 'cls', 'format' => 'format' },
     'gene_product/:gp/:format?'  => { app => $aapp, rm => 'gene_product',
				       'gp' => 'gp', 'format' => 'format' },
     'reference/:ref_id/:format?' => { app => $aapp, rm => 'reference',
				       'ref_id'=>'ref_id', 'format'=>'format' },
     'reference' => { app => $aapp, rm => 'reference'},
     ## Alpha.
     'model/:model'  => { app => $aapp, rm => 'model', model => 'model' },
     'biology'  => { app => $aapp, rm => 'biology' },
     'ontologies'  => { app => $aapp, rm => 'ontologies' },
    ];

  return $dispatch_table;
}

=item static_dispatch_table

Return a list for the dispatch table used by bin/amigo and
AmiGO::WebApp::HTMLClient::Dispatch.pm.

Note: Can use as a static method.

Returns list ref.

=cut
sub static_dispatch_table {
  my $self = shift || undef; # can use as static method

  my $sapp = 'AmiGO::WebApp::Static';
  my $load =
    {
     app => $sapp, rm => 'deliver',
     # 'arg1' => 'arg1',
     # 'arg2' => 'arg2',
     # 'arg3' => 'arg3',
     # 'arg4' => 'arg4',
     # 'arg5' => 'arg5',
    };
  my $dispatch_table =
    [
     '*' => $load,
     #'css/*' => $load,
     # 'html/:arg1?/:arg2?/:arg3?/:arg4?/:arg5?' => $load,
     # 'css/:arg1?/:arg2?/:arg3?/:arg4?/:arg5?' => $load,
     # 'js/:arg1?/:arg2?/:arg3?/:arg4?/:arg5?' => $load,
     # 'staging/:arg1?/:arg2?/:arg3?/:arg4?/:arg5?' => $load,
    ];

  return $dispatch_table;
}



1;
