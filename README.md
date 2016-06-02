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

### Testing
Run tests with ```mocha```