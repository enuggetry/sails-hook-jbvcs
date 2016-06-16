var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var nodegit = require('nodegit');
var updateConfig = require('./model.js');
var modelData = updateConfig.data;

module.exports = function jbvcs(sails) {

	//Local repo
	var localRepo = require('path').resolve('');

	//To keep the info of interested repo for further usage
	modelData.repoInfo = {};
	modelData.remoteTagList = [];

	function fetchTags(cb) {
		//You've the tags url. Fetch a good list
		//returns latest tag
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				var data = JSON.parse(xhr.responseText);
				for (var i = 0; i < data.length; i++) {
					modelData.remoteTagList.push({});
					modelData.remoteTagList[i].name = (data[i]).name;
					modelData.remoteTagList[i].commit_sha = (data[i]).commit.sha;
					modelData.remoteTagList[i].zipball_url = (data[i]).zipball_url;
				}
				cb();
				updateConfig.update(JSON.stringify(modelData, null, '\t'));
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
			//Get the list of public repos of 'username'
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					//Get it in JSON
					var data = JSON.parse(xhr.responseText);
					//iterate over each object (repo)
					for (var i = 0; i < data.length; i++) {
						//iterate over each key of object (repo)
						for (var field in data[i]) {
							//search only name in current repo/object
							if (field === 'name') {
								//got a match? return!
								if (((data[i])[field]).toString() == repository) {
									repoExists = true;
									modelData.repoInfo.name = data[i].name;
									modelData.repoInfo.full_name = data[i].full_name;
									modelData.repoInfo.fork = data[i].fork;
									modelData.repoInfo.tags_url = data[i].tags_url; //list all tags
									modelData.repoInfo.branches_url = data[i].branches_url.substr(0, data[i].branches_url.length - 9); //list all branches
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
					//case when repo isn't found
					if (!repoExists) {
						cb("Repository Not Found", false);
					}
				}
				//case when username is wrong
				if (xhr.status == 404) {
					cb(xhr.statusText, false);
					return;
				}
			};
			xhr.open('GET', uri, true);
			xhr.send();
		},
		compareTags: function() {
			//gets the latest tag of local repo

			//compares with remote latest
			//if they don't match then list all of them
			//run clone of each tag
			//"Cloning..."
		}
	};
}