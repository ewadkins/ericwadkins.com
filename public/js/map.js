$(function() {
    $.get("api/viewdata" + window.location.search, function(data) {
        $('#loadingNotice').remove();
        var locations = data
                        .map(function(x) { return x.latLong })
                        .filter(function(x) { return x !== '(unknown)' })
                        .map(function(x) { return [''].concat(x.split(',').map(parseFloat).map(perturb)) });
        mapLocations(locations);
    });
});

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