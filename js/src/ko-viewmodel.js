var m = new Model();

var NewportMesaViewModel = function() {
  'use strict';

  // Constants
  var AJAX_TIMEOUT_LENGTH = 8000,
  STATUS = { loading: 'loading', fail: 'fail', success: 'success' };

  // Store reference to ViewModel object
  var self = this;

  // DOM element to bind to the map to
  var $map = document.querySelector('.map');

  // Get the search term from the input
  this.searchTerm = ko.observable('');

  // Checks if surf forecast is loading
  this.isForecastLoading = ko.observable(true);

  // Reports Google Maps's status
  this.googleMapsStatus = ko.observable(STATUS.loading);

  // Reports Yelp's Status
  this.yelpStatus = ko.observable(STATUS.loading);

  // List of locations to be displayed
  this.locations = ko.observableArray();

  // The current location item
  this.currentLocation = ko.observable(null);

  /** @description Sets the current Yelp or Surf spot item
  */
  this.setCurrent = function(item){
    self.currentLocation(item);
  };

  /** @description
  * The Google Map request is jsonp. Error handling is not
  * built in, so use a setTimout to handle the error.
  */
  var googleMapsTimeout = setTimeout(function(){
    self.googleMapsStatus(STATUS.fail);
  }, AJAX_TIMEOUT_LENGTH);

  // Creates the map
  function googleMaps() {
    return $.ajax('https://maps.googleapis.com/maps/api/js?key=AIzaSyAtqzH53xQyC04PbQFV4brTqidjBzhr_dI', {
      dataType: 'jsonp'
      })
      .done(function(data) {
        clearTimeout(googleMapsTimeout);
        self.googleMapsStatus(STATUS.success);
        var map = new google.maps.Map($map, {
          center: {
            lat: m.mapCenter.lat,
            lng: m.mapCenter.lng
          },
          zoomControl: true,
          zoom: 13
        });
        return map;
      });
  }

  /** @description
  * Yelp is also a jsonp request. Use a timeout to handle error
  */
  var yelpTimeout = setTimeout(function(){
    self.yelpStatus(STATUS.fail);
  }, AJAX_TIMEOUT_LENGTH);

  function getYelpData() {
    /** Yelp credentials and parameters */
    var httpMethod = 'GET',
    yelpUrl = 'https://api.yelp.com/v2/search?',
    parameters = {
        bounds: '33.587063, -117.968421|33.671254, -117.867103',
        sort: '2',
        oauth_consumer_key : 'cxq1v3t-v5ZBP7fgQUCEkg',
        oauth_token : '_LqamVQhZLhs7LMDw62CeVXQPDfDVi_r',
        oauth_nonce : Math.floor(Math.random() * 1e12).toString(),
        oauth_timestamp : Math.floor(Date.now() / 1000),
        oauth_signature_method : 'HMAC-SHA1',
        callback: 'cb'
    },
    consumerSecret = 'BAK4r2WoFYdc2nSoGrjD14pc7Bo',
    tokenSecret = 'qb99XpkZ-lV26f7eNQ1nVofsGN8',
    /** Create signature for the request */
    signature = oauthSignature.generate(httpMethod, yelpUrl, parameters, consumerSecret, tokenSecret,
       { encodeSignature: false});
    /** Add the signature to the query string */
    parameters.oauth_signature = signature;

    return $.ajax(yelpUrl,{
            url: yelpUrl,
            jsonpCallback: 'cb',
            dataType: 'jsonp',
            data: parameters,
            cache: true })
    .done(function(data){
      clearTimeout(yelpTimeout);
      self.yelpStatus(STATUS.success);
      return data;
    });
  }

  /** @description
  *
  */
  $.when(googleMaps(), getYelpData()).done(
    function(googleMaps, yelpData){
      _.each(yelpData[0].businesses, function(item){
        // TODO: Populate the list with Loc objects
        self.locations.push(item.name);
      });
  });

  /**
  * @description Populates the map with markers
  * Only fires if the map is loaded successfully
  */
  this.addLocationsToMap = function(map) {
      var item = 'Newport Beach';
      var marker = new google.maps.Marker({
        position: {lat: m.mapCenter.lat, lng: m.mapCenter.lng },
        map: map,
        icon: 'img/anchor.png',
        title: item
      });
      marker.addListener('click', function(){
        self.setCurrent(item);
      });
  };
};

// Apply knockout bindings to DOM
ko.applyBindings(new NewportMesaViewModel(), document.querySelector('.newport-mesa-app'));
