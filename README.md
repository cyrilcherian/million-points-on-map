# Million Points On Map
Demo [Example](http://cyrilcherian.github.io/million-points-on-map/simpleMap.html) - Special thanks to [Bonsai.io](https://bonsai.io/) for hosting the demo cluster

Sentiment Analysis Demo [Example](http://cyrilcherian.github.io/million-points-on-map/myMap.html)

If you are into big data visualization on map, then sooner or later you will face this inevitable question ...*Can we show all the million+ data points  on the map?*

Well I have been haunted by this query for quite some time unless I came up with a solution.

Before I go directly into the answer let us understand some techniques and their pit falls.

##### Should I go SVG?
With SVG million points mean million DOM elements, thus making the browser slow and unresponsive.
Moreover the time taken to draw the million DOM elements will be large that it may make your browser unresponsive.

We can make use of some smart plugins like leaflet cluster, but this plugin displays maximum of 50000 points.
Refer: [50000 points](http://leaflet.github.io/Leaflet.markercluster/example/marker-clustering-realworld.50000.html)

##### Should I go Canvas?
With Canvas there are no million DOM elements like SVG, however you will need to draw a million points on zooming and panning.
So the browser becomes unresponsive during zooming and panning.

Its evident from above that a complete solution does not house solely in the client side. We need a server side component to handle this. 
Taking elastic search support (https://www.elastic.co/).

###### Elastic Index details
* Index name: points
* Type name: point
* Field *point* stores the geo point information, [More Info...](https://www.elastic.co/guide/en/elasticsearch/reference/1.3/mapping-geo-point-type.html)
* Elastic mapping details as under

```json
{
  "points": {
    "mappings": {
      "point": {
        "properties": {
          "point": {
            "type": "geo_point"
          },
          "sentiment": {
            "type": "float"
          }
        }
      }
    }
  }
}
```

The elastic query shown under operates on the map bounds(top left, bottom right) and zoom level to get all the consolidated points.

```javascript
{
   "query":{
      "filtered":{
         "filter":{
            "geo_bounding_box":{
               "point":{
                  "top_left":{
                     "lat":p.bounds.trlat,//top right latitude
                     "lon":p.bounds.trlon //top right longitude
                  },
                  "bottom_right":{
                     "lat":p.bounds.bllat,//bottom right latitude
                     "lon":p.bounds.bllon//bottom right longitude
                  }
               }
            }
         }
      }
   },
   "aggs":{
      "zoom":{
         "geohash_grid":{
            "field":"point",//filed on which the aggregation need to work
            "precision":p.zoom//zoom can have values from 1 to 8
         }
      }
   }
}
```
For client side read comments in the code
[Refer](https://github.com/cyrilcherian/million-points-on-map/blob/master/simpleMap.html#L24-103).

##### On the client side:

1) First Make a map and add that to map div as shown below:
```
    var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			maxZoom: 9, //set the zoom level as 9
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
		});
    map = L.map('map', { zoom: 13, layers: [tiles]});
    map.setView([22.295006, 78.945313], 3);
```

2) On drag and load event call the search function
```
  map.on('load', function(e){search()});//call search on load
  map.on('zoomend dragend',function(e){search();});//call search on drag end
```
3) Make use of marker cluster group plugin to group points. For more [info] (https://github.com/Leaflet/Leaflet.markercluster)

```
 markers = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,//spiderify effect when many points have same lat/lon
    showCoverageOnHover: true,
    iconCreateFunction: function(cluster) {
        //Grouping the cluster returned by the server, if 
        var markers = cluster.getAllChildMarkers();
        var markerCount = 0;
        markers.forEach(function(m){markerCount = markerCount + m.count;});
        return new L.DivIcon({ html: '<div class=" clustergroup0 leaflet-marker-icon marker-cluster marker-cluster-medium leaflet-zoom-animated leaflet-clickable" tabindex="0" style="margin-left: -20px; margin-top: -20px; width: 40px; height: 40px; z-index: 233;"><div><span>'+markerCount+'</span></div></div>' });
        }
    });
    map.addLayer(markers);
```

4) The search function which will get called on loading and on drag. This makes an elastic search call for a given boundary.

Following will get the boundary of the map we have on our view port.

```
  var b = map.getBounds();
  var b1 = {
      "trlat": b.getNorthWest().lat,
      "trlon": b.getNorthWest().lng, 
      "bllat": b.getSouthEast().lat, 
      "bllon": b.getSouthEast().lng
  }
```
Set the zoom level:

```
  //Get the zoom level
    var zoom = 3;
    if(map.getZoom() >= 5 && map.getZoom() <= 8){
        zoom =4;
    }
    else if(map.getZoom() >= 9 && map.getZoom() <= 11){
        zoom =5;
    }
    else if(map.getZoom() >= 12 && map.getZoom() <= 14){
        zoom =6;
    }
    else if(map.getZoom() >= 15 && map.getZoom() <= 17){
        zoom =7;
    }
    else if(map.getZoom() >= 18){
        zoom =8;
    }
```

Next call the elastic search with zoom and bounding box details as described [here](#elastic-index-details)


