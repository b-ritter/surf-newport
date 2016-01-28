
var map,
    currentItem = null,
    locationList = ko.observableArray([]),
    forecastEndpoint = 'http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66'+
        '/forecast/?spot_id={spot}&units=us&fields=swell.components.*,wind.*,timestamp';

// The template for a location item
var Loc = function(data){
  this.locName = ko.observable(data.locName);
  this.marker = ko.observable(data.marker);
  this.markerInfo = ko.observable(data.markerInfo);
  this.spotID = data.spotID || null;
  this.forecast = '';
  this.loadInfo = function(){
    var self = this;
    $.getJSON(forecastEndpoint.replace('{spot}', this.spotID), function(data){
      self.forecast = data;
      console.log(self.forecast);
    }).error(
      function(){
        console.log('Error loading forecast');
      }
    );
  };
};

// Define the callback function
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 33.6417186, lng: -117.9143306},
    zoomControl: true,
    zoom: 13
  });

  $.getJSON('data/locations.json', function(data){
    // Make markers for each data item
    data.forEach(function(locationItem){
      var marker = new google.maps.Marker({
        position: {lat: locationItem.location[0], lng: locationItem.location[1]},
        map: map,
        title: locationItem.locName
      });
      var markerInfo = new google.maps.InfoWindow(
        {content: "<h2>"+locationItem.locName+"</h2>" }
      );
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
            if(!item.marker().getVisible()){
              item.marker().setVisible(true);
            }
            return item;
          } else {
            item.marker().setVisible(false);
          }
        });
        if(tempList.length === 0){
          return locationList();
        } else if (tempList.length === 1){
          currentItem = tempList[0];
          currentItem.markerInfo().open(map, currentItem.marker());
          return currentItem;
        }else {
          return tempList;
        }
      });
      this.showLocation = function(){
        if(currentItem !== null){
          currentItem.markerInfo().close();
        }
        this.markerInfo().open(map, this.marker());
        this.loadInfo();
        currentItem = this;
      };
    };
    ko.applyBindings(new ListViewModel(), document.getElementById('search'));

  })
  .error(
    function() {
      console.log('Locations not found');
    }
  );
}



// var marker = new google.maps.Marker({
//   position: { lat: locationItem.location[0], lng: locationItem.location[1] },
//   map: map,
//   title: locationItem.name
// });
