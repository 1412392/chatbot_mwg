

const PATH = "/home/tgdd/chat_history/";
var fs = require('fs');

var encoding = require("encoding");


function writeFile(path, content) {
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

};

const checkFileExist = (newfile, dirname) => {
    var status = false;
    return new Promise(function (resolve, reject) {
        fs.readdir(dirname, function (err, filenames) {
            if (err) {

                console.log(err);
                reject(err);
            }
            for (var i = 0; i < filenames.length; i++) {
                if (filenames[i] === newfile) {
                    status = true;
                    resolve(status)
                }

            }

            resolve(status)

        });
    });
}
module.exports = {
    logChatHistory: function (sessionID, message, who, isAdminChat) {
        console.log("session  " + sessionID);
        var filename = PATH + sessionID + ".txt";



        //check file exist
        checkFileExist(sessionID + ".txt", PATH).then(function (result) {
            if (!result) {//file chưa tồn tại
                writeFile(filename, message.fullname + "<br />" + "\n");

            }

            setTimeout(function () {
                if (who === 1) {
                    if (!message.postbackobject.title) {
                        writeFile(filename, "CUSTOMER-" + message.messageobject.content.replace(/\n/g, '') + "<br />" + "\n");
                    }
                    else {//postback
                        writeFile(filename, "CUSTOMER-" + message.postbackobject.title + "<br />" + "\n");
                    }
                }
                else {
                    if (message && message.length < 2) return; //rác
                    if (isAdminChat) {
                        writeFile(filename, "ADMIN-" + message.messageobject.content.replace(/\n/g, '') + "<br />" + "\n");
                    }
                    else {
                        writeFile(filename, "BOT-" + message + "<br />" + "\n");
                    }
                }

            }, 1000);

        });


        var status = true;



        return status;
    }
};
