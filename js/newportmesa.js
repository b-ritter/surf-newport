var isYelpLoading = ko.observable(true);

var Model = function() {
  'use strict';

  var self = this;

  // Checks if Yelp locations are loading


  // Checks if Yelp has Failed
  this.yelpFailed = ko.observable(false);

  // Center of the map: Newport Beach, CA
  this.mapCenter = {
    lat: 33.623201,
    lng: -117.9312093
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



  /**
   * @description Represents a location item
   * @constructor
   * @param {array} data - Location data
   * @returns Location object
   */
  this.Loc = function(data) {
    var self = this;
    this.locName = ko.observable(data.locName);
    this.isActive = ko.observable(false);
    this.marker = ko.observable(data.marker);
    this.markerInfo = ko.observable(data.markerInfo);
    this.map = ko.observable(data.map);
    this.errorMessage = '';
    this.marker().addListener('click', function() {
      self.openInfoWindow();
    });
    this.markerInfo().addListener('closeclick', function() {
      // setCurrent(defaultLoc);
      searchTerm('');
    });
  };

  /**
   * @description Opens info window for current item
   */
  this.Loc.prototype.openInfoWindow = function() {
    if (currentItem.locType !== 'default') {
      currentItem.markerInfo().close();
      currentItem.marker().setAnimation(null);
    }
    var self = this;
    this.markerInfo().open(this.map(), this.marker());
    if (!this.marker().getAnimation()) {
      this.marker().setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        self.marker().setAnimation(null);
      }, markerAnimationCycleLength);
    }
    // setCurrent() sets an observable equal to the current item
    // setCurrent(this);
  };

  /**
   * @description Represents a location item for a surf spot
   * @constructor
   * @param {array} data - Hard-coded Surf Location data
   * @returns Surf Location object
   */
  this.SurfLoc = function(data) {
    var self = this;
    this.locType = 'surf';
    Loc.call(this, data);
    this.forecast = ko.observableArray([null]);
    this.forecastRange = [];
    this.locDescription = data.locDescription;
    this.forecastData = [];
    /** There are 8 intervals of forecast data per day */
    this.offset = 8;
    /** Show the first day of 8 intervals */
    this.currentRange = [0, 8];
    this.spotID = data.spotID;
    this.marker().addListener('click', function() {
      self.loadInfo();
      // setCurrent(self);
    });
  };

  this.SurfLoc.prototype = Object.create(this.Loc.prototype);
  this.SurfLoc.constructor = this.Loc;

  /**
   * @description Loads forecast info from Magic Seaweed API
   */
  this.SurfLoc.prototype.loadInfo = function() {
    var self = this;
    if (self.forecast()[0] === null) {
      /** Get the magic seaweed info on the selected spot */
      $.ajax({
        url: 'http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66/forecast/?spot_id=' +
          self.spotID +
          '&units=us&fields=swell.*,wind.*,timestamp',
        dataType: 'jsonp'})
      .done(function(data){
        self.forecastData = data;
        self.forecastRange = _.map(data, function(element) {
          return element.swell.components.primary.height;
        });
        self.forecast(data.slice(0, self.offset));
        self.currentDayIndex = self.offset;
      })
      .fail(function(error) {
        self.errorMessage('Couldn\'t load forecast');
      });
    }
  };

  /**
   * @description Loads the set of forecast info for the next day
   */
  this.SurfLoc.prototype.loadNextForecast = function() {
    /** There are 8 forecast intervals in one day
     * Load the next 8 on click */
    this.setNextForecast(1);
  };

  /**
   * @description Loads the set of forecast info for the previous day
   */
  this.SurfLoc.prototype.loadPrevForecast = function() {
    // There are 8 forecast intervals in one day
    this.setNextForecast(-1);
  };

  /**
   * @description Utility function to get next forecast
   * @returns Next forecast, either previous or next
   */
  this.SurfLoc.prototype.setNextForecast = function(direction) {
    /** Direction is 1 or -1
     * Moves the range of forecast data to show up or down */
    var self = this;
    if (this.currentRange[0] + this.offset * direction < 0) {
      this.currentRange = [this.forecastData.length - this.offset, this.forecastData.length];
    } else if (this.currentRange[1] + this.offset * direction > this.forecastData.length) {
      this.currentRange = [0, this.offset];
    } else {
      this.currentRange = this.currentRange.map(function(val) {
        return val + self.offset * direction;
      });
    }
    this.forecast(this.forecastData.slice(this.currentRange[0], this.currentRange[1]));
  };

  /**
   * @description Represents a location item for a business
   * @constructor
   * @param {array} data - data from Yelp
   * @returns Business Location object
   */
  this.BizLoc = function(data) {
    this.locType = 'biz';
    this.snippet_text = data.businessInfo.snippet_text;
    this.display_phone = data.businessInfo.display_phone;
    this.url = data.businessInfo.url;
    this.rating_img_url = data.businessInfo.rating_img_url;
    this.categories = data.categories;
    Loc.call(this, data);
  };

  this.BizLoc.prototype = Object.create(this.Loc.prototype);

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
