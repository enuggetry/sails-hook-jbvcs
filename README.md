## JBrowse Sails Hook for Version Control of Chromosomes via GitHub

This hook would primarily facilitate version control of the sequences hosted on GitHub, via the GitHub API. It aims to be flexible by providing an API which will require authenticated sessions to function.

The versions (tags) of the sequence will be pulled from remote to new respective local folders, and these versions will be available for viewing on the client JBrowse. Comparison of latest local version and latest remote version is performed, and suitable versions are then pulled accordingly to local. 

Async nature of the hook helps in performing other stuff as well in the callbacks. 

### Quick Usage

```javascript
var jbvcs = sails.hook.jbvcs;
jbvcs.isApiLive(function(err, isIt) {
	if(isIt) {
		//API is up. We can do something now
		//Or just say "Yipee!"
		searchRepo("foo", "bar", function(err, foundIt) {
			if(foundIt) {
				//Repo exists. Do stuff now.
				//Or just say "Woweee!"
			}
			else
				throw err;
		})
	}
	else
		throw err;
});
```

### API

```javascript
isApiLive(Function callback(String err, Bool isIt))
```

Checks the GitHub API Status and returns **callback** function. **err** is null if **isIt** is true, that is, if the API is live, then no error is returned. Otherwise, **isIt** will be false and an error message is returned.

```javascript
searchRepo(String username, String repository, Function callback(String err, Bool foundIt))
```

Searches for the repository on GitHub. **username** is the GitHub username, **repository** is that one which is to be used, and **callback** is a function which is returned with search results after search is complete. **foundIt** will be either true or false depending on whether repository exists or not. If it doesn't, an error message **err** is provided.

It also stores the info of the latest tagged release of the same repo behind the scenes. This *might* seem a bit slow at times so...

### Testing
Run tests once after clone/install with ```mocha```.
While developing, use ```npm test``` or ```mocha -w``` (same commands actually)

### License
MIT