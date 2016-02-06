var app = angular.module('chatInterface', ['connectionModule', 'userNames', 'luegg.directives']);
app.value('serverInfo', {scheme: 'http://', address: 'localhost:8080/'});//change these to the location of the server
app.directive('chatMessage', function(){
	return {
		template: 	'<div data-ng-switch="message.Type">' +
						'<div data-ng-switch-when="Tell">' +
							'<div data-ng-switch="message.ToReciever">' +
								'<div data-ng-switch-when="true">' +
									'{{message.TimeString}} [From <user user-name="{{message.Sender}}">{{message.Sender}}</user>]: {{message.Text}}</br>'+
								'</div>' +
								'<div data-ng-switch-when="false">' +
									'{{message.TimeString}} [To <user user-name="{{message.Reciever}}">{{message.Reciever}}</user>]: {{message.Text}}</br>' +
								'</div>' +
							'</div>' +
						'</div>' +
						'<div data-ng-switch-when="Join">' +
							'<user user-name="{{message.Subject}}">{{message.Subject}}</user> {{message.Text}}</br>' +
						'</div>' +
						'<div data-ng-switch-when="Server">' +
							'{{message.Text}}</br>' +
						'</div>' +
						'<div data-ng-switch-when="Send">' +
							'{{message.TimeString}} [<user user-name="{{message.Sender}}">{{message.Sender}}</user>]: {{message.Text}}' +
						'</div>' +
						'<div data-ng-switch-default>' +
							'{{message}}' +
						'</div>' +
					'</div>',
		restrict: 'E'
	};
});
app.directive('friendlist', function(){
	return {
		template: 	'<div data-ng-repeat="friend in friendlist" track by $index>' +
						'<user user-name="{{friend.Name}}">{{friend.Name}}</user>- {{friend.Room}}' +
					'</div>',
		restrict: 'E'
	};
});
app.directive('wholist', function() {
	return  {
		template: 	'<div data-ng-repeat="person in wholist.Clients track by $index">' +
						'<user user-name="{{person}}"></user>' +
					'</div>',
		restrict: 'E' 
	};
});
app.factory('focus', ['$timeout', '$window', function($timeout, $window){
	return function(id) {
		$timeout(function(){
			var element = $window.document.getElementById(id);
			if(element) {
				element.focus();
			}
		});
	};
}]);

app.controller('MainController', ['$scope','$interval', 'serverInfo', 'httpConnection', 'websocketConnection', 'focus', function($scope, $interval, serverInfo,httpConnection, websocketConnection, focus){
	const LOGIN = 0;
	const REGISTER = 1;
	const LOGGED = 2;
	var that = this;
	var messageGetter;
	$scope.loggedState = LOGIN;
	$scope.messages = [];
	$scope.loginMessage = "";
	$scope.newAccountMessage = "";
	$scope.wholist = {Room: "", Clients: []};
	$scope.friendlist = []
	$scope.send = function(str) {
		if (str.slice(0,1) === '/') {
			str = str.slice(1)
		} else {
			str = 'send ' + str
		}
		var array = str.split(" ");
		$scope.conn.send({Command: array[0],Args: array.slice(1)});
		$scope.input = ""
	};
	$scope.toggelNewAccount = function() {
		$scope.loggedState = REGISTER;
	}
	$scope.toggelLogin = function() {
		$scope.loggedState = LOGIN
	}
	var config = {
		resetLogin: function() {
			$scope.loggedState = LOGIN;
			$interval.cancel(messageGetter);
		},
		scheme: serverInfo.scheme,
		server: serverInfo.address,
		onmessage: function(message) {
			if (!message.Success) {
				switch (message.Type.toLowerCase()) {
					case "register":
  						$scope.newAccountMessage = message.Data;
   						return;
   					case "login":
	   					$scope.loginMessage = message.Data;
   						return;
   					default:
		   				that.addMessage(message.Data);
	   					return;
   				}   				
			}
			switch (message.Type.toLowerCase()) {
				case "login":
					update();
					$scope.loggedState = LOGGED;
					messageGetter = $interval(update, 1000);
   					return;
   				case "register":
   					$scope.newAccountMessage = message.Data;
   					return;
				case "friendlist":
					if(!arrayEqualFunc($scope.friendlist, message.Data, function(element, index){
							return element.Name === message.Data[index].Name && element.Room === message.Data[index].Room;
						}
					)) {
						$scope.friendlist = message.Data;
					}
					return;
				case "who":
					if(!arrayEqualFunc($scope.wholist.Clients, message.Data.Clients, function(element, index){return element === message.Data[index];})) {
						$scope.wholist = message.Data;
					}
					return;
				case "messages":
					that.updateMessages(message.Data);
					return;
				case "update":
					$scope.friendlist = message.Data.friendlist;
					$scope.wholist = message.Data.who;
					that.updateMessages(message.Data.messages);
					return;
				default:
					if (message.String !== "") {
						that.addMessage(message.String);
					}
					return;
			}
		}
	};
	if('WebSocket' in window) {
		$scope.conn = websocketConnection(config);
	} else {
		$scope.conn = httpConnection(config);
	}
	var arrayEqualFunc = function(array1, array2, func) {
		if(!array1 || !array2) {
			return false;
		}
		if(array1.length !== array2.length) {
			return false;
		}
		if(!array1.every(func)){
			return false;
		}
		return true
	};
	this.addMessage = function(message) {
		$scope.messages.push(message);
	};
	this.updateMessages = function(messages) {
		messages.forEach(this.addMessage);
	};
	var update = function() {
		$scope.conn.send({Command: 'friendlist', Args: []});
		$scope.conn.send({Command: 'who', Args: []});
	};
	$scope.doLogin = function(name, password) {
		$scope.conn.send({Command: 'login', Args: [name, password]});
	};
	$scope.block = function(name) {
		console.log("blocking");
		$scope.conn.send({Command: 'block', Args: [name]});
	};
	$scope.unblock = function(name) {
		$scope.conn.send({Command: 'unblock', Args: [name]});
	};
	$scope.friend = function(name) {
		$scope.conn.send({Command: 'friend', Args: [name]});
	};
	$scope.unfriend = function(name) {
		$scope.conn.send({Command: 'unfriend', Args: [name]});
	};
	$scope.tell = function(name) {
		$scope.input = "/tell " + name+ " ";
		focus('chat-input');
	};
	$scope.doRegister = function(name, password, password2) {
		if(password === password2) {
			$scope.conn.send({Command: 'register', Args: [name, password]});
		} else {
			$scope.newAccountMessage = "Passwords do not match!"
		}
	};
	$scope.status = {
		isopen: false
	};
	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
}]);

app.directive('chatInterface', function() {

	return {
		controller: 'MainController',
		templateUrl: 'webchat.html',
		restrict: 'E'
	}
})