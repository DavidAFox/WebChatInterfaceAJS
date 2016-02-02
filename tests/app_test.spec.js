describe("basic sanity and setup tests", function() {
	it("should pass", function() {
		expect(true).toBe(true);
	});
	it('should inject dependencies', inject(function($http) {
		expect($http).toBeDefined();
	}));
});
describe("Main App", function(){
	var fake = {};
	fake.send = function() {
	}
	var fakeConnection  = function() {
		return function(config) {
			fake.onmessage = config.onmessage
			return fake;
		};
	};
	beforeEach(module('chatInterface'));
	beforeEach(module('userNames'));
	var $controller;
	beforeEach(inject(function(_$controller_) {
		$controller = _$controller_; 
	}));
	describe("MainController", function() {
		var $scope;
		var controller;
		var focus;
		beforeEach(function() {
			$scope = {};
			focus = function(){return}
			controller = $controller('MainController', {$scope: $scope, serverInfo: {scheme: 'http://', address: 'testAddress/'}, httpConnection: fakeConnection(), websocketConnection: fakeConnection(), focus: focus});
		});
		it("should send a login command", function(){
			spyOn(fake, 'send');
			$scope.doLogin('name', 'password');
			expect(fake.send).toHaveBeenCalledWith({Command: 'login', Args: ['name', 'password']})
		});
		describe("updateMessages", function() {
			var messages;
			beforeEach(function(){
				messages = [					
					{Type: 'Send', TimeString: 'Now', Sender: 'Bob', Text: 'hi'},
					{Type: 'Server', Text: 'The Server says hi'}, 
					{Type: 'Join', Subject: 'Bob', Text: 'has joined the room.'}, 
					{Type: 'Tell', Sender: 'Bob', Reciever: 'You', Time: 'Now', ToReciever: true, Text: 'hi'}
				]
			});
			beforeEach(function(){
				controller.addMessage = function(message){
					$scope.messages.push(message);
					return;
				};
			});
			it('should add the message to messages', function() {
				controller.updateMessages(messages);
				expect($scope.messages.length).toEqual(4);
			});
			it('should have the first message in the first spot', function() {
				controller.updateMessages(messages);
				expect($scope.messages[0].Type).toEqual('Send');
			});
		});
		describe("send", function() {
			it('should create a tell command', function() {
				spyOn(fake, 'send');
				$scope.send('/tell Bob hi');
				expect(fake.send).toHaveBeenCalledWith({Command: 'tell', Args: ['Bob', 'hi']});
			});
			it('should create a send command', function() {
				spyOn(fake, 'send');
				$scope.send('hey Bob');
				expect(fake.send).toHaveBeenCalledWith({Command: 'send', Args: ['hey', 'Bob']})
			});
		});
	});
	describe("chatMessage", function() {
		var $compile;
		var $rootScope;
		beforeEach(inject(function(_$compile_, _$rootScope_){
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		}));
		it('replaces the message with the right format for Send message', function(){
			$rootScope.message = {Type: 'Send', TimeString: 'Now', Sender: 'Bob', Text: 'hi'};
			var element = $compile("<chat-message></chat-message>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toMatch(/Now \[.*Bob.*\]: hi/)
		});
		it('replaces the message with the right format for Server message', function() {
			$rootScope.message = {Type: 'Server', Text: 'The Server says hi'};
			var element = $compile("<chat-message></chat-message>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toContain("The Server says hi");
		});
		it('replaces the message with the right format for Join message', function() {
			$rootScope.message = {Type: 'Join', Subject: 'Bob', Text: 'has joined the room.'};
			var element = $compile("<chat-message></chat-message>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toMatch(/.*Bob.* has joined the room/);
		});
		it('replaces the message with the right format for Tell to message', function() {
			$rootScope.message = {Type: 'Tell', Sender: 'You', Reciever: 'Bob', TimeString: 'Now', ToReciever: false, Text: 'hi'};
			var element = $compile("<chat-message></chat-message>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toMatch(/Now \[To .*Bob.*\]: hi/)
		});
		it('replaces the message with the right format for Tell from message', function() {
			$rootScope.message = {Type: 'Tell', Sender: 'Bob', Reciever: 'You', TimeString: 'Now', ToReciever: true, Text: 'hi'};
			var element = $compile("<chat-message></chat-message>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toMatch(/Now \[From .*Bob.*\]: hi/);
		});
	});
	describe("friendlist", function() {
		var $compile;
		var $rootScope;
		beforeEach(inject(function(_$compile_, _$rootScope_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		}));
		it('should display the friendlist', function(){
			$rootScope.friendlist = [{Name: 'Bob', Room: 'Lobby'}, {Name: 'Fred', Room: 'StarWars'}]
			var element = $compile("<friendlist></friendlist>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toMatch(/.*Bob.*\- Lobby/)
			expect(element.html()).toMatch(/.*Fred.*\- StarWars/)
		});
	});
	describe("wholist", function() {
		var $compile;
		var $rootScope;
		beforeEach(inject(function(_$compile_, _$rootScope_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
		}));
		it('should display the wholist', function(){
			$rootScope.wholist = {Room: 'Lobby', Clients: ['Bob', 'Fred']};
			var element = $compile("<wholist></wholist>")($rootScope);
			$rootScope.$digest();
			expect(element.html()).toContain("Bob");
			expect(element.html()).toContain("Fred");
		});
	});
});