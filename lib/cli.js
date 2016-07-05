#!/usr/bin/env node

var jbvcs = require('./index.js')();
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var info = {};

var inProgress = chalk.bold.blue;
var completed = chalk.bold.green;
var prompt = chalk.bold.magenta;

rl.question(prompt('GitHub Username : '), function(args) {
	info.user = args;
	rl.question(prompt('Repository Name : '), function(args) {
		info.repo = args;
		rl.question(prompt('Number of latest tags to pull : '), function(args) {
			info.how = args;
			rl.close();
			runModule();
		})
	})
});

function runModule() {
	console.log(inProgress("Checking API"));
	jbvcs.isApiLive(function(err, isIt) {
		if (isIt) {
			//API is up. We can do something now
			//Or just say "Yipee!"
			console.log(completed("API is up."));
			console.log(inProgress("Checking Repo ..."));
			jbvcs.searchRepo(info.user, info.repo, function(err, foundIt) {
				if (foundIt) {
					//Repo exists. Do stuff now.
					//Or just say "Woweee!"
					console.log(completed("Repo found."));
					console.log(inProgress("Cloning Tags ..."));
					jbvcs.cloneTags(info.how, function(err, done) {
						if(done) {
							console.log(completed("Done!"));
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