var Model = function() {
  'use strict';

  var self = this;

  // Checks if Yelp has Failed
  this.yelpFailed = ko.observable(false);

  // Center of the map: Newport Beach, CA
  this.mapCenter = {
    lat: 33.6218095,
    lng: -117.9121563
  };

  this.mapBounds = {

  };

  this.defaultLocation = {
    locName: 'Newport/Mesa',
    description: 'Newport Beach and Costa Mesa are neighboring cities in Orange County, CA.',
    locType: 'default'
  };


  // A list of permanent locations, with Magic Seaweed Spot ID code
  this.locationData = [{
    'locName': 'Newport Jetties',
    'locDescription': 'Long stretch of beachbreak interspersed with several short, rock jetties.',
    'spotID': '665',
    'location': [33.613733, -117.934251]
  }, {
    'locName': 'Blackies',
    'spotID': '2575',
    'locDescription': 'Occasionally epic, long wintertime sandbar lefts north of Newport Pier, in front of Blackie’s Bar.',
    'location': [33.609367, -117.930719]
  }, {
    'locName': 'River Jetties',
    'spotID': '2599',
    'locDescription': 'Consistent, hollow peaks between the two jetties at the rivermouth.',
    'location': [33.628515, -117.957601]
  }, {
    'locName': 'The Wedge',
    'spotID': '287',
    'locDescription': 'World-famous freak wave dominated by bodysurfers and bodyboarders, although surfers do enjoy some degree of success.',
    'location': [33.593311, -117.881968]
  }, {
    'locName': 'Corona Del Mar',
    'spotID': '2579',
    'locDescription': 'Quality, long sandbar rights, only during solid S swells, break off the east (southside) jetty of Newport Harbor.',
    'location': [33.592816, -117.877136]
  }];
};

