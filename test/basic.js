var Sails = require('sails').Sails;
var should = require('should');

const jbvcs = require('../lib/index.js');

describe('Basic Sails Test ::', function() {

	// Var to hold a running sails app instance
	var sails;

	// Before running any tests, attempt to lift Sails
	before(function(done) {

		// Hook will timeout in 10 seconds
		this.timeout(11000);

		// Attempt to lift sails
		Sails().lift({
			hooks: {
				// Load the hook
				"jbvcs": require('../lib/'),
				// Skip grunt (unless your hook uses it)
				"grunt": false
			},
			log: { level: "error" }
		}, function(err, _sails) {
			if (err) return done(err);
			sails = _sails;
			return done();
		});
	});

	// After tests are complete, lower Sails
	after(function(done) {

		// Lower Sails (if it successfully lifted)
		if (sails) {
			return sails.lower(done);
		}
		// Otherwise just return
		return done();
	});

	// Test that Sails can lift with the hook in place
	it('Sails did not crash', function() {
		return true;
	});
});

describe('Hook Tests ::', function() {

	it('API Test', function(done) {
		this.timeout(2000);
		jbvcs().isApiLive(function(err, isIt) {
			isIt.should.equal(true);
			done();
		});
	});

	it('Is Able to read local repo', function(done) {
		this.timeout(500);
		jbvcs().compareTags(function(err, res) {
			res.should.equal(true);
			done();
		});
	})

});