## JBrowse Sails Hook for Version Control of Chromosomes via GitHub

This hook would primarily facilitate version control of the sequences hosted on GitHub, via the GitHub API. It aims to be flexible by providing an API which will require authenticated sessions to function.

The versions (tags) of the sequence will be pulled from remote to new respective local folders, and these versions will be available for viewing on the client JBrowse. Comparison of latest local version and latest remote version is performed, and suitable versions are then pulled accordingly to local. 

Async nature of the hook helps in performing other stuff as well in the callbacks. 

### Quick Usage

```javascript
var jbvcs = sails.hook.jbvcs;
jbvcs.isApiLive()
	.then(function(isIt) {
		//API is up. We can do something now
		//Or just say "Yipee!"

		return seachRepo("foo", "bar")
	})
	.then(function(foundIt) {
		//Repo exists. Do stuff now.
		//Or just say "Woweee!"

		return cloneTags(n)
	})
	.then(function(done) {
		//CLoning done!
		return true;
	});

```

### API

Read it on the [Wiki](../../wiki).

### Testing
Run tests once after clone/install with ```mocha```.
While developing, use ```npm test``` or ```mocha -w``` (same commands actually)

### License
MIT