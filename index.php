<!doctype html>

<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <title>Newport Beach / Costa Mesa</title>
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        color: #932b2b;
      }
      #map {
        width: 100%;
        height: 100%;
      }
      #search {
        position: absolute;
        background-color: white;
        z-index: 1;
        width: 25vw;
        height: 75vh;
      }
      li {
        list-style-type: none;
      }
    </style>
  </head>
  <body>
    <div id="search">
      <input data-bind="textInput: searchTerm" type="text" name="mapFilter" placeholder="Search">
      <ul data-bind="foreach: locations" id="location-list">
        <li data-bind="text: $data.locName, click: $parent.showLocation"></li>
      </ul>
    </div>
    <div id="map">
    </div>

    <script src="js/libs/jquery.min.js"></script>
    <script src="js/libs/knockout-3.2.0.js"></script>
    <script src="js/libs/underscore.js"></script>
    <script src= "js/newp_app.js"></script>
    <script async defer
      src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAtqzH53xQyC04PbQFV4brTqidjBzhr_dI&callback=initMap">
    </script>
  </body>
</html>
