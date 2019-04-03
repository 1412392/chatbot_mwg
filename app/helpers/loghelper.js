var fs = require('file-system');

module.exports = {

    WriteLogToFile: function (path, content) {
        var status = false;
        return new Promise(function (resolve, reject) {
            fs.appendFile(path, content, function (err) {

                if (err) {

                    reject(err);
                }
                else {
                    status = true;
                    resolve(status);
                }
            });
        });

    }
}