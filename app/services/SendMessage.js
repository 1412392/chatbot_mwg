
var fetch = require('node-fetch');
var request = require("request")
const https = require('https');
var fetchTimeout = require('fetch-timeout');
var tracechat = require('../helpers/index');
var logerror = require('../helpers/loghelper');

const MODULE_CHATWITHBOT = "CHATWITHBOT";
var serverChatwithBot = "http://172.16.3.123:3000/";

//var severResponse = "http://3e9daa83.ngrok.io/chatbot";

 var severResponse = "http://rtm.thegioididong.com/chatbot";

module.exports = {
    SentToClientButton: function (id, text, intent, replyobject) {
        //console.log("============SentToClientButton===============");
        if (!intent.includes("ask_instalment")) {
            return new Promise((resolve, reject) => {
                return reject('SKIP')
            })
        }

        var jsonparse = JSON.parse(text);
        var btnlist = jsonparse.messagecontentobject.elements[0].buttons;
        var titlelogs = jsonparse.messagecontentobject.elements[0].title;
        //phân rã button thành html, lưu file logs
        var contentlogs = "";
        contentlogs += "<p>" + titlelogs + "</p>";
        for (var i = 0; i < btnlist.length; i++) {
            if (btnlist[i].type === "web_url") {
                contentlogs += "<a " + "href=" + "'" + btnlist[i].url + "'" + ">" + btnlist[i].title + "</a>" + "<br />"
            }
            else if (btnlist[i].type === "postback") {
                contentlogs += "<button " + "type=button " + "value=" + "'" + btnlist[i].title + "'" + ">" + btnlist[i].title + "</button>" + "<br />"
            }
        }
        // console.log(contentlogs);
        // console.log("============SentToClientButton===============");
        var messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);

        tracechat.logChatHistory(id, contentlogs, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

        jsonparse.messageID = messageID;

        //sendtochatwithbot
        if (replyobject.chatmodule && replyobject.chatmodule === MODULE_CHATWITHBOT) {
            return fetch(serverChatwithBot, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonparse),
                json: true
            })
                .then(rsp => rsp.json())
                .then(json => {
                    if (json.error && json.error.message) {
                        //throw new Error(json.error.message);
                    }

                    return json;
                });
        }
        else {
            return fetch(severResponse, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonparse),
                json: true
            })
                .then(rsp => rsp.json())
                .then(json => {
                    if (json.error && json.error.message) {
                        //throw new Error(json.error.message);
                    }

                    return json;
                });
        }

    },

    SentToClient: function (id, text, questionTitle, state, intent, replyobject, siteid) {
        //console.log('send=' + text);

        // console.log("=============SEND TO CUSTOMER===================");
        console.log(text);


        //============27/8/2018=====> bỏ nhưng câu hỏi ngoài: instalment,greet,goodbye,thankyou

        if (!intent.includes("ask_instalment")) {
            return new Promise((resolve, reject) => {
                return reject('SKIP')
            })
        }
        var body = "";

        if (state === 0)//câu hỏi do user send, không phải từ postback
        {
            if (intent == "greet") {
                var messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);

                body = JSON.stringify({
                    username: id,
                    siteid: siteid,
                    messageID: messageID,
                    messagetype: "template",
                    replyobject: replyobject,
                    messagecontentobject: {
                        elements: [
                            {
                                title: questionTitle + text,
                                buttons: [
                                    //{
                                    //    type: "web_url",
                                    //    url: "https://www.thegioididong.com",
                                    //    title: "Truy cập website"
                                    //}, 
                                    // {
                                    //     type: "postback",
                                    //     title: "Xem tồn kho sản phẩm",
                                    //     payload: "1"
                                    // },
                                    // {
                                    //     type: "postback",
                                    //     title: "Xem giá sản phẩm",
                                    //     payload: "2"
                                    // },
                                    // {
                                    //     type: "postback",
                                    //     title: "Xem khuyến mãi sản phẩm",
                                    //     payload: "3"
                                    // },
                                    {
                                        type: "postback",
                                        title: "Thông tin trả góp",
                                        payload: "4"
                                    }
                                    // {
                                    //     type: "postback",
                                    //     title: "Kiểm tra đơn hàng",
                                    //     payload: "5"
                                    // }
                                ]
                            }
                        ]

                    }
                });
                var contentlogs = "<p>" + text + "</p>";
                // contentlogs += "<button " + "type=button>" + "Xem tồn kho sản phẩm" + "</button>" + "<br />";
                // contentlogs += "<button " + "type=button>" + "Xem giá sản phẩm" + "</button>" + "<br />";
                // contentlogs += "<button " + "type=button>" + "Xem khuyến mãi sản phẩm" + "</button>" + "<br />";
                contentlogs += "<button " + "type=button>" + "Thông tin trả góp" + "</button>" + "<br />";
                // contentlogs += "<button " + "type=button>" + "Kiểm tra đơn hàng" + "</button>" + "<br />";
                //contentlogs += "<button " + "type=button>" + "Thông tin trả góp" + "</button>" + "<br />";

                tracechat.logChatHistory(id, contentlogs, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

            }
            else if (intent == "option_whenoutcolorstock") {
                let messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);


                body = JSON.stringify({
                    username: id,
                    siteid: siteid,
                    messagetype: "template",
                    replyobject: replyobject,
                    messageID: messageID,
                    messagecontentobject: {
                        elements: [
                            {
                                title: questionTitle + text,
                                buttons: [
                                    {
                                        type: "postback",
                                        title: "Hỏi sản phẩm khác",
                                        payload: "1"
                                    },
                                    {
                                        type: "postback",
                                        title: "Chọn lại màu",
                                        payload: "6"
                                    },
                                    {
                                        type: "postback",
                                        title: "Chọn lại quận/huyện",
                                        payload: "7"
                                    }
                                ]
                            }
                        ]

                    }
                });
                var contentlogs = "<p>" + text + "</p>";
                contentlogs += "<button " + "type=button>" + "Hỏi sản phẩm khác" + "</button>" + "<br />";
                contentlogs += "<button " + "type=button>" + "Chọn lại màu" + "</button>" + "<br />";
                contentlogs += "<button " + "type=button>" + "Chọn lại quận/huyện" + "</button>" + "<br />";

                tracechat.logChatHistory(id, contentlogs, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

            }
            else {
                let messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);

                body = JSON.stringify({
                    username: id,
                    siteid: siteid,
                    messageID: messageID,
                    replyobject: replyobject,
                    messagetype: "text",
                    messagecontentobject: text
                });


                tracechat.logChatHistory(id, text, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

            }

        }
        else {
            var messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);

            body = JSON.stringify({
                username: id,
                siteid: siteid,
                messageID: messageID,
                replyobject: replyobject,
                messagetype: "text",
                messagecontentobject: text
            });

            tracechat.logChatHistory(id, text, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

        }

        //console.log("================================");
        //console.log(body);

        if (replyobject.chatmodule && replyobject.chatmodule === MODULE_CHATWITHBOT) {
            return fetch(serverChatwithBot, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body,
                json: true
            }).then(rsp => rsp.json())
                .then(json => {
                    if (json.error && json.error.message) {
                        //throw new Error(json.error.message);
                    }

                    return json;
                });
        }
        else {
            return fetch(severResponse, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: body,
                json: true
            }).then(rsp => rsp.json())
                .then(json => {
                    if (json.error && json.error.message) {
                        //throw new Error(json.error.message);
                    }

                    return json;
                });
        }
    }
}



