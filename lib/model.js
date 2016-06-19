const fs = require('fs');

module.exports = {
	data: {},
	update: function(data, callback) {
		process.chdir('./lib');
		fs.writeFile('user.config', data, 'utf8', function() {
			console.log("\n  **********************");
			console.log("  ** Config Updated ! **");
			console.log("  **********************\n");
			process.chdir('..');
			callback();
		});
	}
}