var m = new Model();

var NewportMesaViewModel = function() {
  'use strict';

  // Constants
  var AJAX_TIMEOUT_LENGTH = 8000,
  BOUNCE_DURATION = 2100,
  STATUS = {
    loading: 'loading',
    fail: 'fail',
    success: 'success',
    biz: 'biz',
    default: 'default',
    surf: 'surf'
  };

  // Store reference to ViewModel object
  var self = this;

  // DOM element to bind to the map to
  var $map = document.querySelector('.map');

  // The Google Map itself
  // Value set on success
  this.map = null;

  // Get the search term from the input
  this.searchTerm = ko.observable('');

  // Checks if surf forecast is loading
  this.mswForecastStatus = ko.observable(STATUS.loading);

  // Reports Google Maps's status
  this.googleMapsStatus = ko.observable(STATUS.loading);

  // Reports Yelp's Status
  this.yelpStatus = ko.observable(STATUS.loading);

  // List of locations to be displayed
  this.locations = ko.observableArray();

  // The current location item
  this.currentLocation = ko.observable(null);

  // Reports the current location type
  this.currentLocationType = ko.observable(STATUS.default);

  /** @description Sets the current Yelp or Surf spot item
  */
  this.setCurrent = function(item){
    var previousLocation = self.currentLocation();
    if(previousLocation){
      previousLocation.markerInfo.close();
      previousLocation.marker.setAnimation(null);
      previousLocation.isActive(false);
    }
    if(item !== null){
      item.markerInfo.open(self.map, item.marker);
      if(!item.marker.getAnimation()){
        item.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
          item.marker.setAnimation(null);
        }, BOUNCE_DURATION);
      }
      item.isActive(true);
      self.currentLocationType(item.locType);
    }

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
        self.map = new google.maps.Map($map, {
          center: {
            lat: m.mapCenter.lat,
            lng: m.mapCenter.lng
          },
          zoomControl: true,
          zoom: 13
        });
        return data;
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

      /** @description
      * Populates the initial location list with the surf locations
      */
      _.each(m.locationData, function(item){

        item.marker = new google.maps.Marker({
          position: {
            lat: item.location[0],
            lng: item.location[1]},
          map: self.map,
          icon: 'img/wave.png',
          title: item.name
        });

        item.locType = 'surf';

        item.isActive = ko.observable(false);

        item.marker.addListener('click', function(){
          self.setCurrent(item);
        });

        item.markerInfo = new google.maps.InfoWindow(
          { content: '<div class="infoWindow"><h2>' + item.locName + '</h2></div>' }
        );

        item.markerInfo.addListener('closeclick', function(){
            self.setCurrent(null);
        });
        
        self.locations.push(item);
      });

      /** @description
      * Adds Yelp locations to the map
      */
      _.each(yelpData[0].businesses, function(item){
        var selfItem = item;
        item.categories = item.categories.reduce(function(previousValue, currentValue, currentIndex, array){
              var separator = '';
              if(currentIndex < array.length-1){
               separator = ', ';
              }
              return previousValue + currentValue[0] + separator;
            }, '');

        item.marker = new google.maps.Marker({
          position: {
            lat: item.location.coordinate.latitude,
            lng: item.location.coordinate.longitude},
          map: self.map,
          icon: 'img/anchor.png',
          title: item.name
        });

        item.locType = 'biz';

        item.isActive = ko.observable(false);

        item.marker.addListener('click', function(){
          self.setCurrent(item);
        });

        item.markerInfo = new google.maps.InfoWindow(
          { content: '<div class="infoWindow"><h2>' + item.name + '</h2></div>' }
        );

        item.markerInfo.addListener('closeclick', function(){
            self.setCurrent(null);
        });

        item.locName = item.name;

        self.locations.push(item);
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
$(document).ready(function(){
  ko.applyBindings(new NewportMesaViewModel(), document.querySelector('.newport-mesa-app'));
});
