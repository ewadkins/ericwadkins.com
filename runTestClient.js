module.exports = {
    run: run
};

function run(host, port, callback) {
    var net = require('net');
    var client = new net.Socket();
    var numRequests = 2;
    var count = 0;

    client.connect(port, host, function() {
        console.log('Connected to ' + host + ":" + port);
        for (var i = 0; i < numRequests; i++) {
            setTimeout(function(i) {
                return function() {
                    if (client.writable)
                        client.write('Ping ' + (i + 1) + '!\n');
                };
            }(i), 1000 * i);
        }
    });

    client.on('data', function(data) {
        count++;
        console.log(host + ': ' + data.toString());
        if (count == numRequests) {
            client.destroy();  
        }
    });

    client.on('close', function(err) {
        if (!err) {
            console.log('Connection closed');
        }
        client.destroy();
        if (callback)
            callback();
    });

    client.on('error', function(err) {
        console.log(err.message);
    });
}