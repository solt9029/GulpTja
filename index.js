var through = require('through2');
var PluginError = require('gulp-util').PluginError;
var PLUGIN_NAME = 'gulp-tja';

module.exports = function () {
  var transform = function(file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, PLUGIN_NAME + ':Streams not supported!'));
    }

    if (file.isBuffer()) {
      var contents = String(file.contents);
      console.log(contents);

      // ここで書き換えなどの処理を行う
      contents = contents;
      
      file.contents = new Buffer(contents);
      return callback(null, file);
    }

    this.push(file);
    callback();
  };

  return through.obj(transform);
};