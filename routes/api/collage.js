var express = require('express');
var fs = require('fs');
var router = express.Router();
var Busboy = require('busboy');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require("path");

module.exports = function(db){

    var dir = './uploads/';
    var sessions = {};
    
    router.post('/', function(req, res, next) {
        if (sessions[req.ip]) {
            res.status(403);
            return res.end();
        }
        
        var identifier = Math.random().toString(36).substring(2);
        sessions[req.ip] = {
            identifier: identifier,
            status: 'Uploading',
            progress: 0,
            process: null
        };
        var gotTextInput = false;
        var gotSize = false;
        var gotFileInput = false;
        var size;
        var child;
        var busboy = new Busboy({ headers: req.headers });
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            console.log("Downloading field " + fieldname);
            if (fieldname === 'textinput') {
                /*var lines = val.split('\r\n');
                var maxLength = 0;
                for (var i = 0; i < lines.length; i++) {
                    lines[i] = lines[i].replace(/[^ ]/g, '#').replace(/[^#]/g, '-');
                    if (lines[i].length > maxLength) {
                        maxLength = lines[i].length;
                    }
                }
                for (var i = 0; i < lines.length; i++) {
                    while (lines[i].length < maxLength) {
                        lines[i] += '-';
                    }
                    lines[i] = '-' + lines[i] + '-';
                }
                var prefix = '';
                var suffix = '';
                for (var i = 0; i < maxLength + 2; i++) {
                    prefix += '-';
                    suffix += '-'
                }
                prefix += '\n';
                suffix += '\n';
                text = prefix + lines.join('\n') + '\n' + suffix;*/
                
                fs.writeFileSync(dir + identifier + '.txt', val);
                console.log(val);
                console.log('Got text input');
                gotTextInput = true;
            }
            else if (fieldname === 'size') {
                size = parseInt(val);
                console.log(size);
                console.log('Got size');
                gotSize = true;
            }
        });
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log("Downloading file");
            if (fieldname === 'fileinput') {
                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }
                var extension = filename.replace(/^.*\./, '');
                if (extension !== 'zip') return;
                var fstream = fs.createWriteStream(dir + identifier + '.zip');
                fstream.on('finish', function() {
                    if (sessions[req.ip]) {
                        sessions[req.ip].status = 'Unzipping';
                    }
                    child = spawn('unzip', [dir + identifier + '.zip', '-d', dir + identifier]);
                    child.stdout.on('data', function (data) {
                        //console.log('stdout: ' + data);
                    });
                    child.stderr.on('data', function(data) {
                        //console.log('stderr: ' + data);
                    });
                    child.on('close', function(code) {
                        //console.log('child process exited with code ' + code);
                        console.log('Got file input');
                        gotFileInput = true;
                    });
                });
                file.pipe(fstream);
            }
        });
        busboy.on('finish', function() {
            //console.log('Done receiving form');
        });
        
        req.on('close', function() {
            if (child) {
                child.kill('SIGKILL');
            }
            cancelRequest(req.ip);
        });
        
        req.pipe(busboy);
    
        var intervalId = setInterval(function() {
            if (gotTextInput && gotSize && gotFileInput) {
                generateCollage(identifier, size, req, res);
                clearInterval(intervalId);
            }
        }, 100, 0);
	});
	
    router.get('/progress', function(req, res, next) {
        if (sessions[req.ip]) {
            console.log('Sending progress: ' + sessions[req.ip].progress);
            res.json({ status: sessions[req.ip].status, 
                      progress: sessions[req.ip].progress });
        }
        else {
            res.status(403);
            return res.end();
        }
    });
    
    function generateCollage(identifier, size, req, res) {
        if (sessions[req.ip]) {
            sessions[req.ip].status = 'Generating';
            var imgDir = dir + identifier;
            var inputFile = dir + identifier + '.txt';
            var outputFile = dir + identifier + '.jpg';
            console.log('Generating collage..');
            console.log('\tImage directory: ' + imgDir);
            console.log('\tInput file:      ' + inputFile);
            console.log('\tTile size:       ' + size);
            console.log('\tOutput file:     ' + outputFile);

            var process = spawn('./CollageGenerator', [imgDir, inputFile, size, outputFile]);
            process.stdout.on('data', function (data) {
                console.log('stdout: ' + data);
                data = data.toString();
                if (data.startsWith('PROGRESS')) {
                    var temp = data.split(' ')[1].split('/');
                    var progress = parseFloat(temp[0]) / parseFloat(temp[1]);
                    if (sessions[req.ip]) {
                        sessions[req.ip].progress = progress;
                    }
                }
            });
            process.stderr.on('data', function(data) {
                console.log('stderr: ' + data);
            });
            process.on('close', function(code) {
                //console.log('Exited with code ' + code);
                console.log('Finished!');
                if (fs.existsSync(dir + identifier + '.jpg')) {
                    var body = fs.readFileSync(dir + identifier + '.jpg');
                    var data = new Buffer(body, 'binary').toString('base64');
                    res.send(data);
                }
                else {
                    res.status(400);
                    res.end();
                }
                setTimeout(function() {
                    cleanup(identifier, req.ip);
                }, 1000);
            });
            process.on('error', function() {
                console.log("ERROR");
            });
            sessions[req.ip].process = process;

            /*var files = fs.readdirSync(dir + identifier);
            var response = '';
            for (var i = 0; i < files.length; i++) {
                if (files[i] !== '__MACOSX')
                    response += files[i] + '<br/>';
            }
            res.end(response);*/
        }
        else {
            res.end();
        cleanup(identifier, req.ip);
        }
    }
    
    function cleanup(identifier, key) {
        if (sessions[key]) {
            delete sessions[key];
        }
        if (fs.existsSync(dir + identifier + '.zip')) {
            fs.unlinkSync(dir + identifier + '.zip');
        }
        if (fs.existsSync(dir + identifier + '.txt')) {
            fs.unlinkSync(dir + identifier + '.txt');
        }
        if (fs.existsSync(dir + identifier + '.jpg')) {
            fs.unlinkSync(dir + identifier + '.jpg');
        }
        deleteFolderRecursive(dir + identifier);
    }
    
    function cancelRequest(key) {
        if (sessions[key].process) {
            sessions[key].process.kill('SIGKILL');
        }
        cleanup(sessions[key].identifier, key);
        console.log('Request from ' + key + ' cancelled!');
    }

	return router;
}

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};