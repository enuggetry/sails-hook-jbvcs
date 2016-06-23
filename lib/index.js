/***************************************************************************/
/* Installable Sails Hook for JBrowse Synthetic Sequences' Version Control */
/*																		   */
/* Author : Saksham Saxena 			****************************************/
/***************************************************************************/


/* Required modules */
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var nodegit = require('nodegit');
const exec = require('child_process').exec;
var updateConfig = require('./model.js');
var modelData = updateConfig.data;
const path = require('path');

/* Initialize objects to store information of the repository */
modelData.repoInfo = {};
modelData.remoteTagList = [];
modelData.localTagList = [];

module.exports = function jbvcs(sails) {

	function fetchTags(callback) {

		var xhr = new XMLHttpRequest();

		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				modelData.remoteTagList = JSON.parse(xhr.responseText);
				updateConfig.update(JSON.stringify(modelData, null, '\t'), callback);
			}
		}

		xhr.open('GET', modelData.repoInfo.tags_url, true);
		xhr.send();
	};

	function cloneTaggedVersions(tagList, callback) {
		//run clone and save to a properly named directory
		var clone_url = modelData.repoInfo.clone_url;

		var i = tagList.length - 1;

		function loopit(i) {
			var local_path = path.join(__dirname, tagList[i].name);
			console.log("Cloning into %s ...", local_path);
			exec('git clone -b "' + tagList[i].name + '" ' + clone_url + ' ' + local_path, (error, stdout) => {
				console.log("Cloned %s", tagList[i].name);
				// process.chdir(local_path);
				exec('echo "Some command runs here now (like prepare_refseq.pl)"', function(error, stdout, stderr) {
					console.log(stdout);
					if (!i) {
						callback(null, true);
						return;
					} else {
						i--;
						loopit(i);
					}
				});
			});
		}

		loopit(i);

	};

	return {
		isApiLive: function(callback) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var status = JSON.parse(xhr.responseText).status; //will be either "good", "minor", "major"
					if (status === "good")
						callback(null, true);
					else
						callback("API is down", false);
				}
			};
			xhr.open('GET', 'https://status.github.com/api/status.json', true);
			xhr.send();
		},

		searchRepo: function(username, repository, callback) {
			var uri = 'https://api.github.com/users/' + username + '/repos';
			var repoExists = null;

			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {

					var data = JSON.parse(xhr.responseText);

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

					if (!repoExists) {
						callback("Repository Not Found Under " + username, false);
					}
				}

				if (xhr.status == 404) {
					callback(xhr.statusText, false);
					return;
				}
			};
			xhr.open('GET', uri, true);
			xhr.send();
		},
		cloneTags: function(n, callback) {
			var x = null;

			fetchTags(function() {
				//have a list of remote tags. 
				//let's get the first n to another var, x
				x = modelData.remoteTagList;
				x.splice(n, x.length - n); //now x has the relevant data
				//console.log(x);
				cloneTaggedVersions(x, callback);
			});

		}
	};
}