/***************************************************************************/
/* Installable Sails Hook for JBrowse Synthetic Sequences' Version Control */
/*																		   */
/* Author : Saksham Saxena 			****************************************/
/***************************************************************************/


/* Required modules */
const exec = require('child_process').exec;
const path = require('path');

var request = require('superagent');
var walk = require('walk');
var updateConfig = require('./model.js');
var modelData = updateConfig.data;

/* Initialize objects to store information of the repository in global scope */
modelData.repoInfo = {};
modelData.remoteTagList = [];

module.exports = function jbvcs(sails) {
	/* Private function to clone the requested number of tags, and to prepare datasets of each of them */
	function cloneTaggedVersions(j, tagList, resolve, reject) {

		var clone_url = modelData.repoInfo.clone_url;
		var clone_path = path.resolve('/var/www/jbrowse/versions/' + modelData.repoInfo.name + '/' + tagList[j].name);

		console.log("Cloning %s into %s ...", tagList[j].name, clone_path);

		exec('git clone -b "' + tagList[j].name + '" ' + clone_url + ' ' + clone_path, (error, stdout, stderr) => {
			if (error) throw new Error(error.message);

			console.log("Cloned %s", tagList[j].name);
			// scan the cloned directory
			var files = [];

			// Walker options
			var walker = walk.walk(clone_path, { followLinks: false });

			walker.on('file', function(root, stat, next) {
				var ext = stat.name.split(".")[stat.name.split(".").length - 1];
				if (ext == "bam" || ext == "gff" || ext == "gff3" || ext == "fasta" || ext == "fa" || ext == "json")
					files.push(root + '/' + stat.name);
				next();
			});

			walker.on('end', function() {
				console.log(files);
				j--;

				if (j >= 0)
					return cloneTaggedVersions(j, tagList, resolve, reject); //recursively call till all tags are cloned
				else
					resolve(true);
			});


			/*var ext = config_file.split(".")[config_file.split(".").length - 1];
			var filename = config_file.substring(config_file.lastIndexOf("\/") + 1, config_file.indexOf("."));*/

			/* Check if the input file is FASTA, GFF(3), BAM or JSON, and proceed accordingly 
			switch (ext.toLowerCase()) {
				case "fa":
				case "fasta":
					exec('cd /var/www/jbrowse/ && bin/prepare-refseqs.pl --fasta ' + path.resolve('/var/www/jbrowse/versions/', modelData.repoInfo.name, tagList[j].name, config_file), function(error, stdout, stderr) {
						if (error) throw new Error(error.message);

						console.log(stdout);
						j--;

						if (j >= 0)
							return cloneTaggedVersions(j, tagList,  resolve, reject); //recursively call till all tags are cloned
						else
							resolve(true);
					});
				case "gff":
				case "gff3":
					exec('cd /var/www/jbrowse/ && bin/flatfile-to-json.pl' + ' --gff ' + 'versions/' + modelData.repoInfo.name + '/' + tagList[j].name + '/' + config_file + ' --trackLabel ' + filename + ext + ' --trackType "CanvasFeatures"', function(error, stdout, stderr) {
						if (error) throw new Error(error.message);

						console.log(stdout);
						j--;

						if (j >= 0)
							return cloneTaggedVersions(j, tagList,  resolve, reject); //recursively call till all tags are cloned
						else
							resolve(true);
					});
				case "bam":
					exec('cd /var/www/jbrowse/ && bin/add-bam-track.pl --label ' + filename + ext + ' --bam_url ' + '../versions/' + modelData.repoInfo.name + '/' + tagList[j].name + '/' +  function(error, stdout, stderr) {
						if (error) throw new Error(error.message);

						console.log(stdout);
						j--;

						if (j >= 0)
							return cloneTaggedVersions(j, tagList,  resolve, reject); //recursively call till all tags are cloned
						else
							resolve(true);
					});
				case "json":
					exec('cd /var/www/jbrowse/ && bin/biodb-to-json.pl --conf ' + 'versions/' + modelData.repoInfo.name + '/' + tagList[j].name + '/' +  function(error, stdout, stderr) {
						if (error) throw new Error(error.message);

						console.log(stdout);
						j--;

						if (j >= 0)
							return cloneTaggedVersions(j, tagList,  resolve, reject); //recursively call till all tags are cloned
						else
							resolve(true);
					});
			}*/

		});
	};

	function scanDir(clonePath) {
		var files = [];

		// Walker options
		var walker = walk.walk(clonePath, { followLinks: false });

		walker.on('file', function(root, stat, next) {
			var ext = stat.name.split(".")[stat.name.split(".").length - 1];
			if (ext == "bam" || ext == "gff" || ext == "gff3" || ext == "fasta" || ext == "fa" || ext == "json")
				files.push(root + '/' + stat.name);
			next();
		});

		walker.on('end', function() {
			console.log(files);
		});
	}

	return {
		/* Public function to check whether the GitHub API is live or not */
		isApiLive: function() {

			return new Promise(function(resolve, reject) {

				request
					.get('https://status.github.com/api/status.json')
					.type('application/json')
					.end(function(err, res) {
						if (res.body.status === "good")
							resolve(true);
						else
							reject("API is down");
					});
			})
		},
		/* Public function to search and return the repository details */
		searchRepo: function(username, repository) {

			/*Sanitize input here*/

			/*Want both to be present*/
			if (!username)
				throw new SyntaxError("GitHub username must be specified");
			if (!repository)
				throw new SyntaxError("GitHub repository must be specified");

			/*Both should be of the right type*/
			username = username.toString();
			repository = repository.toString();

			/*User's public API URI*/
			var uri = 'https://api.github.com/users/' + username + '/repos';
			var repoExists = null;

			return new Promise(function(resolve, reject) {
				request
					.get(uri)
					.type('application/json')
					.end(function(err, res) {
						if (res.ok) {
							var data = res.body;
							for (var i = 0; i < data.length; i++) {
								for (var field in data[i]) {
									if (field === 'name') {
										if (((data[i])[field]).toString() == repository) {
											repoExists = true;
											modelData.repoInfo.user = username;
											modelData.repoInfo.name = data[i].name;
											modelData.repoInfo.full_name = data[i].full_name;
											modelData.repoInfo.clone_url = data[i].clone_url;
											modelData.repoInfo.tags_url = data[i].tags_url;
											modelData.repoInfo.branches_url = data[i].branches_url.substr(0, data[i].branches_url.length - 9);
											modelData.repoInfo.created_at = data[i].created_at;
											modelData.repoInfo.pushed_at = data[i].pushed_at;
											modelData.repoInfo.updated_at = data[i].updated_at;

											resolve(true);
											return;
										}
									}
								}
							}
							if (repoExists === null) {
								reject("Repository Not Found Under " + username);
							}
						}
						if (res.error) {
							reject(res.status);
							return;
						}
					})
			})

		},
		/* Public function to prepare cloning of N tags */
		cloneTags: function(n) {

			/*Sanitize input here*/

			/*Want it to be present*/
			if (!n)
				throw new SyntaxError("Number of latest tags to pull must be specified");

			/*Should be of the right type*/
			n = parseInt(n);
			if (isNaN(n))
				throw new TypeError("Argument must be a valid number");

			//config_file = config_file.toString();
			return new Promise(function(resolve, reject) {
				request
					.get(modelData.repoInfo.tags_url)
					.type('application/json')
					.end(function(err, res) {
						if (err) reject(err);

						modelData.remoteTagList = res.body;

						var x = modelData.remoteTagList;

						/*Want the number to be a valid integer within the possible range*/
						if (n > 0 && n <= x.length) {
							x.splice(n, x.length - n);
							var i = x.length - 1;
							updateConfig.update(JSON.stringify(modelData, null, '\t'), function() {
								cloneTaggedVersions(i, x, resolve, reject);
							});
						} else if (n == 0) {
							updateConfig.update(JSON.stringify(modelData, null, '\t'), function() {
								cloneTaggedVersions(x.length - 1, x, resolve, reject);
							});
						} else {
							throw new RangeError("The number must be between 1 and " + x.length);
						}
					});
			})
		},

		watchRepo: function(interval) {
			if (!interval) interval = 600000;
			setInterval(function() {

				//get current latest tag from config
				var currentTag = ((modelData.remoteTagList)[0]).name;

				//get the remote latest
				var remoteTag = null;
				request.get('https://api.github.com/repos/' + info.user + '/' + info.repo + '/tags')
					.set('Cache-Control', 'no-cache,no-store,must-revalidate,max-age=-1')
					.end(function(err, res) {
						if (res.ok) {
							remoteTag = ((res.body)[0]).name;

							//compare the two
							if (currentTag !== remoteTag) {
								jbvcs().cloneTags(1);
							} else
								console.log("No changes yet");
						}
					});
			}, interval);
		}
	};
}