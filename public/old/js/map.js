$(function() {
    resize();
    $.get("api/viewdata" + window.location.search, function(data) {
        $('#loadingNotice').remove();
        var locations = data
                        .map(function(x) { return { loc: x.latLong, text: '<b>' + x.cityRegionCountry + '</b><br>' + '<a target="blank" href="http://maps.google.com/?q=' + x.latLong + '">' + x.latLong.replace(',', ',  ') + '</a><br><br><b>' + x.ip + '</b><br>' + x.range.replace(',', ' - ') + '<br>' + (x.domain !== '(unknown)' ? x.domain + ' (' + x.longDomain + ')' : '(unknown domain)') + (x.crawler == true ? '<br>' + '<i>LIKELY A WEB CRAWLER</i>' : '') + '<br><br><b>' + new Date(x.date).toLocaleTimeString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short', hour12: true }) + '</b><br>ericwadkins.com' + x.path }})
                        .filter(function(x) { return x.loc !== '(unknown)' })
                        .map(function(x) { return [x.text].concat(x.loc.split(',').map(parseFloat).map(perturb)) });
        mapLocations(locations);
    });
    
    $(window).on('resize', resize);
});

function resize() {
    $('#map').width($(window).width());
    $('#map').height($(window).height());
}

function approximateBellCurve() {
    return (Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 6;
}

function perturb(x) {
    return x + 0.001 * (approximateBellCurve() - 0.5);
}

var markClusters = window.location.search.indexOf('noclusters') === -1;
var map, markerClusterer;
function mapLocations(locations) {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 3,
        center: new google.maps.LatLng(39.8104592,-101.2962492),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();
    
    var data = [];
    var markers = locations.map(function (location, i) {
        var opt = {
            position: new google.maps.LatLng(location[1], location[2]),
        };
        data.push(opt.position);
        if (!markClusters) {
            opt.map = map;
        } else {
            opt.icon = {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: 'red',
                fillOpacity: 1.0,
                strokeOpacity: 0.10,
            };
        }
        var marker = new google.maps.Marker(opt);

        google.maps.event.addListener(marker, 'click', (function (marker, i) {
            return function() {
                infowindow.setContent(location[0]);
                infowindow.open(map, marker);
            }
        })(marker, i));
        
        return marker;
    });
    
    var maxZoom = 16;
    if (markClusters) {
        markerClusterer = new MarkerClusterer(map, markers,{ maxZoom: maxZoom, gridSize: 45,
                                                        imagePath: 'img/markers/m' });
    }
    // https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m
    
    var previousZoomLevel;
    var clusterClickTriggeredZoom = false;
    google.maps.event.addListener(map, 'zoom_changed', function() {
        if (clusterClickTriggeredZoom) {
            if (map.getZoom() > maxZoom + 1) {
                map.setZoom(maxZoom + 1);
            } else if (map.getZoom() - previousZoomLevel > 5) {
                map.setZoom(previousZoomLevel + 5);
            }
            clusterClickTriggeredZoom = false;
        }
    });
    
    google.maps.event.addListener(markerClusterer, 'clusterclick', function(cluster) {
        previousZoomLevel = map.getZoom();
        clusterClickTriggeredZoom = true;
    });
}