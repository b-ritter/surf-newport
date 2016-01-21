
var map,
    locationList = ko.observableArray([]);

var Loc = function(data){
  this.locName = ko.observable(data.locName);
  this.marker = ko.observable(data.marker);
};

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 33.6417186, lng: -117.9143306},
    zoomControl: true,
    zoom: 13
  });

  $.getJSON('_data/locations.json', function(data){
    // Make markers for each data item
    data.forEach(function(locationItem){
      var marker = new google.maps.Marker({
        position: {lat: locationItem.location[0], lng: locationItem.location[1]},
        map: map,
        title: locationItem.locName
      });
      locationItem.marker = marker;
      locationList.push(new Loc(locationItem));
    });

    var ListViewModel = function(){
      this.locations = locationList;
      this.showLocation = function(){
        console.log(this.marker());
      };
    };

    ko.applyBindings(new ListViewModel(), document.getElementById('location-list'));

  }).error(
    function() {
      console.log('foo');
    }
  );


}



// var marker = new google.maps.Marker({
//   position: { lat: locationItem.location[0], lng: locationItem.location[1] },
//   map: map,
//   title: locationItem.name
// });
