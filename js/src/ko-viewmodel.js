
/**
* @description Knockout.js ViewModel for the app
*/
var NewportViewModel = function(){
  var self = this;

  this.locations = ko.computed(function(){
      // Live filtering of locations
      if(currentItem.locType !== 'default'){
        currentItem.markerInfo().close();
      }

      var tempList = _.filter(locationList(), function(item){
        var itemChars = item.locName().toLowerCase();
        var searchTermChars = searchTerm().toLowerCase();
        if(itemChars.indexOf(searchTermChars) !== -1){
          /** Check if the marker is NOT visible */
          if(!item.marker().getVisible()){
            /** If it wasn't visible, show it */
            item.marker().setVisible(true);
          }
          /** Give the item back to tempList to show it */
          return item;
        } else {
          /** Turn off marker if it fails the filter test */
          item.marker().setVisible(false);
        }
      });

      if(tempList.length === 0){
        // If there are no results that pass the filter,
        // show them all
        setCurrent(defaultLoc);
        return locationList();
      } else if (tempList.length === 1){
        // If there is only one match, set it as the current item
        setCurrent(tempList[0]);
        currentItem.openInfoWindow();
        return currentItem;
      } else {
        setCurrent(defaultLoc);
        return tempList;
      }
  });

  this.showLocation = function(){
    this.openInfoWindow();
    setCurrent(this);
  };

  /* TODO: Remove or keep filter buttons */
  this.showSurfSpots = function(){
    locationList(self.filterByType('surf'));
  };

  this.showRestaurants = function(){
    locationList(self.filterByType('biz'));
  };

  this.filterByType = function(type){
    var locs = _.filter(locationList(), function(item){
      if (item.locType === type){
        return item;
      }
    });
    return locs;
  };
};
