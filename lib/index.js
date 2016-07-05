/***************************************************************************/
/* Installable Sails Hook for JBrowse Synthetic Sequences' Version Control */
/*																		   */
/* Author : Saksham Saxena 			****************************************/
/***************************************************************************/


/* Required modules */
var request = require('superagent');
const exec = require('child_process').exec;
const path = require('path');

var updateConfig = require('./model.js');
var modelData = updateConfig.data;

/* Initialize objects to store information of the repository in global scope */
modelData.repoInfo = {};
modelData.remoteTagList = [];

module.exports = function jbvcs(sails) {

	function fetchTags(callback) {

		request
			.get(modelData.repoInfo.tags_url)
			.type('application/json')
			.end(function(err, res) {
				if (err) throw err;
				modelData.remoteTagList = res.body;
				updateConfig.update(JSON.stringify(modelData, null, '\t'), callback);
			});

		/*var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				modelData.remoteTagList = JSON.parse(xhr.responseText);
				updateConfig.update(JSON.stringify(modelData, null, '\t'), callback);
			}
		}

		xhr.open('GET', modelData.repoInfo.tags_url, true);
		xhr.send();*/
	};

	function cloneTaggedVersions(j, tagList, callback) {

		var clone_url = modelData.repoInfo.clone_url;
		if (j >= 0) {
			//var local_path = path.join(__dirname, tagList[j].name);
			var clone_path = path.resolve(__dirname, '../../../Versions/' + tagList[j].name); //server/Versions/xyz
			console.log("Cloning into %s ...", clone_path);
			exec('git clone -b "' + tagList[j].name + '" ' + clone_url + ' ' + clone_path, (error, stdout) => {
				if (error) throw error;
				console.log("Cloned %s", tagList[j].name);
				exec('echo "Some command runs here now (like prepare_refseq.pl)"', function(error, stdout, stderr) {
					console.log(stdout);
					j--;
					cloneTaggedVersions(j, tagList, callback);
				});
			});
		} else {
			callback(null, true);
		}
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

		searchRepo: function(username, repository, callback) {

			/*Sanitize input here*/

			/*Want all three to be present*/
			if (!username)
				throw new SyntaxError("GitHub username must be specified");
			if (!repository)
				throw new SyntaxError("GitHub repository must be specified");
			if (!callback)
				throw new SyntaxError("Callback function must be specified");

			/*All three should be of the right type*/
			if (typeof username !== "string")
				throw new TypeError("GitHub username must be a valid string");
			if (typeof repository !== "string")
				throw new TypeError("GitHub respository must be a valid string");
			if (typeof callback !== "function")
				throw new TypeError("Callback must be a valid function");

			/*User's public API URI*/
			var uri = 'https://api.github.com/users/' + username + '/repos';
			var repoExists = null;

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
										modelData.repoInfo.name = data[i].name;
										modelData.repoInfo.full_name = data[i].full_name;
										modelData.repoInfo.clone_url = data[i].clone_url;
										modelData.repoInfo.tags_url = data[i].tags_url;
										modelData.repoInfo.branches_url = data[i].branches_url.substr(0, data[i].branches_url.length - 9);
										modelData.repoInfo.created_at = data[i].created_at;
										modelData.repoInfo.pushed_at = data[i].pushed_at;
										modelData.repoInfo.updated_at = data[i].updated_at;

										callback(null, true);
										return;
									}
								}
							}
						}
						if (repoExists === null) {
							callback("Repository Not Found Under " + username, false);
						}
					}
					if (res.error) {
						callback(res.status, false);
						return;
					}

				})

		},

		cloneTags: function(n, callback) {


			/*Sanitize input here*/

			/*Want both to be present*/
			if (!n)
				throw new SyntaxError("Number of latest tags to pull must be specified");
			if (!callback)
				throw new SyntaxError("Callback function must be specified");

			/*Both should be of the right type*/
			if (typeof n !== "number")
				throw new TypeError("Argument must be a valid number");
			if (typeof callback !== "function")
				throw new TypeError("Callback must be a valid function");

			fetchTags(function() {

				/*Want the number to be a valid integer within the possible range*/
				n = parseInt(n);
				var x = modelData.remoteTagList;

				if (n > 0 && n <= x.length) {
					x.splice(n, x.length - n);
					var i = x.length - 1;
					cloneTaggedVersions(i, x, callback);
				} else {
					throw new RangeError("The number must be between 1 and " + x.length);
				}
			});
		}
	};
}