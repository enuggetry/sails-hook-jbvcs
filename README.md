## JBrowse Server Hook for Version Control

### Usage
```javascript
var jbvcs = sails.hook.jbvcs;
jbvcs.isApiLive(function(err, isIt) {
	if(isIt) {
		//API is up. We can do something now
	}
	else
		throw err;
});
```

### Functions

``` isApiLive(Function *callback*(String *err*, Bool *isIt*))```
Checks the GitHub API Status and returns *callback* function. *err* is null if *isIt* is true, that is, if the API is live, then no error is returned. Otherwise, *isIt* will be false and an error message is returned.

``` searchRepo(String *username*, String *repository*, Function *callback*(String *err*, Bool *foundIt*))```
Searches for the repository on GitHub. *username* is the GitHub username, *repository* is that one which is to be used, and *callback* is a function which is returned with search results after search is complete. *foundIt* will be either true or false depending on whether repository exists or not. If it doesn't, an error message *err* is provided.

### Testing
Run tests with ```mocha```