const fs = require('fs');

module.exports = {
	data: {},
	update: function(data, callback) {
		process.chdir(__dirname);
		fs.writeFile('user.config', data, 'utf8', function() {
			process.chdir('..');
			callback();
		});
	}
}