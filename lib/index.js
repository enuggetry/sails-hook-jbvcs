/***************************************************************************/
/* Installable Sails Hook for JBrowse Synthetic Sequences' Version Control */
/*																		   */
/* Author : Saksham Saxena 			****************************************/
/***************************************************************************/


/* Required modules */
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var nodegit = require('nodegit');
var updateConfig = require('./model.js');
var modelData = updateConfig.data;

module.exports = function jbvcs(sails) {

	/* Initialize objects to store information of the repository */
	modelData.repoInfo = {};
	modelData.remoteTagList = [];
	modelData.localTagList = [];

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

	function cloneTaggedVersions() {
		//run clone and save to a properly named directory
	};

	return {
		isApiLive: function(cb) {
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var status = JSON.parse(xhr.responseText).status; //will be either "good", "minor", "major"
					if (status === "good")
						cb(null, true);
					else
						cb("API is down", false);
				}
			};
			xhr.open('GET', 'https://status.github.com/api/status.json', true);
			xhr.send();
		},

		searchRepo: function(username, repository, cb) {
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
									modelData.repoInfo.fork = data[i].fork;
									modelData.repoInfo.tags_url = data[i].tags_url;
									modelData.repoInfo.branches_url = data[i].branches_url.substr(0, data[i].branches_url.length - 9);
									modelData.repoInfo.created_at = data[i].created_at;
									modelData.repoInfo.pushed_at = data[i].pushed_at;
									modelData.repoInfo.updated_at = data[i].updated_at;

									fetchTags(function() {
										cb(null, true);
									});
									return;
								}
							}
						}
					}

					if (!repoExists) {
						cb("Repository Not Found Under " + username, false);
					}
				}

				if (xhr.status == 404) {
					cb(xhr.statusText, false);
					return;
				}
			};
			xhr.open('GET', uri, true);
			xhr.send();
		},
		compareTags: function(callback) {

			const localRepo = require('path').resolve(process.cwd(), '../jbrowse');

			nodegit.Repository.open(localRepo).then(function(repo) {

					nodegit.Tag.list(repo).then(function(array) {
						// Use array
						callback(null, true);
					})
				})
				.catch(function(reasonForFailure) {
					// failure is handled here
					callback(reasonForFailure, false);
				});
			//compares with remote latest
			//if they don't match then list all of them
			//run clone of each tag
			//"Cloning..."
		}
	};
}