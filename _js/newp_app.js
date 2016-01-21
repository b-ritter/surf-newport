
var map,
    locationList = ko.observableArray([]);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 33.6417186, lng: -117.9143306},
    zoomControl: true,
    zoom: 13
  });

  $.getJSON('_data/locations.json', function(data){
    data.forEach(function(locationItem){
      locationList.push(locationItem);
      var marker = new google.maps.Marker({
        position: {lat: locationItem.location[0], lng: locationItem.location[1]},
        map: map,
        title: locationItem.name
      });
    });
    
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
