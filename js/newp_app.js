// Hardcode the location data for the surf spots since
// these don't really change much over time. The spot
// id is required for the magicseaweed api.
var locationData = [
  {
    "locName": "Newport Jetties",
    "spotID": "665",
    "location": [ 33.613733, -117.934251 ]
  },
  {
    "locName": "Blackies",
    "spotID": "2575",
    "location": [ 33.609367, -117.930719 ]
  },
  {
    "locName": "River Jetties",
    "spotID": "2599",
    "location": [ 33.628515, -117.957601 ]
  },
  {
    "locName": "The Wedge",
    "spotID": "287",
    "location": [ 33.593311, -117.881968 ]
  },

  {
    "locName": "Corona Del Mar",
    "spotID": "2579",
    "location": [ 33.592816, -117.877136 ]
  }
];

// Google map and surf location stuff
var map,
    mapCenter = { lat: 33.623201, lng: -117.9312093},
    currentItem = null,
    locationList = ko.observableArray([]),
    currentItemDisplay = ko.observable(currentItem),
    categoryList = ko.observableArray([]),
    markerAnimationCycleLength = 2100,
    // Yelp credentials and parameters
    httpMethod = 'GET',
    yelpUrl = 'https://api.yelp.com/v2/search?',
    parameters = {
        bounds: '33.587063, -117.968421|33.671254, -117.867103',
        term: 'coffee, breakfast burritos, tacos, burgers',
        sort: '2',
        oauth_consumer_key : 'cxq1v3t-v5ZBP7fgQUCEkg',
        oauth_token : '_LqamVQhZLhs7LMDw62CeVXQPDfDVi_r',
        oauth_nonce : Math.floor(Math.random() * 1e12).toString(),
        oauth_timestamp : Math.floor(Date.now() / 1000),
        oauth_signature_method : 'HMAC-SHA1',
        callback: 'cb',
        limit: 20
    },
    consumerSecret = 'BAK4r2WoFYdc2nSoGrjD14pc7Bo',
    tokenSecret = 'qb99XpkZ-lV26f7eNQ1nVofsGN8',
    // Create signature for the request
    signature = oauthSignature.generate(httpMethod, yelpUrl, parameters, consumerSecret, tokenSecret,
       { encodeSignature: false});
    // Add the signature to the query string
    parameters.oauth_signature = signature;

// Utility function to set the state of the app
function setCurrent(item) {
  if(currentItem !== null && item !== null){
    currentItem.isActive(false);
    item.isActive(true);
  }else if(currentItem !== null && item === null){
    currentItem.isActive(false);
  }
  currentItem = item;
  currentItemDisplay(item);
}

// Class definition for a surf location item
// Hits the magicseaweed api from php
var Loc = function(data){
  var self = this;
  this.locName = ko.observable(data.locName);
  this.isActive = ko.observable(false);
  this.marker = ko.observable(data.marker);
  this.markerInfo = ko.observable(data.markerInfo);
  this.map = ko.observable(data.map);
  // TODO: move surf-specific items into surf subclass
  this.spotID = data.spotID || null;
  this.forecast = null;
  this.businessInfo = ko.observable(data.businessInfo);
  // this.phone = ko.observable(data.phone);
  this.marker().addListener('click',function(){
    self.openInfoWindow();
  });
  this.markerInfo().addListener('closeclick', function(){
    setCurrent(null);
  });
  this.loadInfo = function(){
    var self = this;
    if(self.forecast === null){
      // Get the magic seaweed info on the selected spot
      $.ajax({
        url: 'php/msw.php',
        type: 'post',
        data: { 'action': 'getForecast', 'spot': this.spotID },
        success: function(data, status) {
          if(data){
            this.forecast = data;
          }
        },
        error: function(xhr, desc, err) {
          console.log(xhr);
          console.log("Details: " + desc + "\nError:" + err);
          // TODO: Give something back to Knockout
        }
      });
    }
  };
};

