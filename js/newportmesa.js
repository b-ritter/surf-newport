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

  this.defaultLocation = {
    locName: 'Newport Beach',
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
          return item;
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
