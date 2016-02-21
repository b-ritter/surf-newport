var Model = function() {
  'use strict';
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
    // TODO: move surf-specific items into surf subclass
    // this.phone = ko.observable(data.phone);
    this.marker().addListener('click', function() {
      self.openInfoWindow();
    });
    this.markerInfo().addListener('closeclick', function() {
      setCurrent(defaultLoc);
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
    setCurrent(this);
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
      setCurrent(self);
    });
  };

  this.SurfLoc.prototype = Object.create(Loc.prototype);
  this.SurfLoc.constructor = Loc;

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
        dataType: 'jsonp',
        success: function(data) {
          self.forecastData = data;
          self.forecastRange = _.map(data, function(element) {
            return element.swell.components.primary.height;
          });

          self.forecast(data.slice(0, self.offset));
          self.currentDayIndex = self.offset;
        },
        error: function(e) {
          self.forecast('Couldn\'t load forecast');
        }
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

  this.BizLoc.prototype = Object.create(Loc.prototype);

};
