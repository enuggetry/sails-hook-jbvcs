## JBrowse Sails Hook for Version Control of Chromosomes via GitHub

This hook would primarily facilitate version control of the sequences hosted on GitHub. The versions (tags) of the sequence will be pulled from remote to new respective local folders, and these versions will be available for viewing on the client JBrowse. 

Async nature of the hook implemented through ES6 Promises delivers reliable performance and error handling. 

### Usage

Can be directly invoked through the CLI.  

```javascript
npm install -g sails-hook-jbvcs
jbvcs
```
This would then output the usage help.

For usage in Sails project, read the [API Documentation](../../wiki).

### API

Read it on the [Wiki](../../wiki).

### Testing
Run tests once after clone/install with ```mocha```.
While developing, use ```npm test``` or ```mocha -w``` (same commands actually)

### License
MIT