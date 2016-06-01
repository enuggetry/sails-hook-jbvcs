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

module.exports = function jbvcs(sails) {

	/*
	Need some info :
	--> Username, to get the public repo list
	--> Repo name, to search for it
	*/

	return {
		isApiLive: function(cb) {
			$.ajax({
				url: 'https://status.github.com/api/status.json',
				success: function(data) {
					var status = data.status;
					cb(null, status);
				}
			});
			return true;
		},

		searchRepo: function(username, repository) {
			if (typeof username !== "string")
				username = username.toString();
			if (typeof repository !== "string")
				repository = repository.toString();

			//Array containing relevant info of a repo in respective objects
			var repoExists;
			//Get the list of public repos of 'username'
			$.ajax({
				url: "https://api.github.com/" + username + "/repos",
				method: "GET",
				success: function(data) {
					//iterate over each object in the data array
					for (var i = 0; i < data.length; i++) {
						//iterate over each key of object
						for (var field in data[i]) {
							//search only name to our own array
							if (field === "name")
								if ((data[i])[field] === repository) {
									//repo exists
									repoExists = true;
									break;
								} else {
									repoExists = false;
								}
						}
					}
				}
			});
			return repoExists;
		}
	};
}