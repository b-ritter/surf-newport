### Newport/Mesa Surf

Newport/Mesa Surf is a surf report and neighborhood guide to Newport Beach and
Costa Mesa, California. It gets its data from three data APIs: Google Maps,
Yelp and Magic Seaweed. You'll have to run this site on a local server in
order to get things going. Using Python 2's built-in server is pretty handy:
`python -m SimpleHTTPServer [your port number, eg. 8888]`.

## Front-End Framework

The site originated as an assignment for Udacity's Front-End Developer
Nanodegree. It required students to use Knockout.js as a front-end framework,
the Google Maps API and at least one other data API.

## AJAX Features

Both Yelp and Magic Seaweed (MSW) are called with jQuery JSONP requests. The
application has five built-in locations that correspond to the surf spots within
Newport Beach. With the MSW Api, it is not possible to query locations. Thus,
the ID of the spot is hard-coded into the application's data. That ID is passed
along with the JSONP request.

Yelp, on the other hand, allows for querying locations. Therefore, locations are
returned based on on the highest rating within the bounding area of Newport
Beach and Costa Mesa.

## Filtering

The user is able to filter spot results with a search box. If the input text
matches part of the text of an item in the list of locations, that item remains
displayed in the list and the others disappear. When the user edits the field,
the list is updated live. (This is thanks to Knockout's observable array
feature!)

## d3

One of the main features of the project is a graph of swell heights and wind
speeds for each surf spot. The visualization library d3 provided the means to
bind data to and manipulate the DOM. The basic technique used here is outlined
in Mike Bostock's tutorial series [Let's Make a Bar Chart](https://bost.ocks.org/mike/bar/).
The charts here are responsive, however. Instead of setting height and width
explicitly, the viewBox attribute of SVG allows the graph to scale up and down
with the browser's viewport.

## Build Tools

As a build tool, this project used Gulp to concatenate source javascript files
and compile sass on the fly, with a watch command.
