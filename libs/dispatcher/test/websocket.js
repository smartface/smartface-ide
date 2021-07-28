const WebSocket = require('ws');
const sinon = require('sinon');
const init = require('../src/index').init;

var dispatcher;
var ws;

describe.skip('Websocket', function() {
	before(function(done) {
		dispatcher = init({
			meta: {
				logToConsole: true //for passing tests, branches
			}
		});
		dispatcher.start(done);
	});

	after(function() {
		ws.close();
		dispatcher.stop();
		dispatcher = null;
	});

	it('onConnection fires', function(done) {
		const spy = sinon.spy(dispatcher._events.onConnection);
		dispatcher.replaceEvent('connection', spy);
		connect('control', function() {
			setTimeout(function() {
				sinon.assert.calledOnce(spy);
				done();
			}, 1000);
		});
	});

	it('onMessage fires', function(done) {
		const org_callback = dispatcher._events.onMessage;
		const spy = sinon.spy(dispatcher._events.onMessage);
		const data = {
			text: 'Hello World'
		};
		dispatcher.replaceEvent('message', spy);
		sendJson2WS(data);
		setTimeout(function() {
			sinon.assert.calledWithMatch(spy, sinon.match({data: data}));
			dispatcher.replaceEvent('message', org_callback);
			done();
		}, 1000);
	});

	it('onConnection fires for UI', function(done) {
		const spy = sinon.spy(dispatcher._events.onConnection);
		dispatcher.replaceEvent('connection', spy);
		connect('UI', function() {
			setTimeout(function() {
				sinon.assert.calledOnce(spy);
				done();
			}, 1000);
		});
	});

});

function onConnection(eventName, args) {
	assert(eventName === 'abc');
	assert(args.meta.to === '*');
}

function sendJson2WS(data) {
	ws.send(JSON.stringify(data));
}

function connect(service, onOpen) {
	service = (service) ? '/' + service : '';
	ws = new WebSocket('ws://localhost:8084' + service);
	ws.on('open', onOpen);
}

/*
function test() {

	ws.on('open', function open() {
		console.log('[send-receive] websocket is open');
		send(ws, 'b');
		send(ws, 'a');
		send(ws, 'b');
	  send(ws, 'a');
	});

	ws.on('message', function(data, flags) {
		console.log('[send-receive] websocket');
		console.log('data', data);
		// console.log('flags', flags);
	});
}
*/