var Model = function() {
  'use strict';

  // Checks if Yelp has Failed
  this.yelpFailed = ko.observable(false);

  // Center of the map: Newport Beach, CA
  this.mapCenter = {
    lat: 33.6218095,
    lng: -117.9121563
  };

  this.mapBounds = {

  };

  this.defaultLocation = {
    locName: 'Newport/Mesa',
    description: 'Newport Beach and Costa Mesa are neighboring cities in Orange County, CA.',
    locType: 'default'
  };


  // A list of permanent locations, with Magic Seaweed Spot ID code
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
};
