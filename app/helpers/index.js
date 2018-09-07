

const PATH = "/home/tgdd/chat_history/";
var fs = require('fs');

var encoding = require("encoding");
var redis = require("redis"),
    client = redis.createClient(6379, "localhost");

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
    logChatHistory: function (sessionID, message, who, isAdminChat, messageID) {
        console.log("session  " + sessionID);
        var filename = PATH + sessionID + ".txt";

        //================================================
        client.select(3, function () {

            var messobj = {
                messid: messageID,
                who: who === 1 ? "CUSTOMER" : isAdminChat ? "ADMIN" : "BOT",
                time: new Date(new Date().getTime() + (7 * 60 * 60 * 1000)),
                content: "",
                isaccept: 0,
                fullname: message.fullname
            };

            if (who === 1) {
                messobj.isaccept = 1;//kh phai bot message
                if (!message.postbackobject.title) {
                    messobj.content = message.messageobject.content.replace(/\n/g, '') + "<br />";
                }
                else {
                    messobj.content = message.postbackobject.title + "<br />";
                }
            }
            else {
                if (!message || (message && message.length < 2)) return; //rác
                if (isAdminChat) {
                    messobj.content = message.messageobject.content.replace(/\n/g, '') + "<br />";
                    messobj.isaccept = 1;
                }
                else {
                    messobj.content = message;
                    messobj.fullname = "JAME BOT";
                    messobj.isaccept = 0;
                }
            }

            if (messobj.content.length < 2) return;
            
            client.rpush(sessionID, JSON.stringify(messobj), function (err, reply) {

                if (err) {
                    var status = false;
                    console.log(err);
                    return status;
                }
            });



        });

        //================================================
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
    },
    editMessage: function (senderID, messageID, isaccept, data) {
        // console.log("=============Message accept or deny : ",isaccept);

        client.select(3, function () {

            client.lrange(senderID, 0, -1, function (err, res) {
                if (err) {
                    console.log(err);
                    return false;
                }
                else {

                    for (var i = 0; i < res.length; i++) {
                        var obj = JSON.parse(res[i]);
                        //console.log("===========================");
                        //console.log(obj);
                        if (obj.messid === messageID) {

                            var newobj = obj;
                            newobj.isaccept = isaccept;
                           // console.log(newobj);

                            client.lset(senderID, i, JSON.stringify(newobj), function (err, reply) {
                                if (err) {
                                    console.log(err);
                                    return false;
                                }
                                else {
                                    return true;

                                }
                            });
                        }
                    }
                    return true;
                }

            });

        });

    }
};
