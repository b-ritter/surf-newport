var m = new Model();

var NewportMesaViewModel = function() {
  'use strict';
  console.log(m.locationData);
};
/** Magic Seaweed Sample API Request */
$.ajax('http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66/forecast/?spot_id=665', {
  dataType: 'jsonp'
}).
fail(function(error) {
    console.log(error);
  })
  .done(function(data) {
    console.log(data);
  });

/** Google Maps Sample API Request */
$.ajax('https://maps.googleapis.com/maps/api/js?key=AIzaSyAtqzH53xQyC04PbQFV4brTqidjBzhr_dI', {
  dataType: 'jsonp'
}).
fail(function(error) {
    console.log(error);
  })
  .done(function(data) {
    var $map = document.querySelector('.map'),
      mapCenter = {
        lat: 33.623201,
        lng: -117.9312093
      },
      map = new google.maps.Map($map, {
        center: {
          lat: mapCenter.lat,
          lng: mapCenter.lng
        },
        zoomControl: true,
        zoom: 13
      });

    var marker = new google.maps.Marker({
      position: {
        lat: mapCenter.lat,
        lng: mapCenter.lng
      },
      map: map,
      icon: 'img/anchor.png',
      title: 'Newport Beach'
    });

  });

ko.applyBindings(new NewportMesaViewModel(), document.querySelector('.cat-app'));
