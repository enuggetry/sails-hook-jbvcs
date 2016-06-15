const fs = require('fs');
const exec = require('child_process').exec;

module.exports = function model() {
	return {
		data: {},
		update: function(data) {
			//should write to json
			process.chdir('./lib');
			fs.writeFile('user.config', data, 'utf8', function() {
				console.log("**********************");
				console.log("** Config Updated ! **");
				console.log("**********************");
			});
		}
	};
}