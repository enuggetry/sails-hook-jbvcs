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
var title = chalk.bold.yellow;
var bold = chalk.bold;
var inProgress = chalk.bold.blue;
var completed = chalk.bold.green;
var prompt = chalk.bold.magenta;

program
	.description(title('JBrowse Synthetic Sequence Version Control System.') + '\n\n' + bold('  <tags>\t') + ' is the number of latest tags to pull. Enter 0 for all tags.\n')
	.arguments('<tags>')
	.option('-u, --username <username>', 'GitHub Username')
	.option('-r, --repository <repository>', 'GitHub Repository Name')
	.option('-w, --watch <watch>', 'Watch Remote after interval (in ms). Default is 10 minutes.')
	.action(function(tags, config) {

		info.tags = tags;
		//info.config = config;

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
					// Read the file now
					fs.readFile(__dirname + '/user.config', 'utf-8', function(err, data) {
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
					// File not found
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
					// Some other strange error
					throw err;
				}
			});
		}
	})
	.parse(process.argv);

/* Display help if no arguments are passed */
if (!process.argv.slice(2).length) {
	program.outputHelp();
	process.exit(1);
}

/* Function which calls the module */

function runModule(itGottaWatch, interval) {
	console.log(inProgress("Checking API ..."));
	jbvcs.isApiLive()
		.then(function(isIt) {
			//API is up. We can do something now
			console.log(completed("API is up.\n"));
			console.log(inProgress("Checking Repo ..."));
			return jbvcs.searchRepo(info.user, info.repo);
		})
		.then(function(foundIt) {
			//Repo exists. Do stuff now.
			console.log(completed("Repo found.\n"));
			console.log(inProgress("Cloning Tags ..."));
			return jbvcs.cloneTags(info.tags);
		})
		.then(function(done) {
			//Cloning done!
			console.log(completed("Done!"));
			if (itGottaWatch) {
				// Needed to switch out from infinite recursion,because this won't be passed when the watcher runs the module, thus preventing infinite recursive calls to it
				console.log(inProgress("Watching remote repo for changes now ..."));
				watchRepo(interval);
			}
		})
		.catch(function(err) {
			console.log(err)
		});
}

/* Function to watch the remote repo for changes. If the latest on the remote is different than the latest one downloaded above, then it pulls the new one again */

function watchRepo(interval) {
	if (!interval) interval = 600000;
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
					if (currentTag !== remoteTag) {
						info.tags = 1; // reset the number of tags to pull to 1, so that it pulls the latest one only.
						runModule(interval); // because the module itself doesn't tally with the config which it saves. Only the CLI uses that. So we can safely run the module again, and it will pull latest tag.
					}
					else
						console.log("No changes yet");
				}
			});
	}, interval);
}