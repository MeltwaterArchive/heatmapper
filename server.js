#!/usr/bin/env node
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var DataSift = require('datasift-node');
var currentHash = false;
var clientCount = 0;

if (process.argv.length != 4) {
	console.log('Usage: server.js <datasift_username> <datasift_api_key>');
	process.exit(1);
}
var ds = new DataSift(process.argv[2], process.argv[3]);

var getNewHash = function(config, callback) {
	var csdl = 'interaction.geo geo_box "' + config.bounds.ne[0] + ',' + config.bounds.sw[1] + ':' + config.bounds.sw[0] + ',' + config.bounds.ne[1] + '"';
	if (config.csdl) {
		csdl += ' and (' + config.csdl + ')';
	}
	if (config.sample && config.sample != 100) {
		csdl += ' and interaction.sample <= ' + config.sample;
	}
	console.log('Validating CSDL: ' + csdl);
	ds.validate({ 'csdl': csdl }, function (err, response) {
		if (err) {
			console.log(err);
			io.emit('error', {'message': err.message});
		} else {
			console.log('Validated, compiling...');
			ds.compile({ 'csdl': csdl }, function (err, response) {
				if (err) {
					console.log(err);
					io.emit('error', {'message': err.message});
				} else {
					console.log('Hash: ' + response.hash);
					callback(response.hash);
				}
			});
		}
	});
}

app.get('/', function(req, res){
	res.sendFile(__dirname + '/www/index.html');
});

http.listen(3000, function(){
	console.log('Listening on *:3000');
});

io.on('connection', function(socket) {
	// Subscribe to the current hash on the first client's connection.
	console.log('Client connected');
	clientCount++;
	if (currentHash && clientCount == 1) {
		ds.subscribe(currentHash);
	}

	// Handle restart-stream messages.
	socket.on('restart-stream', function(config){
		if (currentHash) {
			ds.unsubscribe(currentHash);
			currentHash = false;
		}
		getNewHash(config, function(hash) {
			currentHash = hash;
			ds.subscribe(currentHash);
		});
	});

	// Unsubscribe from the current hash on the last client's disconnection.
	socket.on('disconnect', function() {
		console.log('Client disconnected');
		clientCount--;
		if (currentHash && clientCount == 0) {
			ds.unsubscribe(currentHash);
			currentHash = '';
		}
	})
});

ds.on('connect', function () {
	console.log('Connected to DataSift');
});

ds.on('disconnect', function() {
	currentHash = false;
	console.log('Disconnected. Reconnecting...');
	setTimeout(function() { ds.connect(); }, 1000);
});

ds.on('error', function (error) {
	console.log('DS error: ' + error);
	io.emit('error', {'message': error.message});
});

ds.on('interaction', function (data) {
	if (data.data.interaction.geo.latitude != 0 && data.data.interaction.geo.latitude != 1 && data.data.interaction.geo.latitude != -1 &&
			data.data.interaction.geo.longitude != 0 && data.data.interaction.geo.longitude != 1 && data.data.interaction.geo.longitude != -1) {
		io.emit('coords', data.data.interaction.geo);
	}
});

ds.connect();
