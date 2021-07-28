var expect = require('chai').expect;
var utils = require('../src/dispatcher/utils');

function createMetaToArgs(to) {
	return {
		meta: {
			to: to
		}
	};
}

describe('checkIfEventIsTargetedToService', function() {
	it('dispatcher and dispatcher returns true', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs('dispatcher'))).to.be.true;
	});
	it('dispatcher and * returns true', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs('*'))).to.be.true;
	});
	it('dispatcher and control returns false', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs('control'))).to.be.false;
	});
	it('dispatcher and null returns false', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs(null))).to.be.false;
	});
	it('dispatcher and undefined returns false', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', null)).to.be.false;
	});
	it('dispatcher and dispatcher in Array returns true', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs(['other', 'dispatcher']))).to.be.true;
	});
	it('dispatcher and * in Array returns true', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs(['other', '*']))).to.be.true;
	});
	it('dispatcher and * in Array returns true', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs(['other', '*']))).to.be.true;
	});
	it('dispatcher and null in Array returns false', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs([null]))).to.be.false;
	});
	it('dispatcher and other in Array returns false', function() {
		expect(utils.checkIfEventIsTargetedToService('dispatcher', createMetaToArgs(['other']))).to.be.false;
	});
});