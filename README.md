### Newport/Mesa Surf

Newport/Mesa Surf is a surf report and neighborhood guide to Newport Beach and
Costa Mesa, California. It gets its data from three data APIs: Google Maps,
Yelp and Magic Seaweed.

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

## Build Tools

As a build tool, this project used Gulp to concatenate source javascript files
and compile sass on the fly, with a watch command.

## d3

One of the main features of the project is a graph of swell heights and wind
speeds for each surf spot.
