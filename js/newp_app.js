
var map,
    currentItem = null,
    locationList = ko.observableArray([]),
    markerAnimationCycleLength = 2100;


// The template for a location item
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
        }
      });
    }
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
    // TODO: make markers observable
    data.forEach(function(locationItem){
      var marker = new google.maps.Marker({
        position: {lat: locationItem.location[0], lng: locationItem.location[1]},
        map: map,
        title: locationItem.locName
      });

      var markerInfo = new google.maps.InfoWindow(
        {content: "<h2>"+locationItem.locName+"</h2>" }
      );
      marker.addListener('click', toggleBounce);
      function toggleBounce() {
        // marker will return a falsy value if not animating
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
