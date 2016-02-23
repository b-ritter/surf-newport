var m = new Model();

var NewportMesaViewModel = function() {
  'use strict';

  // Constants
  var AJAX_TIMEOUT_LENGTH = 8000, // How long to wait for Ajax calls
  BOUNCE_DURATION = 2100, // Used for the markers
  OFFSET = 8, // Used for the surf forecast
  STATUS = { // Status states for various components of the app
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
  this.currentLocation = ko.observable(m.defaultLocation);

  /** @description Sets the current Yelp or Surf spot item
  */

  this.setCurrent = function(item){
    // map.getBounds().contains(markers[i].getPosition())
    // console.log(self.map.getBounds());
    self.map.fitBounds({ south: 33.57973569831782 , west: -117.97790119453123, north: 33.66664438606194, east: -117.88451740546873 });
    self.map.setZoom(12);
    var previousLocation = self.currentLocation();
    if(previousLocation.locType !== 'default'){
      previousLocation.markerInfo.close();
      previousLocation.marker.setAnimation(null);
      previousLocation.isActive(false);
    }
    if(item.locType === 'surf'){
      item.loadForecast();
    }
    if(item.locType !== 'default'){
      item.markerInfo.open(self.map, item.marker);
      if(!item.marker.getAnimation()){
        item.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
          item.marker.setAnimation(null);
        }, BOUNCE_DURATION);
      }
      item.isActive(true);
    }
    self.currentLocation(item);
  };

  this.isSelected = ko.observable();

  this.tempList = [];

  this.locationDisplay = ko.computed(function(){
    if(self.isSelected()){
      self.setCurrent(m.defaultLocation);
      self.tempList = _.filter(self.locations(), function(item){
        var itemChars = item.locName.toLowerCase();
        var searchTermChars = self.searchTerm().toLowerCase();
        if(itemChars.indexOf(searchTermChars) !== -1){
          /** Check if the marker is NOT visible */
          if(!item.marker.getVisible()){
            /** If it wasn't visible, show it */
            item.marker.setVisible(true);
          }
          return item;
        } else {
          /** Turn off marker if it fails the filter test */
          item.marker.setVisible(false);
        }
      });
      return self.tempList;
    } else if(!self.isSelected() && self.searchTerm() === ''){
      return self.locations();
    } else {
      return self.tempList;
    }


  });

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
        //cll: String(m.mapCenter.lat) + String(m.mapCenter.lng),
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
  * When all the ajax calls have returned, do this...
  */
  $.when(googleMaps(), getYelpData()).done(
    function(googleMaps, yelpData){
      // TODO: Partition out the items so that I can add common properties
      // to all items and specific type-related info to others

      /** @description
      * Populates the initial location list with the surf locations
      */
      _.each(m.locationData, function(element){
        var item = element;
        item.marker = new google.maps.Marker({
          position: {
            lat: element.location[0],
            lng: element.location[1]},
          map: self.map,
          icon: 'img/wave.png',
          title: element.name
        });

        item.locType = 'surf';

        // Placeholder for spot forecast data to be displayed
        item.forecast = ko.observableArray([null]);

        item.forecastStatus = ko.observable(STATUS.loading);

        item.forecastRange = [];

        // Stores all forecast data
        item.forecastData = [];

        // Show the first day of 8 intervals
        item.currentRange = [0, OFFSET];

        item.loadForecast = function(){
          if(item.forecastStatus() !== STATUS.success){
              var forecastTimeout = setTimeout(function(){
                item.forecastStatus(STATUS.fail);
              }, AJAX_TIMEOUT_LENGTH);
              /** Get the magic seaweed info on the selected spot */
              $.ajax('http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66/forecast/?spot_id=' +
                item.spotID +
                '&units=us&fields=swell.*,wind.*,timestamp', {
                dataType: 'jsonp'
              }).done(function(data){
                  clearTimeout(forecastTimeout);
                  item.forecastStatus(STATUS.success);
                  item.forecastData = data;
                  item.forecastRange = _.map(data, function(element){
                      return element.swell.components.primary.height;
                  });
                  item.forecast(data.slice(0, OFFSET));
                  item.currentDayIndex = OFFSET;
            });
          }
        };

        item.loadNextForecast = function() {
          this.setNextForecast(1);
        };

        item.loadPrevForecast = function() {
          this.setNextForecast(-1);
        };

        item.setNextForecast = function(direction) {
          /** Direction is 1 or -1
          * Moves the range of forecast data to show up or down */
          if( this.currentRange[0] + OFFSET * direction < 0 ){
            this.currentRange = [this.forecastData.length - OFFSET, this.forecastData.length];
          } else if (this.currentRange[1] + OFFSET * direction > this.forecastData.length){
            this.currentRange = [0, OFFSET];
          } else {
             this.currentRange = this.currentRange.map( function(val) {
              return val + OFFSET * direction;
            });
          }
          this.forecast(this.forecastData.slice(this.currentRange[0], this.currentRange[1]));
        };

        item.isActive = ko.observable(false);

        item.marker.addListener('click', function(){
          self.setCurrent(item);
        });

        item.markerInfo = new google.maps.InfoWindow(
          { content: '<div class="infoWindow"><h2>' + element.locName + '</h2></div>' }
        );

        item.markerInfo.addListener('closeclick', function(){
            self.setCurrent(m.defaultLocation);
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
            self.setCurrent(m.defaultLocation);
        });

        item.locName = item.name;

        self.locations.push(item);
      });
  });

};

ko.applyBindings(new NewportMesaViewModel(), document.querySelector('.newport-mesa-app'));
