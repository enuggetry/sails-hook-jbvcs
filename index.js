/*
Sails hook which :
--> Searches for a repo {done}
--> Gets a list of tags {have the urls now}
--> Creates a directory (fs)
--> Pulls a repo's specific branch to that directory (nodegit)
*/

var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

module.exports = function jbvcs(sails) {

	//To keep the info of interested repo for further usage
	var repoInfo = {};

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
									cb(null, true);
									repoExists = true;
									repoInfo.name = data[i].name;
									repoInfo.full_name = data[i].full_name;
									repoInfo.fork = data[i].fork;
									repoInfo.tags_url = data[i].tags_url; //list all tags
									repoInfo.branches_url = data[i].branches_url.substr(0, data[i].branches_url.length - 9); //list all branches
									repoInfo.created_at = data[i].created_at;
									repoInfo.pushed_at = data[i].pushed_at;
									repoInfo.updated_at = data[i].updated_at;
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
		}
	};
}