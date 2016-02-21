var m = new Model();

var NewportMesaViewModel = function() {
  'use strict';
  var self = this;
  // DOM element to bind to the map to
  var $map = document.querySelector('.map');

  // Get the search term from the input
  this.searchTerm = ko.observable('');
  // Checks if Yelp locations are loading
  this.isLoading = ko.observable(true);

  // Checks if surf forecast is loading
  this.isForecastLoading = ko.observable(true);

  // List of locations to be displayed
  this.locations = ko.observableArray([]);

  // The current location item
  this.currentLocation = ko.observable(null);

  // Sets the current location
  this.setCurrent = function(item){
    self.currentLocation(item);
  };

  // Creates the map
  this.map = ko.observable($.ajax('https://maps.googleapis.com/maps/api/js?key=AIzaSyAtqzH53xQyC04PbQFV4brTqidjBzhr_dI', {
    dataType: 'jsonp'
  }).
  fail(function(xhr, status) {
      alert('Google Maps could not load at this time. Please try again later.');
      return null;
  })
  .done(function(data) {
      var map = new google.maps.Map($map, {
        center: {
          lat: m.mapCenter.lat,
          lng: m.mapCenter.lng
        },
        zoomControl: true,
        zoom: 13
      });
      self.addLocationsToMap(map);
      return map;
  }));

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
