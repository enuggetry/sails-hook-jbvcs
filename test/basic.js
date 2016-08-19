var Sails = require('sails').Sails;
var should = require('should');

const path = require('path');
const exec = require('child_process').exec;
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

	it('Git Test', function(done) {
		this.timeout(0);
		exec('git --version', function(error, stdout, stderr) {
			if(!stderr)
				done();
		});
	});

	it('API Test', function(done) {
		this.timeout(2000);
		jbvcs().isApiLive().then(function(val) {
			val.should.equal(true);
			done();
		}).catch(function(err) {
			throw err;
			done();
		});
	});

	it('Search For Repo', function(done) {
		this.timeout(0);
		jbvcs().searchRepo('sakshamsaxena', 'jbvcs-test').then(function(foundIt) {
			foundIt.should.equal(true);
			done();
		}).catch(function(err) {
			throw err;
			done();
		});
	});

	it('Cloning', function(done) {
		this.timeout(0);
		jbvcs().cloneTags(0).then(function(cloned, notcloned) {
			cloned.should.be.equal(true);
			done();
		}).catch(function(err) {
			throw err;
			done();
		});
	});

	it('Cleans up', function(done) {
		var clone_path = path.resolve('/var/www/jbrowse/versions/');
		exec('rm -rf ' + clone_path, function(error, stdout, stderr) {
			done();
		});
	})
});