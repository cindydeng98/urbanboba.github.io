
// Copyright: the OG Co-Daddies of GoDaddy 2017 Ruthaaaay & Shindy

var origjson;
var locationList = [];
var latList = [];
var longList = [];
var link;
var myLong, myLat;
var map, myLayer, geojson;
var latURL = "1MmaBYhiq1Mf1YMdILusnsThZ-Bk_zJzZlReKa7LtoZI";
var googleGeoCodeAPIKey = "AIzaSyAo2fOi3pBK404sfrRnzJc2zQN31eqJsrY";
var googleGeoLink = "https://maps.googleapis.com/maps/api/geocode/json?address=";

$( document ).ready(function()
{
	var options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0
	};

	function success(pos) {
		var crd = pos.coords;

		console.log('Your current position is:');
		console.log('Latitude : ' + crd.latitude);
		console.log('Longitude: ' + crd.longitude);
		console.log('More or less ' + crd.accuracy + ' meters.');

		myLong = crd.longitude;
		myLat = crd.latitude;
	//myLong = -79.941693;
	//myLat = 40.443772;
	 	Tabletop.init( { key: latURL, callback: convertToGeoJSON, simpleSheet: true } );
	};

	function error(err) {
		console.warn('ERROR(' + err.code + '): ' + err.message);
	};

	navigator.geolocation.getCurrentPosition(success, error, {timeout: 10000});

	$('#sub').click(function(event)
	{
			event.preventDefault();

	});

});

//reads data from the lat sorted sheet, calls the long sorted sheet function after done
function convertToGeoJSON(data) {
    origjson = data;

    for(i = 0; i < data.length; i++) {
				if(myLat+0.05 > data[i]["lat"] && myLat-0.05 < data[i]["lat"] &&
					 myLong+0.05 > data[i]["long"] && myLong-0.05 < data[i]["long"])
					 {
						// push location
						currLoc = [];
						currLoc.push(data[i]["place"]);
						currLoc.push(data[i]["address"]);
						currLoc.push(data[i]["city"]);
						currLoc.push(data[i]["lat"]);
						currLoc.push(data[i]["long"]);
						locationList.push(currLoc);
				}
    }
		sortList();
};

// helper function for calcDistance with the math stuff
function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
};

// calculates distance between two long&lat pairs
function calcDistance()
{
	for(i = 0; i < locationList.length; i++)
	{
		var dis = distance(myLat, myLong, locationList[i][3], locationList[i][4], "M");
		locationList[i].push(dis);
	}
};

// sort the list of locations
function sortList()
{
	calcDistance();
	// sort by distance
	locationList.sort(function (a, b) {
	  return a[5] - b[5]; // the distance from current location to the boba place
	});

	if (locationList.length > 10){
		locationList = locationList.slice(0, 10);
	}
	else
	{
		console.log("There are not that many milk tea places around you :(");
	}
	console.log(locationList);
	initMap();
};

