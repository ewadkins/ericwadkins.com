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

function mapLocations(locations) {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 3,
        center: new google.maps.LatLng(39.8104592,-101.2962492),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var infowindow = new google.maps.InfoWindow();

    var marker, i;

    for (i = 0; i < locations.length; i++) { 
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i][1], locations[i][2]),
            map: map
        });

        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(locations[i][0]);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }
}