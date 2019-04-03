var fetch = require('node-fetch');
var request = require("request")
const https = require('https');
var fetchTimeout = require('fetch-timeout');
var tracechat = require('../helpers/index');
var logerror = require('../helpers/loghelper');
var ProductAPI = require('./ProductAPI');
var CategoryAPI = require('./CategoryAPI');
var ConstConfig = require('../const/config');

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
        if (replyobject.chatmodule && replyobject.chatmodule === ConstConfig.MODULE_CHATWITHBOT) {
            return fetch(ConstConfig.SERVER_CHATWITHBOT, {
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
            return fetch(ConstConfig.SERVER_RESPONSE, {
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

        if (replyobject.chatmodule && replyobject.chatmodule === ConstConfig.MODULE_CHATWITHBOT) {
            return fetch(ConstConfig.SERVER_CHATWITHBOT, {
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
            return fetch(ConstConfig.SERVER_RESPONSE, {
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
    },

    SendToUserListDistrict: function (productID, provinceID, sender, siteid, replyobject, questionTitle, intent) {

        if (provinceID) {

            var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
            CategoryAPI.APIGetDistrictByProvince(ConstConfig.URLAPI_CATEGORY, argsDistrictByProvince, function getResult(result) {
                //console.log(result.GetDistricByProvinceResult.DistrictBO[0]);
                var length = result.GetDistricByProvinceResult.DistrictBO.length;
                var arrDistrictBO = result.GetDistricByProvinceResult.DistrictBO;
                resultanswer = "";
                //resultanswer += "<br />CHỌN QUẬN/HUYỆN CỦA "+sessions[sessionId].gender+"  ĐỂ KIỂM TRA CHÍNH XÁC HƠN? ";

                var type = "template";
                questionTitle = "Danh sách quận/huyện";

                var jsonmessageDistrict = {
                    username: sender,
                    siteid: siteid,
                    messagetype: "template",
                    replyobject: replyobject,
                    messagecontentobject: {
                        elements: [
                            {
                                title: questionTitle,
                                buttons: []
                            }
                        ]
                    }
                };
                arrDistrictBO.forEach(function (item, i) {
                    var total = 0;
                    var districbo = arrDistrictBO[i];
                    var argsProductStock = {
                        productID: parseInt(productID), productCode: null, provinceID: parseInt(provinceID),
                        districtID: parseInt(districbo.districtIDField), pageSize: 20, pageIndex: pageIndexDefault, total
                    };

                    ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function (item) {
                        console.log(item.GetStoreInStock2016Result);
                        if (item.GetStoreInStock2016Result) {
                            if (item.GetStoreInStock2016Result.StoreBO.length > 0)
                                jsonmessageDistrict.messagecontentobject.elements[0].buttons.push({
                                    type: "postback",
                                    title: districbo.districtNameField,
                                    payload: districbo.districtIDField
                                });
                        }
                    });
                });


                setTimeout(() => {
                    //kiểm tra nếu không có quận huyện nào còn hàng thì send lại option
                    console.log(JSON.stringify(jsonmessageDistrict.messagecontentobject.elements[0].buttons));

                    if (jsonmessageDistrict.messagecontentobject.elements[0].buttons.length <= 0) {

                        module.exports.SentToClient(sender, "Không có quận/huyện nào còn hàng tại khu vực này. Vui lòng hỏi khu vực khác hoặc lựa chọn vấn đề khác", "", 0, "", replyobject, siteid)
                            .catch(console.error);

                        module.exports.SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                            .catch(console.error);



                        return;
                    }
                    else {


                        // var bodystring = JSON.parse(jsonmessageDistrict);
                        var bodyjson = JSON.stringify(jsonmessageDistrict);
                        console.log(bodyjson);


                        module.exports.SentToClientButton(sender, bodyjson, intent, replyobject)
                            .catch(console.error);
                    }

                }, 2000);


            });
        }

    },
    SendToUserListColor: function (sessions, sessionId, productID, productName, sender, siteid, replyobject, questionTitle, intent) {
        if (productID) {

            var argsProductColor = { intProductID: parseInt(productID), LangID: "vi-VN" };
            APIGetProductColor(ConstConfig.URLWCF_PRODUCT, argsProductColor, function getResult(result) {


                //console.log(result.GetDistricByProvinceResult.DistrictBO[0]);
                var length = result.GetProductColorByProductIDLangResult.ProductColorBO.length;
                //resultanswer = "Sảm phẩm " + productName + " hiện tại có các màu sau: <br />";
                //if (length > 3) {
                //    //nếu có nhiều hơn 3 màu, in danh sách màu
                //    for (var i = 0; i < length; i++) {
                //        var colorBo = result.GetProductColorByProductIDLangResult.ProductColorBO[i];
                //        resultanswer += colorBo.colorname + " , ";

                //    }

                //}

                //resultanswer += "<br />CHỌN MÀU SẮC "+sessions[sessionId].gender+"  QUAN TÂM CHO SẢN PHẨM ĐỂ KIỂM TRA CHÍNH XÁC HƠN? ";

                var type = "template";
                questionTitle = "Danh sách màu sắc";

                var jsoncolortemplate = {
                    username: sender,
                    siteid: siteid,
                    messagetype: "template",
                    replyobject: replyobject,
                    messagecontentobject: {
                        elements: [
                            {
                                title: questionTitle,
                                buttons: []
                            }
                        ]
                    }
                };

                for (var i = 0; i < length; i++) {
                    var colorBo = result.GetProductColorByProductIDLangResult.ProductColorBO[i];
                    //console.log(colorBo);                                                                           
                    jsoncolortemplate.messagecontentobject.elements[0].buttons.push({
                        type: "postback",
                        title: colorBo.ColorName,
                        payload: colorBo.ProductCode
                    });
                }


                var bodyjson = JSON.stringify(jsoncolortemplate);

                // console.log(bodyjson);
                //xóa màu cũ đi
                sessions[sessionId].color = null;
                sessions[sessionId].colorname = null;

                setTimeout(() => {
                    module.exports.SentToClientButton(sender, bodyjson, intent, replyobject)
                        .catch(console.error);
                }, 1500);

            });//end APIGetProductColor
        }
    },
    fbEvaluate: function (id, replyobject, siteid) {
        return;
        var messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);
        var body = JSON.stringify({
            username: id,
            siteid: siteid,
            messageID: messageID,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: "Phiếu đánh giá dịch vụ",
                        buttons: [
                            {
                                type: "postback",
                                title: "Tốt",
                                payload: "GOOD"
                            }, {
                                type: "postback",
                                title: "Trung bình",
                                payload: "NORMAL"
                            },
                            {
                                type: "postback",
                                title: "Tệ",
                                payload: "BAD"
                            }
                        ]
                    }
                ]

            }
        });

        //===============trace log
        var contentlogs = "<p>" + "Phiếu đánh giá dịch vụ" + "</p>";
        contentlogs += "<button " + "type=button>" + "Tốt" + "</button>" + "<br />";
        contentlogs += "<button " + "type=button>" + "Trung bình" + "</button>" + "<br />";
        contentlogs += "<button " + "type=button>" + "Tệ" + "</button>" + "<br />";

        tracechat.logChatHistory(id, contentlogs, 2, false, messageID);//1 là câu hỏi, 2 là câu trả lời

        fetch(serverChatwithBot, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
            json: true
        })
            .then((rsp) => {

            });
        //
        fetch(severResponse, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
            json: true
        })
            .then(rsp => rsp.json())
            .then(json => {
                if (json.error && json.error.message) {
                    throw new Error(json.error.message);
                }

                return json;
            });
    }
}