//version 3 of marker code
//stores = locationList
function initMap()
{
	mapboxgl.accessToken = 'pk.eyJ1IjoiamVmZnN0ZXJuIiwiYSI6IlAzRFFiN0EifQ.mNWvayrLEw9wULuq0sopyA';
	var map = new mapboxgl.Map({
	    container: 'map', // container id
	    style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
	    center: [myLong, myLat], // starting position
	    zoom: 13 // starting zoom
	});


	var places = [];

	for(i = 0; i < locationList.length; i++)
	{
		var marker = {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [locationList[i][4], locationList[i][3]]
            },
            "properties": {
            //  "phoneFormatted": "(202) 234-7336",
          //    "phone": "2022347336",
						"name": locationList[i][0],
              "address": locationList[i][1],
              "city": locationList[i][2],
              "country": "United States",
						}
		};
		places.push(marker);
	}

	places.push({
    	type: 'Feature',
      properties: {
          title: 'Current Location',
          description: 'Where you are right now',
          'marker-color': '#FF7722',
          'marker-size': 'large',
          'marker-symbol': 'marker',
      },
      geometry: {
          type: 'Point',
          coordinates: [myLong, myLat]
         //coordinates:[40.7127, -74.0059]
      }
  });

	var stores = {
		"type": "FeatureCollection",
		"features": places
	};

	function flyToStore(currentFeature) {
	  map.flyTo({
	    center: currentFeature.geometry.coordinates,
	    zoom: 15
	  });
	}

	function createPopUp(currentFeature) {
	  var popUps = document.getElementsByClassName('mapboxgl-popup');
	  // Check if there is already a popup on the map and if so, remove it
	  if (popUps[0]) popUps[0].remove();

	  var popup = new mapboxgl.Popup({ closeOnClick: false, offset: -40})
	    .setLngLat(currentFeature.geometry.coordinates)
	    .setHTML('<h3>' + currentFeature.properties.name + '</h3>' +
	      '<h4>' + currentFeature.properties.address + '</h4>')
	    .addTo(map);
	}

  // Add the data to your map as a layer
	map.on('load', function(e) {
	  // Add the data to your map as a layer
		  map.addLayer({
		    id: 'locations',
		    type: 'symbol',
		    // Add a GeoJSON source containing place coordinates and information.
		    source: {
		      type: 'geojson',
		      data: stores
		    },
		    layout: {
		      'icon-image': 'cafe-15',
		      'icon-allow-overlap': true,
		    }
		  });
			buildLocationList();

			map.on('click', function(e) {
			  // Query all the rendered points in the view
			  var features = map.queryRenderedFeatures(e.point, { layers: ['locations'] });
			  if (features.length) {
			    var clickedPoint = features[0];
			    // 1. Fly to the point
			    flyToStore(clickedPoint);
			    // 2. Close all other popups and display popup for clicked store
			    createPopUp(clickedPoint);
			    // 3. Highlight listing in sidebar (and remove highlight for all other listings)
			    var activeItem = document.getElementsByClassName('active');
			    if (activeItem[0]) {
			      activeItem[0].classList.remove('active');
			    }
			    // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
			    var selectedFeature = clickedPoint.properties.address;

			    for (var i = 0; i < stores.features.length; i++) {
			      if (stores.features[i].properties.address === selectedFeature) {
			        selectedFeatureIndex = i;
			      }
			    }
			    // Select the correct list item using the found index and add the active class
			    var listing = document.getElementById('listing-' + selectedFeatureIndex);
			    listing.classList.add('active');
			  }
			});
	});
};

function buildLocationList() {
  // Iterate through the list of stores
  for (i = 0; i < locationList.length; i++) {
    var prop = locationList[i][0];
    // Shorten data.feature.properties to just `prop` so we're not
    // writing this long form over and over again.
    //var prop = locationList[i][1] + ' ' + locationList[i][2];
    // Select the listing container in the HTML and append a div
    // with the class 'item' for each store
    var listings = document.getElementById('listings');
    var listing = listings.appendChild(document.createElement('div'));
    listing.className = 'item';
    listing.id = 'listing-' + i;

    // Create a new link with the class 'title' for each store
    // and fill it with the store address
    link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'title';
    link.dataPosition = i;
    link.innerHTML = prop;

		link.addEventListener('click', function(e) {
		  // Update the currentFeature to the store associated with the clicked link
		  var clickedListing = data.features[this.dataPosition];
		  // 1. Fly to the point associated with the clicked link
		  flyToStore(clickedListing);
		  // 2. Close all other popups and display popup for clicked store
		  createPopUp(clickedListing);
		  // 3. Highlight listing in sidebar (and remove highlight for all other listings)
		  var activeItem = document.getElementsByClassName('active');
		  if (activeItem[0]) {
		    activeItem[0].classList.remove('active');
		  }
		  this.parentNode.classList.add('active');
		});

    // Create a new div with the class 'details' for each store
    // and fill it with the city and phone number
    var details = listing.appendChild(document.createElement('div'));
    details.innerHTML = locationList[i][2];
  }
}

// This will let you use the .remove() function later on
if (!('remove' in Element.prototype)) {
  Element.prototype.remove = function() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  };
}
