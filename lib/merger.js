self.addEventListener('message', function(e) {
  importScripts('ngeohash.js'); 
  var points = e.data.points1;
  var d = e.data;
  var max_dist = 500;
  /*if (d.zoom == 3){
    max_dist = 500;
  } else if (d.zoom == 4){
    max_dist = 450;
  } else if (d.zoom == 5){
    max_dist = 400;
  } else if (d.zoom == 6){
    max_dist = 350;
  } else if (d.zoom == 7){
    max_dist = 300;
  } else if (d.zoom == 8){
    max_dist = 250;
  } else if (d.zoom == 9){
    max_dist = 200;
  } else if (d.zoom == 10){
    max_dist = 150;
  } else if (d.zoom >= 11){
    max_dist = 100;
  } else if (d.zoom >= 12){
    max_dist = 75;
  } else if (d.zoom >= 13){
    max_dist = 50;
  } else if (d.zoom >= 14){
    max_dist = 25;
  } else if (d.zoom >= 15){
    max_dist = 20;
  } else if (d.zoom >= 16){
    max_dist = 15;
  } else if (d.zoom >= 17){
    max_dist = 10;
  } else if (d.zoom >= 18){
    max_dist = 10;
  }*/
  var max_dist = 500
  var generateHash = function (){
    var merged = false;
    var hmap = {};
    for(var i in points){
        var moveon = false;
        for(var j in points){
            if (i == j) {
                continue;
            }
            var key1 = points[i].id + points[j].id;
            var key2 = points[j].id + points[i].id;
            if (key1 in hmap || key2 in hmap){
                continue;
            }
            var distance = euclidean(points[i],points[j]);
            if (distance <= max_dist){
                mergePoints(points[i], points[j]);
                merged = true;
                moveon = true;
                break;
            }
            hmap[key1] = {'distance':distance};
        }
        if(moveon){
          continue;
        }
    }
    return merged;
  }
  function sectionPoint(p1,p2){
       var m1 = p2.count;//agg.doc_count2
       var m2 = p1.count;//agg.doc_count1
       var p3 = {};
       p3.count = p1.count+ p2.count;
       p3.center={};
       p3.center.latitude = ( (m1*p2.center.latitude) + (m2*p1.center.latitude) ) / (m1+m2);
       p3.center.longitude = ( (m1*p2.center.longitude) + (m2*p1.center.longitude) ) / (m1+m2);
       var newGeoHash = geohash.encode (p3.center.latitude , p3.center.longitude, precision=3)
       var bounds = geohash.decode_bbox(newGeoHash);
       p3.min = [bounds[0], bounds[1]];
       p3.max = [bounds[2], bounds[3]];
       p3.id = guid();
       return p3;
  }
  function mergePoints(p1, p2){
        var p3 = sectionPoint(p1,p2);
        delete points[p1.id];
        delete points[p2.id];
        points[p3.id] = p3;
  }
  function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
                   .toString(16)
                   .substring(1);
      }
      var k = s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      return k;
  }
  function euclidean(v1, v2) {
        var radlat1 = Math.PI * v1.center.latitude/180
        var radlat2 = Math.PI * v2.center.latitude/180
        var radlon1 = Math.PI * v1.center.longitude/180
        var radlon2 = Math.PI * v2.center.longitude/180
        var theta = v1.center.longitude-v2.center.longitude;
        var radtheta = Math.PI * theta/180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515
        //if (unit=="K") { dist = dist * 1.609344 }
        //if (unit=="N") { dist = dist * 0.8684 }
        return dist
   }
  while(true){
    if (!generateHash(points)){
      break;
    }
  }
   
  for(var i in points){
    self.postMessage({"point": points[i]});
  }

}, false);