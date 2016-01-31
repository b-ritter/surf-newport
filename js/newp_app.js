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
  /*
  // Maybe include Huntington
  ,{
    "locName": "Huntington Pier",
    "spotID": "286",
    "location": [ 33.655574, -118.003023 ]
  },
  {
    "locName": "Goldenwest",
    "spotID": "4039",
    "location": [ 33.667683, -118.018097 ]
  },
  {
    "locName": "Bolsa Chica",
    "spotID": "3797",
    "location": [ 33.700753, -118.053186 ]
  },
  {
    "locName": "Seal Beach Pier",
    "spotID": "285",
    "location": [ 33.700753, -118.053186 ]
  }
  */
];


// Google map and surf location stuff
var map,
    ko,
    $,
    google,
    oauthSignature,
    console,
    document,
    _,
    setTimeout,
    mapCenter = { lat: 33.623201, lng: -117.9312093},
    currentLoc = ko.observable(null),
    currentItem = null,
    locationList = ko.observableArray([]),
    markerAnimationCycleLength = 2100;

// Yelp stuff
var httpMethod = 'GET',
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
    // generates a RFC 3986 encoded, BASE64 encoded HMAC-SHA1 hash
    signature = oauthSignature.generate(httpMethod, yelpUrl, parameters, consumerSecret, tokenSecret,
       { encodeSignature: false});

    parameters.oauth_signature = signature;



// Class definition for a surf location item
// Hits the magicseaweed api from php
var Loc = function(data){
  this.locName = ko.observable(data.locName);
  this.marker = ko.observable(data.marker);
  this.markerInfo = ko.observable(data.markerInfo);
  this.spotID = data.spotID || null;
  this.forecast = null;
  this.loadInfo = function(){
    var self = this;
    if(self.forecast === null){
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

// Define the callback function
function initMap() {
  // First, we need to make the map object
  // Markers need to reference this object
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: mapCenter.lat, lng: mapCenter.lng },
    zoomControl: true,
    zoom: 13
  });

  // Add Yelp stuff once the map is loaded
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
              locName: business.name
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

  // Make markers for each data item
  // TODO: make markers observable
  locationData.forEach(function(locationItem){
    var marker = new google.maps.Marker({
      position: {lat: locationItem.location[0], lng: locationItem.location[1]},
      map: map,
      title: locationItem.locName
    });

    var markerInfo = new google.maps.InfoWindow(
      {content: "<h2>"+locationItem.locName+"</h2>" }
    );

    marker.addListener('click', bounce);

    function bounce() {
      // marker will return a falsy value if not animating
      console.log(this.marker());
      markerInfo.open(map, marker);
      if(currentItem !== null){
        currentItem.markerInfo().close();
      }
      if(!marker.getAnimation()){
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
          marker.setAnimation(null);
        }, markerAnimationCycleLength);
      }
    }
    locationItem.marker = marker;
    locationItem.markerInfo = markerInfo;
    locationList.push(new Loc(locationItem));
  });

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
        return locationList();
      } else if (tempList.length === 1){
        // If there is only one match, set it as the current item
        currentItem = tempList[0];
        currentItem.markerInfo().open(map, currentItem.marker());
        return currentItem;
      }else {
        return tempList;
      }
    });
    this.showLocation = function(){
      if(currentItem !== null){
        currentItem.marker().setAnimation(null);
        currentItem.markerInfo().close();
      }
      this.markerInfo().open(map, this.marker());
      this.marker().setAnimation(google.maps.Animation.BOUNCE);
      var self = this;
      setTimeout(function(){
        self.marker().setAnimation(null);
      }, markerAnimationCycleLength);
      this.loadInfo();
      currentItem = this;
    };
  };
  ko.applyBindings(new ListViewModel(), document.getElementById('search'));
}



// var marker = new google.maps.Marker({
//   position: { lat: locationItem.location[0], lng: locationItem.location[1] },
//   map: map,
//   title: locationItem.name
// });
