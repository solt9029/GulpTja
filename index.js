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
      var lines = contents.split(/\r\n|\r|\n/); // 1行ごとに配列に格納・最終的にこの配列をreturnするからそのつもりで

      // コメントアウトをすべて削除するステップ
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('//') > -1) {
          lines[i] = lines[i].slice(0, lines[i].indexOf('//'));
        }
      }

      var tmpLines = new Array(lines.length); // 作業用の配列です
      for (var i = 0; i < tmpLines.length; i++) {
        tmpLines[i] = String(lines[i]);
      }

      var vars = []; // 変数のリストを格納しておく配列vars

      // 変数を格納するステップ
      for (var i = 0; i < lines.length; i++) {
        // タブと空白を全て消し去りたい
        tmpLines[i] = tmpLines[i].replace(/ /g, '').replace(/\t/g, '');

        // $と:が存在しなかったら終了($マークは一番最初の文字じゃないと駄目だよ)
        var dollarExists = tmpLines[i].indexOf('$') === 0;
        var doubleColonExists = tmpLines[i].indexOf(':') !== -1;
        if (!dollarExists || !doubleColonExists) {
          continue;
        }

        // 変数リストに格納してあげる
        var name = tmpLines[i].slice(0, tmpLines[i].indexOf(':'));
        var value = tmpLines[i].slice(tmpLines[i].indexOf(':') + 1);
        // vars[name] = value;
        vars.push({'name': name, 'value': value});

        // return用の配列のlinesからはこの行を削除しちゃってもいい
        lines[i] = '';
      }

      // varsのnameが長い順に並び替えてあげる
      vars.sort(function(a, b) {
        if (a.name.length > b.name.length) return -1;
        if (a.name.length < b.name.length) return 1;
        return 0;
      });

      // 変数を置換してあげるステップ
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        for (var varIndex = 0; varIndex < vars.length; varIndex++) {
          // その変数名を含んでいたら置換する
          while (lines[lineIndex].indexOf(vars[varIndex].name) !== -1) {
            lines[lineIndex] = lines[lineIndex].replace(vars[varIndex].name, vars[varIndex].value);
          }
        }
      }

      var compiledContents = '';

      // 最終的にlinesをcontentsに入れてあげる
      for (var i = 0; i < lines.length; i++) {
        if (lines[i] === '') {
          continue;
        }
        compiledContents += lines[i] + '\n';
      }
      
      file.contents = new Buffer(compiledContents);
      return callback(null, file);
    }

    this.push(file);
    callback();
  };

  return through.obj(transform);
};