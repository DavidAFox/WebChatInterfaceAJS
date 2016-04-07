angular.module('connectionModule', []).
factory('httpConnection', ['$http', '$interval', function($http, $interval) {
	return function(config) {
		var conn = {};
		var error;
		var onmessage;
		var getMessages;
		var messageGetter;
		var token = '';
		conn.ready = false;
		var addAuth = function() {
			if(token !== '') {
				return token;
			}
			return null;
		};
		conn.send = function(message) {
			$http.post(config.scheme + config.server + message.Command, message.Args, {headers: {'Authorization': addAuth}}).then(onmessage, error);
		};
		onmessage = function(response) {
			var message = {};
			if (response.headers('success') === 'true') {
				message.Success = true;
			} else {
				message.Success = false;
			}
			message.Code = parseInt(response.headers('code'));
			message.Type = response.config.url.slice(config.scheme.length+config.server.length);
			if(typeof response.data.Data !== 'undefined' && typeof response.data.String !== 'undefined') {
				message.Data = response.data.Data;
				message.String = response.data.String;
			} else {
				message.Data = response.data;
			}
			if(message.Type === 'login' && message.Success === true) {
				conn.ready = true;
				token = JSON.parse(message.Data);
				messageGetter = $interval(getMessages, 1000);
			}
			config.onmessage(message);
		};
		error = function(response) {
			if(response.status !== 404) {
				$interval.cancel(messageGetter);
				token = '';
				conn.ready = false;
				if(typeof config.resetLogin === 'function') {
					config.resetLogin();
				}
				var message = {};
				message.Success = false;
				message.Type = response.config.url.slice(config.scheme.length+config.server.length);
				if(message.Type === 'login' || message.Type === 'register') {
					message.Data = "Error connecting to server."
					config.onmessage(message);
				}
			}
		};
		getMessages = function() {
			$http.get(config.scheme + config.server + 'messages', {headers: {'Authorization': addAuth}}).then(onmessage, error);
		};
		return conn;
	};
}]).
factory('websocketConnection', ['$timeout', function($timeout){
	return function(config) {
		var conn = {};
		var error;
		var onmessage;
		var websocket;
		var logged = false;
		const OPEN = 1;
		const CONNECTING = 0;
		if(config.scheme !== 'ws://' && config.scheme !== 'wss://') {
			console.log("Invalid websocket scheme: "+ config.scheme + " using ws://");
			config.scheme = 'ws://';
		}
		if(typeof config.server === 'undefined' || config.server === '') {
			console.log("no server provided in config");
			return;
		}
		websocket = new WebSocket(config.scheme+config.server);
		conn.ready = function() {
			return logged;
		};
		conn.send = function(message) {
			if (websocket.readyState === OPEN) {
				websocket.send(JSON.stringify(message));
			} else if (websocket.readyState === CONNECTING) {
				$timeout(function(){websocket.send(JSON.stringify(message))}, 1000)
			} else {
				conn.close();
				config.resetLogin();
				logged = false;
			}			
		};
		conn.close = function() {
			websocket.close();
		};
		websocket.onmessage = function (event) {
			var message = JSON.parse(event.data)
			if (message.Type === 'login' && message.Success === 'true') {
				logged = true;
			}
			if (typeof config.onmessage === 'function') {
				config.onmessage(message);
			} else {
				console.log("onmessage not function");
			}
		};
		websocket.onerror = function(err) {
			console.log(err)
			config.resetLogin();
			websocket.close();
			logged = false;
		};
		return conn;
	};
}]);
