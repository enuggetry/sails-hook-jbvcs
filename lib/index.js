/***************************************************************************/
/* Installable Sails Hook for JBrowse Synthetic Sequences' Version Control */
/*																		   */
/* Author : Saksham Saxena 			****************************************/
/***************************************************************************/


/* Required modules */
const exec = require('child_process').exec;
const path = require('path');

var request = require('superagent');
var updateConfig = require('./model.js');
var modelData = updateConfig.data;

/* Initialize objects to store information of the repository in global scope */
modelData.repoInfo = {};
modelData.remoteTagList = [];

module.exports = function jbvcs(sails) {

	function cloneTaggedVersions(j, tagList, resolve, reject) {

		var clone_url = modelData.repoInfo.clone_url;
		var clone_path = path.resolve(__dirname, '../../../Versions/' + tagList[j].name);

		console.log("Cloning %s into %s ...", tagList[j].name, clone_path);

		exec('git clone -b "' + tagList[j].name + '" ' + clone_url + ' ' + clone_path, (error, stdout, stderr) => {
			if (error) throw new Error(error.message);

			console.log("Cloned %s", tagList[j].name);

			exec('echo "Some command runs here now (like prepare_refseq.pl)"', function(error, stdout, stderr) {
				if (error) throw new Error(error.message);

				console.log(stdout);
				j--;

				if (j >= 0)
					return cloneTaggedVersions(j, tagList, resolve, reject);
				else
					resolve(true);
			});
		});
	};

	return {
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

		searchRepo: function(username, repository) {

			/*Sanitize input here*/

			/*Want both to be present*/
			if (!username)
				throw new SyntaxError("GitHub username must be specified");
			if (!repository)
				throw new SyntaxError("GitHub repository must be specified");

			/*Both should be of the right type*/
			if (typeof username !== "string")
				throw new TypeError("GitHub username must be a valid string");
			if (typeof repository !== "string")
				throw new TypeError("GitHub respository must be a valid string");

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

		cloneTags: function(n) {

			/*Sanitize input here*/

			/*Want it to be present*/
			if (!n)
				throw new SyntaxError("Number of latest tags to pull must be specified");

			/*Should be of the right type*/
			n = parseInt(n);
			if (isNaN(n))
				throw new TypeError("Argument must be a valid number");

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
							updateConfig.update(JSON.stringify(modelData, null, '\t'), function () {
								cloneTaggedVersions(i, x, resolve, reject);
							});
						} else if (n == 0) {
							updateConfig.update(JSON.stringify(modelData, null, '\t'), function () {
								cloneTaggedVersions(x.length - 1, x, resolve, reject);
							});
						} else {
							throw new RangeError("The number must be between 1 and " + x.length);
						}
					});
			})
		}
	};
}