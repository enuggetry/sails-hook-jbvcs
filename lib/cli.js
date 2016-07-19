#!/usr/bin/env node

var jbvcs = require('./index.js')();
var program = require('commander');
var request = require('superagent')

const chalk = require('chalk');
const readline = require('readline');
const fs = require('fs');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/* To keep some parameters global */
var info = {};
var configData = null;

/* Chalk String Styles for pretty CLI */
var inProgress = chalk.bold.blue;
var completed = chalk.bold.green;
var prompt = chalk.bold.magenta;

program
	.arguments('<tags> <config>')
	.option('-u, --username <username>', 'Username')
	.option('-r, --repository <repository>', 'Repository')
	.option('-w, --watch <watch>', 'Watch Remote after interval (in ms)')
	.action(function(tags, config) {

		info.how = tags;
		info.fasta = config;

		var u = program.username ? program.username : false
		var r = program.repository ? program.repository : false;

		if (u && r) {
			//skip reading file and run module
			//using this because this will then directly create/update file, without defaulting to prompt
			info.user = u;
			info.repo = r;
			runModule(true, program.watch);
		} else {
			// Check if local config is there or not
			// u or r or none is passed, meaning, that either its a first run, or only u or r is to be updated
			console.log(inProgress('Checking Config File ...'));

			fs.stat(__dirname + '/user.config', function(err, stat) {
				if (err == null) {
					// It is there
					console.log(completed('Config File Found.\n'));
					console.log(inProgress('Reading User Info ...'));
					fs.readFile(__dirname + '/user.config', 'utf-8', (err, data) => {
						if (err) {
							throw err;
						} else {
							data = JSON.parse(data);
							configData = data;
							info.user = u ? u : data.repoInfo.user;
							info.repo = r ? r : data.repoInfo.name;
							console.log(completed('Obtained User Info.\n'));
							runModule(true, program.watch);
						}
					});
				} else if (err.code == 'ENOENT') {
					console.log("Local Config missing. Please provide the following details : ");
					rl.question(prompt('GitHub Username : '), function(args) {
						info.user = args;
						rl.question(prompt('Repository Name : '), function(args) {
							info.repo = args;
							rl.close();
							runModule(true, program.watch);
						})
					});
				} else {
					throw err;
				}
			});
		}
	})
	.parse(process.argv);

/* Post-CLI mumbo jumbo */

function runModule(itGottaWatch, interval) {
	console.log(inProgress("Checking API ..."));
	jbvcs.isApiLive()
		.then(function(isIt) {
			//API is up. We can do something now
			//Or just say "Yipee!"
			console.log(completed("API is up.\n"));
			console.log(inProgress("Checking Repo ..."));
			return jbvcs.searchRepo(info.user, info.repo);
		})
		.then(function(foundIt) {
			//Repo exists. Do stuff now.
			//Or just say "Woweee!"
			console.log(completed("Repo found.\n"));
			console.log(inProgress("Cloning Tags ..."));
			return jbvcs.cloneTags(info.how, info.fasta);
		})
		.then(function(done) {
			//Cloning done!
			console.log(completed("Done!"));
			if (itGottaWatch) {
				console.log(inProgress("Watching remote repo for changes now ..."));
				watchRepo(interval);
			}
		})
		.catch(function(err) {
			console.log(err)
		});
}

function watchRepo(interval) {
	if (!interval) interval = 6000;
	setInterval(function() {
		//get current latest tag from config
		var currentTag = ((configData.remoteTagList)[0]).name;
		var remoteTag = null;
		//get the remote latest
		request.get('https://api.github.com/repos/' + info.user + '/' + info.repo + '/tags')
			.set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
			.end(function(err, res) {
				if (res.ok) {
					remoteTag = ((res.body)[0]).name;
					//compare the two
					if (currentTag !== remoteTag)
						runModule(interval);
					else
						console.log("No changes yet");
				}
			});
	}, interval);
}