/** Custom binding to handle the drawing of the swell data with d3 */
ko.bindingHandlers.MSWswellChart = {
  /**
  * @description Creates custom Knockout.js binding. See Knockout.js
  * documentation at http://knockoutjs.com/documentation/custom-bindings.html
  */
  init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
    var margin = {top: 29, right: 0, bottom: 0, left: 0},
        width = 400,
        height = 200,
        data = ko.unwrap(valueAccessor()),
        primarySwellHeight = [],
        timeIntervals = [],
        windData = [
          { type:'direction', values: [] },
          { type:'speed', values: [] }
        ];
        /** Extract lists of surf data */
        _.each(data, function(d){
          if(d){
            primarySwellHeight.push(d.swell.components.primary.height);
            timeIntervals.push(moment(d.timestamp * 1000).format('ha'));
            windData[0].values.push(d.wind.direction);
            windData[1].values.push(d.wind.speed);
          }
        });
        // console.log(windData);
        var numItems = primarySwellHeight.length,
        barWidth = width / numItems,
        space = 0.1 * barWidth,
        allWaveHeights = bindingContext.$parent.forecastRange;

        /** Create d3 charts */
        var charts = d3.select(element);

        charts.append('div').attr('class', 'datum')
          .selectAll('div')
            .data(timeIntervals)
            .enter()
            .append('div')
            .attr('class', 'time')
            .text(function(d){ return d; });

        var swellChart = charts.append('svg')
            .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' +
            (height + margin.top + margin.bottom))
            .attr('fill', 'white')
          .append('g')
            .attr('transform', 'translate('+ margin.left +',' + margin.top + ')');

        var y = d3.scale.linear()
            .domain([0, d3.max(allWaveHeights)])
            .range([height, 0]);

        var bars = swellChart.selectAll('.bar')
          .data(primarySwellHeight)
          .enter().append('g')
          .attr('transform', function(d, i ){
            return 'translate(' + i * barWidth + ',0)';
          });

        var barLines = bars.append('rect')
          .attr('height', function(d){
            if(d){
              return height - y(d);
            }
          })
          .attr('width', barWidth - space)
          .attr('y', function(d, i){
            if(d) {
              return y(d);
            }
          })
          .attr('class', 'bar');

        bars.append('text')
          .attr('transform', 'translate(' + barWidth/2 + ', ' + (height - space) + ')')
          .html(function(d){ return d; });

        charts.append('div')
            .append('p')
            .text('Swell Height (ft.)');
        /* Wind Data */
        var wind = charts.append('div').attr('class', 'wind');

        var windDatasets = wind.append('div').selectAll('div')
                  .data(windData)
                .enter()
                  .append('div')
                  .attr('class', 'datum')
                  .attr('id', function(d){ return d.type; });

        windDatasets.filter('#direction')
                  .selectAll('div')
                  .data( function(d){
                    return d.values; })
                 .enter()
                  .append('div')
                 .datum(function(d){ return d; })
                  .style('transform', function(d){
                              return 'scale(.6) rotate(' + d + 'deg)';
                            }
                          )
                  .html('<svg viewBox="0 0 86.6 75">' +
                              '<g>' +
                                '<polygon fill="#fff" points="43.5,54.8 0,75 43.3,0 86.6,75" />' +
                              '</g></svg>');

        windDatasets.filter('#speed')
            .selectAll('div')
                      .data( function(d){ return d.values; })
                     .enter()
                      .append('div')
                      .text(function(d){ return d; });

        wind.append('p').text('Wind Speed and Direction')
                  .append('div');
  }

};

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

  this.mapBounds = null;

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

  // Maintain a list of items currently visible
  this.tempList = [];

  // The current location item
  this.currentLocation = ko.observable(m.defaultLocation);

  /**
  ** @constructor
  ** @description Makes a location object
  */
  this.Loc = function(element, settings){
    var selfLoc = this;
    this.marker = new google.maps.Marker({
      position: {
        lat: settings.lat,
        lng: settings.lng
      },
      map: self.map,
      icon: settings.icon,
      title: element.name
    });

    this.locName = settings.locName;

    this.marker.addListener('click', function() {
      self.setCurrent(selfLoc);
    });

    this.markerInfo = new google.maps.InfoWindow({
      content: '<div class="infoWindow"><h2>' + this.locName + '</h2></div>'
    });

    this.markerInfo.addListener('closeclick', function() {
      self.setCurrent(m.defaultLocation);
    });

    self.mapBounds.extend(this.marker.getPosition());
  };

  /** @description Sets the current Yelp or Surf spot item
   */
  this.setCurrent = function(item) {
    var previousLocation = self.currentLocation();
    if (previousLocation.locType !== 'default') {
      previousLocation.markerInfo.close();
      previousLocation.marker.setAnimation(null);
      previousLocation.isActive(false);
    }
    if (item.locType === 'surf') {
      item.loadForecast();
    }
    if (item.locType !== 'default') {
      item.markerInfo.open(self.map, item.marker);
      if (!item.marker.getAnimation()) {
        item.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
          item.marker.setAnimation(null);
        }, BOUNCE_DURATION);
      }
      item.isActive(true);
    }
    self.currentLocation(item);
  };

  // Checks if the input box is selected
  this.isSelected = ko.observable();

  this.locationDisplay = ko.computed(function() {
    if (self.isSelected()) {
      self.setCurrent(m.defaultLocation);
      self.tempList = _.filter(self.locations(), function(item) {
        var itemChars = item.locName.toLowerCase();
        var searchTermChars = self.searchTerm().toLowerCase();
        if (itemChars.indexOf(searchTermChars) !== -1) {
          /** Check if the marker is NOT visible */
          if (!item.marker.getVisible()) {
            /** If it wasn't visible, show it */
            item.marker.setVisible(true);
          }
          return item;
        } else {
          /** Turn off marker if it fails the filter test */
          item.marker.setVisible(false);
        }
      });
      // Only check bounds if locations are being filtered
      if(self.tempList.length !== self.locations().length){
        self.checkBounds();
      }
      return self.tempList;
    } else if (!self.isSelected() && self.searchTerm() === '') {
      return self.locations();
    } else {
      return self.tempList;
    }
  });

  /** @description
  *
  */
  this.checkBounds = function(){
    var markersOutOfBounds = [];
    _.each(self.locationDisplay(), function(item){
      if(!self.map.getBounds().contains(item.marker.getPosition())){
          markersOutOfBounds.push(item);
      }
    });
    if(markersOutOfBounds.length > 0){
      self.map.fitBounds(self.mapBounds);
    }
  };

  /** @description
   * The Google Map request is jsonp. Error handling is not
   * built in, so use a setTimout to handle the error.
   */
  var googleMapsTimeout = setTimeout(function() {
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

        self.mapBounds = new google.maps.LatLngBounds();

        self.map = new google.maps.Map($map, {
          center: {
            lat: m.mapCenter.lat,
            lng: m.mapCenter.lng
          },
          zoomControl: true
        });

        self.map.addListener('bounds_changed', function(){
          // TODO: Not sure how to handle this
        });
      });
  }

  /** @description
   * Yelp is also a jsonp request. Use a timeout to handle error
   */
  var yelpTimeout = setTimeout(function() {
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
        oauth_consumer_key: 'cxq1v3t-v5ZBP7fgQUCEkg',
        oauth_token: '_LqamVQhZLhs7LMDw62CeVXQPDfDVi_r',
        oauth_nonce: Math.floor(Math.random() * 1e12).toString(),
        oauth_timestamp: Math.floor(Date.now() / 1000),
        oauth_signature_method: 'HMAC-SHA1',
        callback: 'cb'
      },
      consumerSecret = 'BAK4r2WoFYdc2nSoGrjD14pc7Bo',
      tokenSecret = 'qb99XpkZ-lV26f7eNQ1nVofsGN8',
      /** Create signature for the request */
      signature = oauthSignature.generate(httpMethod, yelpUrl, parameters, consumerSecret, tokenSecret, {
        encodeSignature: false
      });
    /** Add the signature to the query string */
    parameters.oauth_signature = signature;

    return $.ajax(yelpUrl, {
        jsonpCallback: 'cb',
        dataType: 'jsonp',
        data: parameters,
        cache: true
      })
      .done(function(data) {
        clearTimeout(yelpTimeout);
        self.yelpStatus(STATUS.success);
        return data;
      });
  }

  /** @description
   * When all the ajax calls have returned, do this...
   */
  $.when(googleMaps(), getYelpData()).done(
    function(googleMaps, yelpData) {

      // TODO: Partition out the items so that I can add common properties
      // to all items and specific type-related info to others
      var yelpItems = yelpData[0].businesses,
      surfLocations = [];

      _.each(m.locationData, function(item){
        // Create new location
        var loc = new self.Loc(item, {
          locName: item.locName,
          lat: item.location[0],
          lng: item.location[1],
          icon: 'img/wave.png'
        });

        // Set the spot id
        loc.spotID = item.spotID;

        loc.locDescription = item.locDescription;
        
        // Classify this as a surf location
        loc.locType = 'surf';

        // Placeholder for spot forecast data to be displayed
        loc.forecast = ko.observableArray([null]);

        // Display loading status to user
        loc.forecastStatus = ko.observable(STATUS.loading);

        loc.forecastRange = [];

        // Stores all forecast data
        loc.forecastData = [];

        // Show the first day of 8 intervals
        loc.currentRange = [0, OFFSET];

        /**
        * @description Load the forecast for the chosen spot
        */
        loc.loadForecast = function() {
          if (loc.forecastStatus() !== STATUS.success) {
            var forecastTimeout = setTimeout(function() {
              loc.forecastStatus(STATUS.fail);
            }, AJAX_TIMEOUT_LENGTH);
            /** Get the magic seaweed info on the selected spot */
            $.ajax('http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66/forecast/?spot_id=' +
              loc.spotID +
              '&units=us&fields=swell.*,wind.*,timestamp', {
                dataType: 'jsonp'
              }).done(function(data) {
              clearTimeout(forecastTimeout);
              loc.forecastStatus(STATUS.success);
              loc.forecastData = data;
              loc.forecastRange = _.map(data, function(element) {
                return element.swell.components.primary.height;
              });
              loc.forecast(data.slice(0, OFFSET));
              loc.currentDayIndex = OFFSET;
            });
          }
        };

        loc.loadNextForecast = function() {
          this.setNextForecast(1);
        };

        loc.loadPrevForecast = function() {
          this.setNextForecast(-1);
        };

        loc.setNextForecast = function(direction) {
          /** Direction is 1 or -1
           * Moves the range of forecast data to show up or down */
          if (this.currentRange[0] + OFFSET * direction < 0) {
            this.currentRange = [this.forecastData.length - OFFSET, this.forecastData.length];
          } else if (this.currentRange[1] + OFFSET * direction > this.forecastData.length) {
            this.currentRange = [0, OFFSET];
          } else {
            this.currentRange = this.currentRange.map(function(val) {
              return val + OFFSET * direction;
            });
          }
          this.forecast(this.forecastData.slice(this.currentRange[0], this.currentRange[1]));
        };

        loc.isActive = ko.observable(false);

        // Add the surf location to list of locations
        self.locations.push(loc);
      });

      _.each(yelpItems, function(item){
        var loc = new self.Loc(item, {
          locName: item.name,
          lat: item.location.coordinate.latitude,
          lng: item.location.coordinate.longitude,
          icon: 'img/anchor.png'
        });

        loc.categories = item.categories.reduce(function(previousValue, currentValue, currentIndex, array) {
          var separator = '';
          if (currentIndex < array.length - 1) {
            separator = ', ';
          }
          return previousValue + currentValue[0] + separator;
        }, '');

        loc.locType = 'biz';

        loc.snippet_text = item.snippet_text;

        loc.display_phone = item.display_phone;

        loc.url = item.url;

        loc.rating_img_url = item.rating_img_url;

        loc.isActive = ko.observable(false);

        // Add the business location to list of locations
        self.locations.push(loc);
      });

      self.map.fitBounds(self.mapBounds);
    });

    // self.map.fitBounds(self.mapBounds);
    // Before loading the app, set the map bounds to contain all markers
    // self.checkBounds();
};

ko.applyBindings(new NewportMesaViewModel(), document.querySelector('.newport-mesa-app'));
