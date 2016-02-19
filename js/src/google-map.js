
/** Google map and surf location parameters */
var map,
    mapCenter = { lat: 33.623201, lng: -117.9312093},
    defaultLoc = { locType: 'default'},
    currentItem = defaultLoc,
    locationList = ko.observableArray([]),
    searchTerm = ko.observable(''),
    isLoading = ko.observable(true),
    currentItemDisplay = ko.observable(currentItem),
    categoryList = ko.observableArray([]),
    markerAnimationCycleLength = 2100,
    /** Yelp credentials and parameters */
    httpMethod = 'GET',
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

/**
* @description Utility function to set the state of the app
* @param {object} item - Loc object to be set as the one and only current Loc
*/
function setCurrent(item) {
  if (item.locType === 'surf'){
    if(currentItem.locType !== 'default'){
      currentItem.isActive(false);
    }
    item.isActive(true);
    item.loadInfo();

  } else if (item.locType === 'biz') {
    if(currentItem.locType !== 'default'){
      currentItem.isActive(false);
    }
    item.isActive(true);
  } else if (item.locType === 'default' && currentItem.locType !== 'default'){
    currentItem.isActive(false);
  }
  currentItem = item;
  currentItemDisplay(item);
}

/**
*@description Handles when the Google Maps API fails to load
*/
setTimeout(function() {
  if(!window.google || !window.google.maps) {
    $('#map').text("Bummer! Failed to load Google Maps");
  }
}, 5000);

/**
* @description Google Maps API callback. Kicks-off the whole app
*/
function initMap() {
  /** First, we need to make the map object
  * Markers need to reference this object */
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: mapCenter.lat, lng: mapCenter.lng },
    zoomControl: true,
    zoom: 13
  });

  /** Resize map when the viewport is resized */
  google.maps.event.addDomListener(window, 'resize', function() {
   var center = map.getCenter();
   google.maps.event.trigger(map, 'resize');
   map.setCenter(center);
  });

  /** Make markers for each data item */
  locationData.forEach(function(locationItem){
    /** Create a marker */
    var marker = new google.maps.Marker({
      position: {lat: locationItem.location[0], lng: locationItem.location[1]},
      map: map,
      icon: 'img/wave.png',
      title: locationItem.locName
    });
    /** Create a marker info window */
    var markerInfo = new google.maps.InfoWindow(
      {content: '<div class="infoWindow"><h2>'+locationItem.locName+'</h2></div>' }
    );
    /** Assign the map marker and info window to the locationItem,
    * which is passed to Loc() to make an object with observable properties */
    locationItem.marker = marker;
    locationItem.markerInfo = markerInfo;
    locationItem.map = map;
    locationList.push(new SurfLoc(locationItem));
  });

  ko.applyBindings(new NewportViewModel(), document.getElementById('NewportMesaApp'));

  /** Add Yelp data once the map is loaded */
  google.maps.event.addListenerOnce(map, 'idle', function(){
      /** When the map is loaded, add the other locations */
      $.ajax({
        url: yelpUrl,
        jsonpCallback: 'cb',
        dataType: 'jsonp',
        data: parameters,
        cache: true,
        success: function(data){
          data.businesses.forEach(function(business){
            var categories = business.categories.reduce(function(previousValue, currentValue, currentIndex, array){
              var separator = '';
              if(currentIndex < array.length-1){
               separator = ', ';
              }
              return previousValue + currentValue[0] + separator;
            }, '');

            var marker = new google.maps.Marker({
              position: {
                lat: business.location.coordinate.latitude,
                lng: business.location.coordinate.longitude},
              map: map,
              icon: 'img/anchor.png',
              title: business.name
            });

            var markerInfo = new google.maps.InfoWindow(
              { content: '<div class="infoWindow"><h2>' + business.name + '</h2></div>' }
            );

            locationList.push(new BizLoc({
              marker: marker,
              markerInfo: markerInfo,
              map: map,
              locName: business.name,
              categories: categories,
              businessInfo: {
                display_phone: business.display_phone,
                url: business.url,
                rating_img_url: business.rating_img_url,
                snippet_text: business.snippet_text
              }
            }));
          });
          isLoading(false);
        }
      }).
      fail(
        function(){
          // TODO: Give something back to Knockout
        }
      );
  });
}
