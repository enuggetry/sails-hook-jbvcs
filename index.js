/*
Sails hook which :
--> Searches for a repo
--> Gets a list of branches and tags
--> Creates a directory
--> Pulls a repo's specific branch to that directory
*/
var jsdom = require('jsdom');
var doc = jsdom.jsdom("<html><body></body></html>");
var window = doc.parentWindow;
var $ = require('jquery')(window);

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

module.exports = function jbvcs(sails) {

	/*
	Need some info :
	--> Username, to get the public repo list
	--> Repo name, to search for it
	*/

	return {
		isApiLive: function(cb) {
			var xhr = new XMLHttpRequest();

			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4 && xhr.status == 200) {
					var status = JSON.parse(xhr.responseText).status;
					cb(null, status);
				}
			};
			xhr.open('GET', 'https://status.github.com/api/status.json', true);
			xhr.send();
		},

		searchRepo: function(username, repository, cb) {
			var uri = "https://api.github.com/users/" + username + "/repos";
			var repoExists;
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
							if (field === "name") {
								//got a match? return!
								if (((data[i])[field]).toString() == repository) {
									repoExists = true;
									cb(null, repoExists);
									return;
								} else {
									repoExists = false;
								}
							}
						}
					}
				}
			};
			xhr.open('GET', uri, true);
			xhr.send();
		}
	};
}