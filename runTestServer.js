module.exports = {
    run: run,
    isAlive: isAlive,
    kill: kill
};

var child;
var alive = false;

function run(port, verbose) {
    verbose = verbose || true;
    var exec = require('child_process').exec;

    var debug = true;
    child = exec('java -cp java/TestServer/bin Server port=' + port + ' debug=' + debug);
    alive = true;

    child.stdout.on('data', function(data) {
        if (verbose) console.log('[' + child.pid + '] stdout: ' + data);
    });

    child.stderr.on('data', function(data) {
        if (verbose) console.log('[' + child.pid + '] stderr: ' + data);
    });

    child.on('exit', function(code) {
        if (verbose) console.log('\n[' + child.pid + '] Exit code: ' + code);
        alive = false;
    });
}

function isAlive() {
    return alive;
}

function kill() {
    child.kill('SIGINT');
}