// Define method on prototype to open info window for a marker
Loc.prototype.openInfoWindow = function(){
  if(currentItem !== null){
    currentItem.markerInfo().close();
    currentItem.marker().setAnimation(null);
  }
  var self = this;
  this.markerInfo().open(this.map(), this.marker());
  if(!this.marker().getAnimation()){
    this.marker().setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){
      self.marker().setAnimation(null);
    }, markerAnimationCycleLength);
  }
  // making currentItem itself an observable prevents the info window
  // from opening
  // setCurrent() sets an observable equal to the current item
  setCurrent(this);
};

// Specify stuff for surf loc
SurfLoc = function(data){
  Loc.call(this,data);
};

SurfLoc.prototype = Object.create(Loc.prototype);

// Specify stuff for business loc

BusLoc = function(data){
  Loc.call(this,data);
};

BusLoc.prototype = Object.create(Loc.prototype);


// Define the callback function that kicks off the entire map
function initMap() {
  // First, we need to make the map object
  // Markers need to reference this object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: mapCenter.lat, lng: mapCenter.lng },
    zoomControl: true,
    zoom: 13
  });

  // Make markers for each data item
  locationData.forEach(function(locationItem){
    // Create a marker
    var marker = new google.maps.Marker({
      position: {lat: locationItem.location[0], lng: locationItem.location[1]},
      map: map,
      title: locationItem.locName
    });
    // Create a marker info window
    var markerInfo = new google.maps.InfoWindow(
      {content: "<h2>"+locationItem.locName+"</h2>" }
    );
    // Assign the map marker and info window to the locationItem,
    // which is passed to Loc() to make an object with observable properties
    locationItem.marker = marker;
    locationItem.markerInfo = markerInfo;
    locationItem.map = map;
    locationList.push(new Loc(locationItem));
  });

  // Setup the ViewModel for the markers
  var ListViewModel = function(){
    var self = this;
    this.searchTerm = ko.observable('');
    this.locations = ko.computed(function(){
      // Live filtering of locations
      if(currentItem !== null){
        currentItem.markerInfo().close();
      }
      var tempList = _.filter(locationList(), function(item){
        var itemChars = item.locName().toLowerCase();
        var searchTermChars = self.searchTerm().toLowerCase();
        if(itemChars.indexOf(searchTermChars) !== -1){
          // Check if the marker is NOT visible
          if(!item.marker().getVisible()){
            // If it wasn't visible, show it
            item.marker().setVisible(true);
          }
          // Give the item back to tempList to show it
          return item;
        } else {
          // Turn off marker if it fails the filter test
          item.marker().setVisible(false);
        }
      });
      if(tempList.length === 0){
        // If there are no results that pass the filter,
        // show them all
        setCurrent(null);
        return locationList();
      } else if (tempList.length === 1){
        // If there is only one match, set it as the current item
        setCurrent(tempList[0]);
        // currentItem.openInfoWindow();
        return currentItem;
      }else {
        setCurrent(null);
        return tempList;
      }
    });

    this.showLocation = function(){
      this.openInfoWindow();
      setCurrent(this);
    };
  };

  ko.applyBindings(new ListViewModel(), document.getElementById('NewportMesaApp'));

  // Add Yelp data once the map is loaded
  google.maps.event.addListenerOnce(map, 'idle', function(){
      // When the map is loaded, add the other locations
      $.ajax({
        url: yelpUrl,
        jsonpCallback: 'cb',
        dataType: 'jsonp',
        data: parameters,
        cache: true,
        success: function(data){
          console.log(data);
          data.businesses.forEach(function(business){
            var marker = new google.maps.Marker({
              position: {
                lat: business.location.coordinate.latitude,
                lng: business.location.coordinate.longitude},
              map: map,
              title: business.name
            });
            var markerInfo = new google.maps.InfoWindow(
              {content: "<h2>"+business.name+"</h2>" }
            );
            locationList.push(new Loc({
              marker: marker,
              markerInfo: markerInfo,
              map: map,
              locName: business.name,
              businessInfo: {
                phone: business.phone,
                url: business.url,
                snippet: business.snippet,
                rating: business.rating,
                review_count: business.review_count
              }
            }));
          });
        }
      }).
      fail(
        function(){
          // TODO: Give something back to Knockout
        }
      );
  });
}
