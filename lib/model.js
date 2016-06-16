const fs = require('fs');

module.exports = {
	data: {},
	update: function(data) {
		process.chdir('./lib');
		fs.writeFile('user.config', data, 'utf8', function() {
			console.log("**********************");
			console.log("** Config Updated ! **");
			console.log("**********************");
		});
	}
}