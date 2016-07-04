#!/usr/bin/env node

var jbvcs = require('./index.js')();
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var info = {};

rl.question('Username : ', function(args) {
	info.user = args;
	rl.question('Repo : ', function(args) {
		info.repo = args;
		rl.question('N : ', function(args) {
			info.how = args;
			console.log(info);
			rl.close();
			stuff();
		})
	})
});

function stuff() {
	console.log("Checking API");
	jbvcs.isApiLive(function(err, isIt) {
		if (isIt) {
			//API is up. We can do something now
			//Or just say "Yipee!"
			console.log("API is up.");
			console.log("Checking Repo ...");
			jbvcs.searchRepo(info.user, info.repo, function(err, foundIt) {
				if (foundIt) {
					//Repo exists. Do stuff now.
					//Or just say "Woweee!"
					console.log("Repo found.");
					console.log("Cloning Tags ...");
					jbvcs.cloneTags(info.how, function(err, done) {
						if(done) {
							console.log("Done!");
						}
						else throw err;
					})
				} else
					throw err;
			})
		} else
			throw err;
	});
}