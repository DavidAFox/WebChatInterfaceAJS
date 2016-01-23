describe('httpConnection tests', function() {
	var $httpBackend;
	var httpConnection;
	var config = function(){
		var conf = {};
		conf.recievedMessage = {};
		conf.server = 'testAddress/';
		conf.scheme = 'http://';
		conf.resetCalled = false;
		conf.onmessage = function(message){
			conf.recievedMessage = message;
			return;
		};
		conf.resetLogin = function() {
			conf.resetCalled = true;
		};
		return conf;
	}();
	var conn;
	var successfulLoginResponse = function(method, url, data, headers, params) {
		return [200, '"token"', {success: true, code: 0}];
	};
	var headers = {'Authorization': 'token', 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json;charset=utf-8'}
	var getHeaders = {'Authorization': 'token', 'Accept': 'application/json, text/plain, */*'}
	beforeEach(module('connectionModule'));
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
	}));
	beforeEach(inject(function($injector){
		$interval = $injector.get('$interval');
	}));
	beforeEach(inject(function(_httpConnection_) {
		httpConnection = _httpConnection_;
	}));
	beforeEach(function(){
		conn = httpConnection(config);
	});
	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});
	it('should start with a ready of false before login', function() {
		expect(conn.ready).toBe(false);	
	});
	describe('login tests', function() {
		const USER_AND_PWORD_DONT_MATCH = 21;
		var failResponse = function(method, url, data, headers, params) {
			return [200, {data: ''}, {success: false, code: USER_AND_PWORD_DONT_MATCH}];
		};
		describe('successful login', function() {
			beforeEach(function() {
				$httpBackend.expectPOST('http://testAddress/login', ['testName', 'validPassword']).respond(successfulLoginResponse);
				conn.send({Command: 'login', Args: ['testName', 'validPassword']});
				$httpBackend.flush();
			});
			it('should have a ready of true after successful login', function() {
				expect(conn.ready).toBe(true);
			});
			it('should have a message with Type login', function() {
				expect(config.recievedMessage.Type).toEqual('login');
			});
			it('should have a message with Code 0', function() {
				expect(config.recievedMessage.Code).toEqual(0);
			});
		});
		it('should have a ready of false after unsuccessful login', function() {
			$httpBackend.expectPOST('http://testAddress/login', ['testName', 'invalidPassword']).respond(failResponse);
			conn.send({Command: 'login', Args: ['testName', 'invalidPassword']});
			$httpBackend.flush();
			expect(conn.ready).toBe(false);
		});
	});
	describe('send message tests', function() {
		beforeEach(function(){
			$httpBackend.expectPOST('http://testAddress/login', ['testName', 'validPassword']).respond(successfulLoginResponse);
			conn.send({Command: 'login', Args: ['testName', 'validPassword']});
			$httpBackend.flush();
		});
		it('should send its token with requests after it is logged in', function(){
			$httpBackend.expectPOST('http://testAddress/send', ['this', 'is', 'a', 'message'], headers).respond(function(){
				return [200, {data: ''}, {success: true, code: 0}]
			});
			conn.send({Command: 'send', Args: ['this', 'is', 'a', 'message']});
			$httpBackend.flush();
		});
		describe('unauthorized response tests', function() {
			beforeEach(function(){
				$httpBackend.expectPOST('http://testAddress/send', ['hi'], headers).respond(function(){
					return [401, {data: ''}, {'WWW-Authenticate': 'token'}];
				});
				conn.send({Command: 'send', Args: ['hi']});
				$httpBackend.flush();
			});
			it('should go back to not ready when it gets a non-200 response', function() {
				expect(conn.ready).toBe(false);
			});
			it('should call the reset login funciton', function() {
				expect(config.resetCalled).toBe(true);
			});
		}); 
	});
	describe('test message getting', function() {
		var sampleMessageResponse = function() {
				return [200, {data: [
					{Type: 'Send', TimeString: 'Now', Sender: 'Bob', Text: 'hi'},
					{Type: 'Server', Text: 'The Server says hi'}, 
					{Type: 'Join', Subject: 'Bob', Text: 'has joined the room.'}, 
					{Type: 'Tell', Sender: 'Bob', Reciever: 'You', Time: 'Now', ToReciever: true, Text: 'hi'}
				]}];
		};
		beforeEach(function(){
			$httpBackend.expectPOST('http://testAddress/login', ['testName', 'validPassword']).respond(successfulLoginResponse);
			conn.send({Command: 'login', Args: ['testName', 'validPassword']});
			$httpBackend.flush();
		});
		it('should send a request to get messages after 1000 when logged in', function(){
			$httpBackend.expectGET('http://testAddress/messages', getHeaders).respond(sampleMessageResponse);
			$interval.flush(1000);
			$httpBackend.flush();
		});
	});
});
describe('websocketConnection tests', function() {
	beforeEach(module('connectionModule'));
	var websocketConnection
	beforeEach(inject(function(_websocketConnection_) {
		websocketConnection = _websocketConnection_;
	}));
	beforeEach(inject(function(_$timeout_) {
		$timeout = _$timeout_;
	}));
	var config = {
		server: 'testAddress/',
		scheme: 'ws://',
		onmessage: function(message) {

		},
		resetLogin: function() {

		}
	};
	var fakeSocket = {};
	var FakeSocketConstructor = function(url) {
		fakeSocket.url = url;
		fakeSocket.readyState = 1;
		fakeSocket.messages = [];
		fakeSocket.generateMessage = function(message) {
			fakeSocket.onmessage(message);
		};
		fakeSocket.close = function() {
			fakeSocket.closed = true;
		};
		fakeSocket.send = function(message) {
			messages.push(message);
		};
		return fakeSocket;
	};
	beforeEach(function(){spyOn(window, 'WebSocket').and.callFake(FakeSocketConstructor)});
	it('should start with a logged state of false', function() {
		var conn = websocketConnection(config);
		expect(conn.ready()).toBe(false);
	});
	it('should send a message when it gets one', function() {
		var conn = websocketConnection(config);
		spyOn(fakeSocket, 'send');
		conn.send({Command: 'login', Args:['name', 'password']});
		expect(fakeSocket.send).toHaveBeenCalledWith('{"Command":"login","Args":["name","password"]}');
	});
	it('should have a logged state of false after recieving a successful login', function() {
		var conn = websocketConnection(config);
		fakeSocket.generateMessage({"data": '{"Success": "true", "code": "0", "Type": "login"}'});
		expect(conn.ready()).toBe(true);
	});
	it('should call its config onmessage function when it gets a message', function() {
		spyOn(config,'onmessage');
		var conn = websocketConnection(config);
		fakeSocket.generateMessage({data: '{"message": "test"}'});
		expect(config.onmessage).toHaveBeenCalled();
	});
	it('should not send a message when the connection state connecting', function(){
		var conn = websocketConnection(config);
		spyOn(fakeSocket, 'send');
		fakeSocket.readyState = 0;
		conn.send({Command: 'login', Args:['name', 'password']});
		expect(fakeSocket.send).not.toHaveBeenCalled();
	});
	it('should reset the login if the connection has a status other than open or connecting', function(){
		var conn = websocketConnection(config);
		spyOn(config, 'resetLogin');
		fakeSocket.readyState = 3;
		conn.send({Command: 'login', Args:['name', 'password']});
		expect(config.resetLogin).toHaveBeenCalled();
	});
	describe('errors', function(){
		var conn;
		beforeEach(function(){
			conn = websocketConnection(config);
		});
		it('should call its config.resetLogin()', function(){
			spyOn(config, 'resetLogin')
			fakeSocket.onerror();
			expect(config.resetLogin).toHaveBeenCalled();
		});
		it('should close the websocket', function(){
			spyOn(fakeSocket, 'close');
			fakeSocket.onerror();
			expect(fakeSocket.close).toHaveBeenCalled();
		});
		it('should have a logged state of false', function() {
			fakeSocket.onerror();
			expect(conn.ready()).toBe(false);
		});
	});
});