//import { read } from 'fs';

var tracechat = require('../helpers/index');
var helpernumber = require('../helpers/helpernumber');
var fetch = require('node-fetch');
var request = require("request")
var path = require('path');
var elasticsearch = require('elasticsearch');
var soap = require('soap');
var fs = require('fs');

var FB_PAGE_TOKEN = 'EAAdDXpuJZCS8BAHrQmdaKGOUC51GPjtXwZBXlX6ZCN4OuGNssuky7ffyNwciAmicecV7IfX0rOfsFNUwZCMnZATJxWpkK0aFmj2XUuhacR8XA1sWsFiGasBtBcAOgon0BQqeP8RDCm6VQR9V9Ygxow0EvBwbhrHjwViGHDQ77dIkfkY3XDhzv';

var FB_APP_SECRET = '2ee14b4e3ccc367b37fce196af51ae09';
var severRasaQuery = "http://localhost:5000/parse?q=";

var severResponse = "https://137ce79e.ngrok.io/chatbot";

// var severResponse = "http://rtm.thegioididong.com/chatbot";

var urlApiProduct = "http://api.thegioididong.com/ProductSvc.svc?singleWsdl";
var urlApiCategory = "http://api.thegioididong.com/CategorySvc.svc?singleWsdl";
var urlwcfProduct = "http://webservice.thegioididong.com/ProductSvc.asmx?wsdl";
var provinceDefault = 3;
var pagesizedefault = 10;
var pageIndexDefault = 0;

var ASK_INSTALMENT_INFORMATION = "ask_instalment+information";
var ASK_INSTALMENT_PACKAGE0D = "ask_instalment+package0d";

var pathToExample = path.join(__dirname, '..', 'helpers', 'example');


var greet = [];
var offense = [];
var ask_name = [];
var unknowproduct = [];
var thankyou = [];
var goodbye = [];
var productnotfound = [];

var listBriefID = [
    "CMND + Hộ khẩu",//1
    "CMND + Bằng lái xe HOẶC Hộ khẩu",//2
    "",
    "CMND + Hộ khẩu + Hóa đơn điện/nước/internet",//4
    "",
    "CMND + Bằng lái xe HOẶC Hộ khẩu + Hóa đơn điện/nước/internet",//6
    "",
    "CMND + Hộ khẩu + Hóa đơn điện/nước/internet + Chứng minh thu nhập"//8
];
var lstAccessoryKeyword = [
    "ốp", "op lung", "bluetooth", "tai nghe", "tai phone", "pin", "sạc", "sac", "bàn phím", "ban phim", "loa", "thẻ nhớ", "the nho", "usb",
    "đồng hồ", "dong ho", "gậy", "giá đỡ", "gay tu suong", "dán màn hình", "dây cáp", "ong kinh", "kính", "túi", "day cap"
];
var lstCommonProduct = [
    "laptop", "iphone", "điện thoại iphone", "iphone đó", "nokia", "huawei", "note", "realme",
    "sạc", "ốp lưng", "pin", "oppo", "xiaomi", "mobiistar", "vivo", "samsung", "sam sung", "dell", "asus", "macbook", "hp",
    "dán màn hình", "cáp sạc", "laptop msi", "ipad 2017", "msi", "lenovo",
    "may tinh bang", "tablet", "máy tính bảng", "miếng dán cường lực", "dán cường lực"
];

var isGetExampleAnswer = false;

var el = new elasticsearch.Client({
    host: '192.168.2.54:9200',
    log: 'trace'
});

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
}

function randomNumber(lengthNumber) {
    return Math.floor((Math.random() * (lengthNumber - 1)) + 0);//random tu 0 den lengthnumber-1
}
const format_currency = (price) => {

    return price.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

}
const sessions = {};

const isIncludeAccessoryKeyword = (keyword) => {

    for (var i = 0; i < lstAccessoryKeyword.length; i++) {
        if (keyword.toLowerCase().includes(lstAccessoryKeyword[i]))
            return true;
    }
    return false;
};
const isGeneralProduct = (productname) => {
    for (var i = 0; i < lstCommonProduct.length; i++) {
        if (productname.toLowerCase().trim() === lstCommonProduct[i].toLocaleLowerCase().trim())
            return true;
    }
    return false;
}
const findOrCreateSession = (fbid) => {
    let sessionId;
    // Let's see if we already have a session for the user fbid
    Object.keys(sessions).forEach(k => {

        if (sessions[k].fbid === fbid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user fbid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = {
            fbid: fbid,
            context: {}
        };
    }
    return sessionId;
};


const SentToClientButton = (id, text, intent) => {
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

    //console.log(text);
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

            //return json;
        });


};


const SentToClient = (id, text, questionTitle, state, intent, replyobject, siteid) => {
    //console.log('send=' + text);

    // console.log("=============SEND TO CUSTOMER===================");
    console.log(text);


    //============27/8/2018=====> bỏ nhưng câu hỏi ngoài: instalment,greet,goodbye,thankyou

    if (!intent.includes("ask_instalment")) {
        return new Promise((resolve, reject) => {
            return reject('SKIP')
        })
    }

    // console.log("===============================================");

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

    return fetch(severResponse, {
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
                //throw new Error(json.error.message);
            }

            //return json;
        });


};

function SendToUserListColor(productID, productName, sender, siteid, replyobject, questionTitle, intent) {
    if (productID) {
        const sessionId = findOrCreateSession(sender);
        var argsProductColor = { intProductID: parseInt(productID), LangID: "vi-VN" };
        APIGetProductColor(urlwcfProduct, argsProductColor, function getResult(result) {


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
                SentToClientButton(sender, bodyjson, intent)
                    .catch(console.error);
            }, 1500);

        });//end APIGetProductColor
    }
}

function SendToUserListDistrict(productID, provinceID, sender, siteid, replyobject, questionTitle, intent) {



    if (provinceID) {

        var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
        APIGetDistrictByProvince(urlApiCategory, argsDistrictByProvince, function getResult(result) {
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

                APICheckInStock(urlApiCategory, argsProductStock, function (item) {
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

                    SentToClient(sender, "Không có quận/huyện nào còn hàng tại khu vực này. Vui lòng hỏi khu vực khác hoặc lựa chọn vấn đề khác", "", 0, "", replyobject, siteid)
                        .catch(console.error);

                    SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                        .catch(console.error);



                    return;
                }
                else {


                    // var bodystring = JSON.parse(jsonmessageDistrict);
                    var bodyjson = JSON.stringify(jsonmessageDistrict);
                    console.log(bodyjson);


                    SentToClientButton(sender, bodyjson, intent)
                        .catch(console.error);
                }

            }, 2000);


        });
    }

}

const fbEvaluate = (id, replyobject, siteid) => {
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


    //
    return fetch(severResponse, {
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


};

const getButtonFinancialCompany = (productID, productName, sender, siteid, replyobject, questionTitle) => {
    var jsonmessageFiC =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "HomeCredit",
                                payload: 8
                            },
                            {
                                type: "postback",
                                title: "FeCredit",
                                payload: 9
                            }
                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;

}

const getButtonBriefSupport = (sender, siteid, replyobject, questionTitle) => {
    var jsonmessageFiC =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "Xem hồ sơ yêu cầu",
                                payload: "BRIEFSUPPORT"
                            }
                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;

}
const getButtonInstalment = (sender, siteid, replyobject, questionTitle, productPrice, is0ptpercent) => {
    var jsonmessageFiC =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "Xem gói trả trước thường",
                                payload: "11"
                            }
                        ]
                    }
                ]
            }
        };

    if (is0ptpercent) {
        jsonmessageFiC.messagecontentobject.elements[0].buttons.push({
            type: "postback",
            title: "Xem gói trả góp 0% lãi suất",
            payload: "INSTALMENT_0PTLS"
        });
    }
    if (productPrice <= 25000000 && productPrice >= 2000000) {
        jsonmessageFiC.messagecontentobject.elements[0].buttons.push({
            type: "postback",
            title: "Xem gói trả trước 0đ",
            payload: "INSTALMENT_PACKAGE0D"
        })
    };

    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;

}
const AnotherOptionInstalment = (sender, siteid, replyobject, questionTitle, productPrice) => {
    var jsonmessageAnother =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            // {
                            //     type: "postback",
                            //     title: "Chọn lại công ty tài chính",
                            //     payload: 10
                            // },
                            {
                                type: "postback",
                                title: "Xem gói trả góp thường",
                                payload: 11
                            },
                            // {
                            //     type: "postback",
                            //     title: "Xem tồn kho",
                            //     payload: 2
                            // },
                            // {
                            //     type: "postback",
                            //     title: "Xem khuyễn mãi của sản phẩm",
                            //     payload: 3
                            // }

                        ]
                    }
                ]
            }
        };
    if (productPrice <= 25000000 && productPrice >= 2000000) {
        jsonmessageAnother.messagecontentobject.elements[0].buttons.push({
            type: "postback",
            title: "Gói trả trước 0đ",
            payload: "INSTALMENT_PACKAGE0D"
        })
    };

    var bodyjson = JSON.stringify(jsonmessageAnother);
    return bodyjson;
}
const AnotherOptionNormalInstalment = (sender, siteid, replyobject, questionTitle) => {
    var jsonmessageAnother =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "Chọn lại % trả trước",
                                payload: 14
                            },
                            {
                                type: "postback",
                                title: "Chọn lại số tháng trả góp",
                                payload: 15
                            },
                            {
                                type: "postback",
                                title: "Chọn lại công ty tài chính",
                                payload: "NORMALINSTALMENT_COMPANY"
                            }
                            // {
                            //     type: "postback",
                            //     title: "Hỏi sản phẩm khác",
                            //     payload: 1
                            // },
                            // {
                            //     type: "postback",
                            //     title: "Xem tồn kho",
                            //     payload: 2
                            // },
                            // {
                            //     type: "postback",
                            //     title: "Xem khuyễn mãi của sản phẩm",
                            //     payload: 3
                            // }
                            // {
                            //     type: "postback",
                            //     title: "Hỏi vấn đề khác",
                            //     payload: 11
                            // }

                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageAnother);
    return bodyjson;
}

const AnotherOptionNormalInstalment0d = (sender, siteid, replyobject, questionTitle) => {
    var jsonmessageAnother =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "Chọn lại số tháng trả góp",
                                payload: 15
                            }

                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageAnother);
    return bodyjson;
}

const getButtonListBrief = (productID, productName, sender, siteid, replyobject, questionTitle) => {
    var jsonmessageFiC =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "CMND + Hộ khẩu",
                                payload: "BID_1"
                            },
                            {
                                type: "postback",
                                title: "CMND + Bằng Lái Xe hoặc Hộ khẩu",
                                payload: "BID_2"
                            },
                            {
                                type: "postback",
                                title: "CMND + Hộ khẩu + Hóa đơn điện",
                                payload: "BID_4"
                            },
                            {
                                type: "postback",
                                title: "CMND + Bằng Lái Xe hoặc Hộ khẩu + Hóa đơn điện",
                                payload: "BID_6"
                            }
                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;

}
const getButtonYESNO = (productID, productName, sender, siteid, replyobject, questionTitle) => {
    var jsonmessageFiC =
        {
            username: sender,
            siteid: siteid,
            messagetype: "template",
            replyobject: replyobject,
            messagecontentobject: {
                elements: [
                    {
                        title: questionTitle,
                        buttons: [
                            {
                                type: "postback",
                                title: "Có",
                                payload: 12
                            },
                            {
                                type: "postback",
                                title: "Không",
                                payload: 13
                            }
                        ]
                    }
                ]
            }
        };

    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;

}

const getButtonMonthInstalment = (productID, productName, sender, siteid, replyobject, questionTitle, monthlist) => {
    var jsonmessageFiC = {
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
    // for (var i = 0; i < 3; i++) {
    //     jsonmessageFiC.messagecontentobject.elements[0].buttons.push({
    //         type: "postback",
    //         title: monthlist[i] + " tháng",
    //         payload: monthlist[i] + "|MONTH"
    //     });
    // }
    monthlist = [6, 9, 12];

    monthlist.forEach(element => {
        jsonmessageFiC.messagecontentobject.elements[0].buttons.push({
            type: "postback",
            title: element + " tháng",
            payload: element + "|MONTH"
        });
    });


    var bodyjson = JSON.stringify(jsonmessageFiC);
    return bodyjson;
}

function APIGetProductColor(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetProductColorByProductIDLang(args, function (err, result) {

            var productColor = JSON.parse(JSON.stringify(result));

            // console.log("=============================");
            // console.log(productDetail);

            //resultanswer=ChangeResultAnswer(productDetail);

            fn(productColor);
            // self.resultanswer+="Sản phẩm: "+productDetail.GetProductDetailBySiteIDResult.ProductName+"<br />"+
            // "Giá: "+productDetail.GetProductDetailBySiteIDResult.ExpectedPrice;


        });

    });
}

function APIGetSeoURLProduct(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.getSeoURLProduct(args, function (err, result) {

            var seourl = JSON.parse(JSON.stringify(result));

            var final = "https://www.thegioididong.com" + seourl.getSeoURLProductResult;
            fn(final);



        });

    });
}



function APIGetProductDetail(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetProduct(args, function (err, result) {

            var productDetail = JSON.parse(JSON.stringify(result));

            // console.log("=============================");
            // console.log(productDetail);

            //resultanswer=ChangeResultAnswer(productDetail);

            fn(productDetail);
            // self.resultanswer+="Sản phẩm: "+productDetail.GetProductDetailBySiteIDResult.ProductName+"<br />"+
            // "Giá: "+productDetail.GetProductDetailBySiteIDResult.ExpectedPrice;


        });

    });
}

function APICheckInStock(url, args, fn) {
    console.log(args);
    soap.createClient(url, function (err, client) {

        client.GetStoreInStock2016(args, function (err, result) {

            var stores = JSON.parse(JSON.stringify(result));
            fn(stores);


        });

    });
}

function APIGetDistrictByProvince(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetDistricByProvince(args, function (err, result) {

            var lstDistric = JSON.parse(JSON.stringify(result));
            fn(lstDistric);

        });

    });
}



function APIGetProductSearch(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.SearchProductPhi(args, function (err, result) {

            var productSearch = JSON.parse(JSON.stringify(result));
            fn(productSearch);

        });

    });
}

function APICheckZeroInstalment(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetZeroInstallmentByProduct(args, function (err, result) {

            var productSearch = JSON.parse(JSON.stringify(result));
            //console.log(productSearch);
            if (productSearch) {
                if (productSearch.GetZeroInstallmentByProductResult.ID) {
                    var fromDate = Date.parse(productSearch.GetZeroInstallmentByProductResult.FromDate);
                    var toDate = Date.parse(productSearch.GetZeroInstallmentByProductResult.ToDate);
                    var nowDate = Date.parse(new Date());
                    // console.log(fromDate)

                    if (nowDate >= fromDate && nowDate <= toDate) {
                        fn(true);
                    }
                    else {
                        fn(false);
                    }

                }
                else {
                    fn(false);
                }
            }
            else fn(false);

        });

    });
}

function APIGetInfoZeroInstalmentPackage(url, args, fn) {
    var finalResult = [];
    soap.createClient(url, function (err, client) {
        if (args.CompanyId === -1) { //=>show ca 2 cong ty luon
            args.CompanyId = 1;
            client.GetFeatureInstallment(args, function (err, result) {

                if (result) {
                    var package = JSON.parse(JSON.stringify(result));
                    finalResult.push(package);
                }
                args.CompanyId = 3;
                client.GetFeatureInstallment(args, function (err, result) {
                    if (result) {
                        var package = JSON.parse(JSON.stringify(result));
                        finalResult.push(package);
                    }
                    fn(finalResult);

                });
            });
        }
        else {
            client.GetFeatureInstallment(args, function (err, result) {
                if (result) {
                    var package = JSON.parse(JSON.stringify(result));
                    finalResult.push(package);
                    fn(finalResult);
                }
                else {
                    fn(null);
                }

            });
        }
    });
}

function APIGetNormalInstallment(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetListNormalInstallment(args, function (err, result) {
            // console.log("====packages", result);
            var packages = JSON.parse(JSON.stringify(result));

            fn(packages);

        });

    });
}

function APIGetInstallmentResult(url, args, fn) {
    soap.createClient(url, function (err, client) {
        //console.log(args);
        client.GetInstallmentResult(args, function (err, result) {
            //console.log("====packages", result);
            if (result) {
                var package = JSON.parse(JSON.stringify(result));
                fn(package);
            }
            else {
                fn(null);
            }
        });

    });
}

function hasNumber(myString) {
    return /\d/.test(myString);
}

async function getElasticSearch(client, index, type, keyword, callback) {

    await client.search({
        index: index,
        type: type,
        q: keyword
    }, function (error, response) {
        if (error) return callback(error, null); // returns the callback with the error that happened

        return callback(null, response.hits.hits);
    });  // returns the result of showdocs(response)

}

async function getElasticSearchDistrictAndProvince(client, index, type, keyword, provinveID, callback) {

    await client.search({
        index: index,
        type: type,
        q: keyword + " AND " + "provinceID:" + '"' + provinveID + '"'
    }, function (error, response) {
        if (error) return callback(error, null); // returns the callback with the error that happened

        return callback(null, response.hits.hits);
    });  // returns the result of showdocs(response)

}

function ToGroupWebNotePromotionShowWeb(objProduct) {
    var last = [];

    if (objProduct.promotionField) {
        var listtmppromotion = [];
        objProduct.promotionField.Promotion.forEach(element => {
            if (element.productNameField &&
                (element.groupIDField.toLowerCase() === "webnote" || element.groupIDField.toLowerCase() === "tặng" || objProduct.promotionField.Length == 1)) {
                listtmppromotion.push(element);
            }

        });

        if (listtmppromotion === null) return null;
        listtmppromotion.forEach(element => {
            // console.log("BeginDate:", Date.parse(element.beginDateField));
            // console.log("New Date:", new Date().getTime());

            if (element.productNameField.includes("|")) {
                var listcurrent = element.productNameField.split('|');
                for (var i = 0; i < listcurrent.length; i++) {
                    console.log("BeginDate:", Date.parse(element.beginDateField));

                    if (Date.parse(element.beginDateField) <= (new Date()).getTime() && Date.parse(element.endDateField) >= (new Date()).getTime()) {
                        var g = {};
                        g.beginDateField = element.beginDateField;
                        g.discountValueField = element.discountValueField;
                        g.endDateField = element.endDateField;
                        g.excludePromotionField = element.excludePromotionField;
                        g.ExtensionData = element.ExtensionData;
                        g.groupIDField = element.groupIDField;
                        g.isPercentDiscountField = element.isPercentDiscountField;
                        g.notApplyForInstallmentField = element.notApplyForInstallmentField;
                        g.productCodesField = element.productCodesField;
                        g.productIdsField = element.productIdsField;
                        g.productNameField = element.productNameField;
                        g.promotionIDField = element.promotionIDField;
                        g.promotionListGroupIDField = element.promotionListGroupIDField;
                        g.promotionListGroupNameField = element.promotionListGroupNameField;
                        g.productNameField = element.promotionListGroupNameField;
                        g.productCodesField = element.productCodesField.split('|')[i];
                        g.productIdsField = element.productIdsField.split('|')[i];
                        g.returnValueField = element.returnValueField;
                        last.push(g);
                        break;
                    }
                }
            }
            else {
                last.push(element);
            }

        });
    }
    else {
        return null;
    }
    return last;

}
function PromotionIsNotApplyForCompany(productId, listPreventId, ErpInstallProgramId) {
    if (productId <= 0 || !listPreventId || ErpInstallProgramId <= 0) return false;
    var bIsPrevent = false;
    var lstTemp = listPreventId.split('|');
    var sTemp = null;
    if (lstTemp != null && lstTemp.length > 0) {
        for (var i = 0; i < lstTemp.length; i++) {
            var element = lstTemp[i];
            if (element && element.toString().includes(ErpInstallProgramId.toString())) {
                sTemp = element;
                break;
            }
        }

        bIsPrevent = sTemp != null ? true : false;
    }
    return bIsPrevent;
}

function GetSystemPromotionWithoutPrevent(productBO, decPrice, isZeroInstallment, ErpInstallProgramId = -1) {
    var decDisCountValue = 0;
    if (!productBO) return 0;
    var lsWebNote = ToGroupWebNotePromotionShowWeb(productBO);

    if (!lsWebNote || lsWebNote.length == 0) return 0;

    var newlsWebNote = [];
    if (isZeroInstallment) {
        lsWebNote.forEach(element => {
            if (element && element.notApplyForInstallmentField === false) {
                newlsWebNote.push(element);
            }
        });
    }
    else {
        newlsWebNote = lsWebNote;
    }

    if (newlsWebNote == null || newlsWebNote.length == 0) return 0;

    for (var i = 0; i < newlsWebNote.length; i++) {

        var item = newlsWebNote[i];
        if (Date.parse(item.beginDateField) <= new Date().getTime() && parseFloat(item.discountValueField) > 0) {

            var bPreventPromo = PromotionIsNotApplyForCompany(productBO.productIDField, item.excludeInstallmentProgramIDField, ErpInstallProgramId);
            if (!bPreventPromo) {
                if (item.isPercentDiscountField == true) {
                    decDisCountValue = decPrice * (item.discountValueField / 100.0);
                    break;
                }
                else {
                    decDisCountValue = item.discountValueField;
                    break;
                }
            }

        }

    }
    return decDisCountValue;
}
function GetInstallPercentPrepaid(objInstall, InstallPrice) {
    var Prepaid = -1;
    if (objInstall == null || InstallPrice == 0) {

        return -1;
    }
    var iPercent = -1;
    if (objInstall.PrepaymentAmount > 0) {
        if (objInstall.PaymentPercentFrom == 0) {
            Prepaid = objInstall.PrepaymentAmount;
            var tmpPercent = (Prepaid * 100.0) / InstallPrice;
            if (tmpPercent > 0)
                iPercent = parseInt(tmpPercent);
            else
                iPercent = objInstall.PaymentPercentFrom;
        }
        else
            iPercent = objInstall.PaymentPercentFrom;
    }
    else {
        iPercent = objInstall.PaymentPercentFrom;
        Prepaid = InstallPrice * (iPercent / 100.0);
    }
    return iPercent;
}
function GetSystemPromotionDisCountValue(productBO, decPrice, isZeroInstallment) {
    var decDisCountValue = 0;
    if (productBO == null) return 0;
    var lsWebNote = ToGroupWebNotePromotionShowWeb(productBO);
    if (lsWebNote == null || lsWebNote.length == 0) return 0;
    var newlsWebNote = [];
    if (isZeroInstallment) {
        lsWebNote.forEach(element => {
            if (element && element.notApplyForInstallmentField === false) {
                newlsWebNote.push(element);
            }
        });
    }
    else {
        newlsWebNote = lsWebNote;
    }
    if (newlsWebNote == null || newlsWebNote.length == 0) return 0;

    for (var i = 0; i < newlsWebNote.length; i++) {

        var item = newlsWebNote[i];
        if (Date.parse(item.beginDateField) <= new Date().getTime() && parseFloat(item.discountValueField) > 0) {

            if (item.isPercentDiscountField == true) {
                decDisCountValue = decPrice * (item.discountValueField / 100.0);
                break;
            }
            else {
                decDisCountValue = item.discountValueField;
                break;
            }

        }
    }
    return decDisCountValue;
}
function IsSystemPromoNotApplyForCompany(productBO, ErpInstallProgramId) {
   // console.log("====ErpInstallProgramId====", ErpInstallProgramId);

    if (productBO == null || ErpInstallProgramId == -1) return false;
    var lstPromotion = productBO.promotionField;
    console.log("====lstPromotion====", lstPromotion);

    if (lstPromotion == null || lstPromotion.length == 0) return false;

    //region Lấy list khuyến mãi hệ thống
    var lstPromotionFinal = ToGroupWebNotePromotionShowWeb(productBO);

    if (lstPromotionFinal == null || lstPromotionFinal.length == 0) return false;
    var lstNewPromotionFinal = [];
    lstPromotionFinal.forEach(element => {
        if (element && (Date.parse(element.beginDateField) <= new Date().getTime() && Date.parse(element.endDateField) >= new Date().getTime())) {
            lstNewPromotionFinal.push(element);
        }
    });

    if (lstNewPromotionFinal == null || lstNewPromotionFinal.length == 0) return false;
    //endregion

    //Bổ sung: Chỉ lấy check những khuyến mãi giảm tiền "tặng"
    //lstPromotionFinal = lstPromotionFinal.FindAll(p => p != null && p.groupIDField.ToLower() == "tặng");
    var temptInstalmentLsit = [];
    for (var i = 0; i < lstNewPromotionFinal.length; i++) {
        if (lstNewPromotionFinal[i] && lstNewPromotionFinal[i].groupIDField.toLowerCase().trim() === "tặng") {
            temptInstalmentLsit.push(lstNewPromotionFinal[i]);
        }
    }

    lstNewPromotionFinal = temptInstalmentLsit;
    if (lstNewPromotionFinal == null || lstNewPromotionFinal.length == 0) return false;


    //region Kiểm tra loại trừ khuyến mãi

    var lstErpInstallProgramId = null;
    var bResult = false;
    for (var i = 0; i < lstNewPromotionFinal.length; i++) {
        var itemPromo = lstNewPromotionFinal[i];

        if (itemPromo.excludeInstallmentProgramIDField) {
            lstErpInstallProgramId = itemPromo.excludeInstallmentProgramIDField.split('|');
            if (lstErpInstallProgramId == null || lstErpInstallProgramId.length == 0) continue;

            for (var j = 0; j < lstErpInstallProgramId.length; j++) {
                if (lstErpInstallProgramId[j] && lstErpInstallProgramId[j].includes(ErpInstallProgramId.toString())) {
                    bResult = true; break;
                }
            }
            if (bResult == true) break;

        }
    }
    return bResult;

    //endregion
}



const getJsonAndAnalyze = (url, sender, sessionId, button_payload_state, replyobject, siteid) => {
    //console.log(url);
    return request({
        url: url,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        json: true
    }, function (error, response, body) {
        //console.log(url);
        //console.log("===================================");
        //console.log(JSON.stringify(body)); // Print the json response
        // if (!error && response.statusCode === 200) {
        //     console.log(body) // Print the json response
        // }
        var object = JSON.stringify(body);
        var json = JSON.parse(object);

        var resultanswer = "";

        //   console.log(json.intent);
        //   console.log(json.entities);

        // console.log(json.text);

        var intent = json.intent.name;

        var entities = json.entities;
        var questionTitle = "";
        var customer_question = json.text;

        var ishaveProductEntity = false, ishaveMonthInstalment = false,
            ishavePercentInstalment = false, ishaveProduct = false,
            ishaveMoneyPrepaidInstalment = false, isAsk0PTInstalment = false;


        //==========================================================
        if (sessions[sessionId].isLatestAskBrief) {
            //kịch bản: đang trong luồng hỏi nhưng khách hàng lại push câu khác vào không liên quan
            if (intent) {//không thể có intent trong th này đc
                //dừng quá trình hỏi trả góp vì không liên quan, ví du:
                //1.ban cho mình hỏi con 6s plus 32g trả góp trc 50%
                //2.có dk giảm giá 1tr ko ban
                // console.log("intent", intent);
                sessions[sessionId].isLatestAskBrief = false;

            }
            else {
                intent = ASK_INSTALMENT_INFORMATION;
                try {
                    var BriefID = parseInt(button_payload_state.split('_')[1]);
                    sessions[sessionId].BriefID = BriefID;

                }
                catch (err) {
                    //kịch bản: người dùng không chọn mà put 1 câu hỏi khác (do admin kh duyệt)
                    sessions[sessionId].BriefID = 1;//gán mặc định
                }
            }
        }

        else if (sessions[sessionId].isLatestAskPercentInstalment) {
            if (intent) {
                //khách hàng đã gián đoạn luồng chat này
                //sessions[sessionId].isLatestAskPercentInstalment=false;

            }
            else {
                intent = ASK_INSTALMENT_INFORMATION;
                sessions[sessionId].prev_intent = intent;
                try {
                    var percent = parseInt(button_payload_state);

                    if (percent > 100) {
                        //xu ly money prepaid
                        console.log("=========xu ly money prepaid=======");

                        sessions[sessionId].money_prepaid = percent;
                        ishaveMoneyPrepaidInstalment = true;
                        console.log("=======so tien tra truoc money_prepaid==========", sessions[sessionId].money_prepaid);

                    }
                    else {
                        // console.log("===nhao vo ====",percent);
                        if (percent === 0) {//0đ
                            intent = ASK_INSTALMENT_PACKAGE0D;
                            sessions[sessionId].prev_intent = intent;
                            sessions[sessionId].isLatestAskPercentInstalment = false;
                        }
                        else {
                            sessions[sessionId].percent_instalment = percent;
                        }
                    }
                }
                catch (error) {
                    sessions[sessionId].percent_instalment = 20;//gán mặc định
                }
            }

        }
        else if (sessions[sessionId].isLatestAskMonth0dInstalment) {
            if (intent) {
                //khách hàng đã gián đoạn luồng chat này
                if (entities) {
                    for (var i = 0; i < entities.length; i++) {
                        if (entities[i].entity === "instalment_month") {
                            try {
                                sessions[sessionId].month_instalment = parseInt(entities[i].value.replace('_', ' '));
                                //ishaveMonthInstalment = true;
                                intent = ASK_INSTALMENT_PACKAGE0D;
                                sessions[sessionId].prev_intent = intent;

                            }
                            catch (errr) {
                                console.log("err when parse Month_instalment => isLatestAskMonth0dInstalment", err);

                            }

                        }
                    }
                }
                else {
                    if (customer_question.toLocaleLowerCase().includes("thang") || customer_question.toLocaleLowerCase().includes("tháng")) {
                        try {
                            sessions[sessionId].month_instalment = parseInt(customer_question);
                            //ishaveMonthInstalment = true;
                            intent = ASK_INSTALMENT_INFORMATION;
                            sessions[sessionId].prev_intent = intent;

                        }
                        catch (errr) {
                            console.log("err when parse Month_instalment => isLatestAskMonth0dInstalment", err);

                        }
                    }
                }
            }
            else {
                intent = ASK_INSTALMENT_PACKAGE0D;
                // intent = sessions[sessionId].prev_intent;
                sessions[sessionId].prev_intent = intent;
                try {
                    var month = parseInt(button_payload_state.split('|')[0]);
                    sessions[sessionId].month_instalment = month;
                    console.log("=====isLatestAskMonthInstalment====", month);
                    console.log("=====intent====", intent);
                    console.log("=====prev_intent====", sessions[sessionId].prev_intent);
                }
                catch (err) {
                    try {
                        var month = parseInt(button_payload_state);
                        sessions[sessionId].month_instalment = month;
                    } catch (error) {
                        sessions[sessionId].month_instalment = 6;//lay mac dinh
                    }

                }

            }

        }

        else if (sessions[sessionId].isLatestAskMonthInstalment) {
            if (intent) {
                //khách hàng đã gián đoạn luồng chat này, cũng có thể là input tháng trực tiếp
                if (entities && entities.length > 0) {
                    for (var i = 0; i < entities.length; i++) {
                        if (entities[i].entity === "instalment_month") {
                            try {
                                sessions[sessionId].month_instalment = parseInt(entities[i].value.replace('_', ' '));
                                //ishaveMonthInstalment = true;
                                intent = ASK_INSTALMENT_INFORMATION;
                                sessions[sessionId].prev_intent = intent;

                            }
                            catch (errr) {
                                console.log("err when parse Month_instalment => isLatestAskMonthInstalment", err);

                            }

                        }
                    }
                }
                else {//th nó nhận diện không đc 
                    if (customer_question.toLocaleLowerCase().includes("thang") || customer_question.toLocaleLowerCase().includes("tháng")) {
                        try {
                            sessions[sessionId].month_instalment = parseInt(customer_question);
                            //ishaveMonthInstalment = true;
                            intent = ASK_INSTALMENT_INFORMATION;
                            sessions[sessionId].prev_intent = intent;

                        }
                        catch (errr) {
                            console.log("err when parse Month_instalment => isLatestAskMonthInstalment", err);

                        }
                    }
                    else {
                        //chỉ là con số hoặc gì đó 
                        try {
                            var month = parseInt(customer_question);
                            if (isNaN(month)) {
                                resultanswer = "Không nhận diện được số tháng. Vui lòng chọn lại số tháng!"
                                SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
                                    .catch(console.error);

                                return;
                            }
                            else {
                                sessions[sessionId].month_instalment = month;
                                intent = ASK_INSTALMENT_INFORMATION;
                                sessions[sessionId].prev_intent = intent;

                            }
                        }
                        catch (err) {
                            console.log("err when parse Month_instalment => isLatestAskMonthInstalment", err);

                        }
                    }
                }
            }
            else {
                intent = ASK_INSTALMENT_INFORMATION;
                // intent = sessions[sessionId].prev_intent;
                sessions[sessionId].prev_intent = intent;
                try {
                    var month = parseInt(button_payload_state.split('|')[0]);
                    sessions[sessionId].month_instalment = month;
                    console.log("=====isLatestAskMonthInstalment====", month);
                    console.log("=====intent====", intent);
                    console.log("=====prev_intent====", sessions[sessionId].prev_intent);
                }
                catch (err) {
                    try {
                        var month = parseInt(button_payload_state);
                        sessions[sessionId].month_instalment = month;
                    } catch (error) {
                        sessions[sessionId].month_instalment = 6;//lay mac dinh
                    }

                }

            }

        }
        //==========================================================

        //============tra gop 0d==============

        //==========================

        //xác định entities
        if (entities == null || entities.length == 0) {
            // sessions[sessionId].product=null;

            if (button_payload_state === 4)//hỏi trả góp ngay lúc đầu
            {
                sessions[sessionId].prev_intent = ASK_INSTALMENT_INFORMATION;
                intent = sessions[sessionId].prev_intent;

            }
            else if (button_payload_state === 11)//hỏi trả góp thường
            {
                intent = ASK_INSTALMENT_INFORMATION;
                sessions[sessionId].prev_intent = ASK_INSTALMENT_INFORMATION;

                sessions[sessionId].percent_instalment = null;


                sessions[sessionId].month_instalment = null;
                sessions[sessionId].isLatestAskNormalInstallment = true;


            }
            else if (button_payload_state === 14) {//hỏi lại %
                intent = sessions[sessionId].prev_intent;

                sessions[sessionId].percent_instalment = null;
                sessions[sessionId].isLatestAskPercentInstalment = true;

            }
            else if (button_payload_state === 15) {//hỏi lại so thang
                // console.log("===hoi lai so thang=======", intent);
                // console.log("===hoi lai so thang=======", sessions[sessionId].prev_intent);
                intent = sessions[sessionId].prev_intent;


                sessions[sessionId].month_instalment = null;
                sessions[sessionId].isLatestAskMonthInstalment = true;
            }

            else if (button_payload_state === "INSTALMENT_PACKAGE0D") {
                intent = ASK_INSTALMENT_PACKAGE0D;

            }
            else if (button_payload_state === "INSTALMENT_0PTLS") {
                intent = ASK_INSTALMENT_INFORMATION;
                isAsk0PTInstalment = true;

            }

            else {
                //chỉ resset lại color (vì color sẽ khác với sp khác)
                if (hasNumber(sessions[sessionId].color))//nó là productcode
                {
                    //console.log("==============MÃ MÀU PRODUCTCODE " + sessions[sessionId].color + " =================================");
                    sessions[sessionId].color = null;
                }
                // sessions[sessionId].price=null;
                // sessions[sessionId].province=null;
                // sessions[sessionId].district=null;

                if (button_payload_state.toString().trim().length >= 2 &&
                    button_payload_state.toString().length < 10 && hasNumber(button_payload_state))//là districtID
                {
                    if (parseInt(button_payload_state) >= 16) {
                        sessions[sessionId].district = button_payload_state;
                    }

                }
                else if (button_payload_state.length >= 10)//la productCode color
                {
                    sessions[sessionId].isPreAskColor = true;
                    sessions[sessionId].color = button_payload_state;
                }

                else if (button_payload_state === 6)//gợi ý lại danh sách màu (trường hợp này đã có product)
                {
                    questionTitle = "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm";

                    //console.log(sessions[sessionId].productID);
                    SendToUserListColor(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);

                    return;
                }
                else if (button_payload_state === 7)//gợi ý lại danh sách quận huyện (đã có product, province)
                {
                    questionTitle = "Chọn quận/huyện nơi " + sessions[sessionId].gender + "  ở";
                    SendToUserListDistrict(sessions[sessionId].productID, sessions[sessionId].provinveID, sender, siteid, replyobject, questionTitle, intent);
                    return;
                }
                else if (button_payload_state === 8 || button_payload_state === 9)//cong ty tai chinh
                {
                    sessions[sessionId].financialCompany = button_payload_state;
                    intent = ASK_INSTALMENT_INFORMATION;
                }

                else if (button_payload_state === "NORMAL" || button_payload_state === "BAD" || button_payload_state === "GOOD") {
                    SentToClient(sender, "Cảm ơn " + sessions[sessionId].gender + "  đã đánh giá. Rất vui được phục vụ " + sessions[sessionId].gender + " .", questionTitle, button_payload_state, "", replyobject, siteid)
                        .catch(console.error);
                    return;
                }
            }


        }
        else {

            if (hasNumber(sessions[sessionId].color))//nó là productcode
            {
                //console.log(hasNumber(sessions[sessionId].color));
                sessions[sessionId].color = null;
            }


            var productIndex = 0;
            for (var i = 0; i < entities.length; i++) {

                sessions[sessionId].currentvalue = entities[i].value.replace('_', ' ');
                if (entities[i].entity === "product") {
                    productIndex++;

                    if (entities[i].value.includes("cường lực")) {
                        entities[i].value = entities[i].value.replace("cường lực", "màn hình").replace('_', ' ');
                    }
                    //phụ kiện 
                    if (productIndex > 1 && (isIncludeAccessoryKeyword(sessions[sessionId].product)
                        || isIncludeAccessoryKeyword(entities[i].value.toLowerCase().replace('_', ' ')))) {
                        sessions[sessionId].product += " " + entities[i].value.replace('_', ' ');//gộp  sản phẩm lại
                    }
                    else {
                        sessions[sessionId].product = entities[i].value.replace('_', ' ');
                    }
                    ishaveProductEntity = true;


                }
                if (entities[i].entity === "storage")//bộ nhớ lưu trữ
                {
                    if (sessions[sessionId].product != null &&
                        !sessions[sessionId].product.includes(entities[i].value.replace('_', ' ').toLocaleLowerCase())) {
                        sessions[sessionId].product += " " + entities[i].value.replace('_', ' ');
                        ishaveProductEntity = true;
                    }
                }
                if (entities[i].entity === "color") {
                    sessions[sessionId].color = entities[i].value.replace('_', ' ');
                }
                if (entities[i].entity === "price") {
                    sessions[sessionId].price = entities[i].value.replace('_', ' ');
                }
                if (entities[i].entity === "province") {

                    //nếu có tỉnh mới, reset lại huyện

                    if (sessions[sessionId].province)
                        sessions[sessionId].district = null;

                    sessions[sessionId].province = entities[i].value.replace('_', ' ');

                }
                if (entities[i].entity === "district") {
                    sessions[sessionId].district = entities[i].value.replace('_', ' ');

                }

                //tra gop
                if (entities[i].entity === "instalment_month") {
                    try {
                        sessions[sessionId].month_instalment = parseInt(entities[i].value.replace('_', ' '));
                        ishaveMonthInstalment = true;
                    }
                    catch (errr) {
                        console.log("err when parse Month_instalment", err);

                    }

                }
                if (entities[i].entity === "instalment_percent") {
                    try {
                        sessions[sessionId].percent_instalment = parseInt(entities[i].value.replace('_', ' '));
                        ishavePercentInstalment = true;
                    }
                    catch (errr) {
                        console.log("err when parse Percent_instalment", err);

                    }
                }

                if (entities[i].entity === "money_prepaid") {
                    try {
                        var moneyPrepaid = parseFloat(entities[i].value);
                        if (moneyPrepaid < 400000) {
                            //không hợp lệ số tiền trả trước
                            sessions[sessionId].money_prepaid = null;
                        }
                        else {
                            sessions[sessionId].money_prepaid = moneyPrepaid;
                            ishaveMoneyPrepaidInstalment = true;
                        }

                        console.log("=======so tien tra truoc money_prepaid==========", sessions[sessionId].money_prepaid);
                    }
                    catch (errr) {
                        console.log("err when parse MoneyPrepaidInstalment", err);

                    }
                }

            }
        }
       

        //th sản phẩm bị sai tên

        if (sessions[sessionId].product) {



            //xu ly rieng th oppo f9 6gb mà không nhận dc 6gb, chỉ nhận dc oppo f9 (4gb)
            if (sessions[sessionId].product.toLowerCase().includes("f9") &&
                (!sessions[sessionId].product.toLowerCase().includes("6g") && !sessions[sessionId].product.toLowerCase().includes("6 g"))) {
                if (customer_question.toLowerCase().includes("6g") || customer_question.toLowerCase().includes("6 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 6GB";
                }
            }
            if (sessions[sessionId].product.toLowerCase().includes("f7") &&
                (!sessions[sessionId].product.toLowerCase().includes("6g") && !sessions[sessionId].product.toLowerCase().includes("6 g"))) {
                if (customer_question.toLowerCase().includes("6g") || customer_question.toLowerCase().includes("6 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 128GB"; //(ở đây là ram 6gb)
                }
            }

            //xử lý f9 tím
            if (sessions[sessionId].product.toLowerCase().includes("f9") &&
                (!sessions[sessionId].product.toLowerCase().includes("tím") && !sessions[sessionId].product.toLowerCase().includes("tim"))) {
                if (customer_question.toLowerCase().includes("tím") || customer_question.toLowerCase().includes("tim")) {
                    sessions[sessionId].product = sessions[sessionId].product + " Tím Tinh Tú";
                }
            }

            //xu ly iphone 
            if (sessions[sessionId].product.toLowerCase().includes("iphone") &&
                (!sessions[sessionId].product.toLowerCase().includes("32g") && !sessions[sessionId].product.toLowerCase().includes("32 g"))) {
                if (customer_question.toLowerCase().includes("32g") || customer_question.toLowerCase().includes("32 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 32GB";
                }
            }
            if (sessions[sessionId].product.toLowerCase().includes("iphone") &&
                (!sessions[sessionId].product.toLowerCase().includes("64g") && !sessions[sessionId].product.toLowerCase().includes("64 g"))) {
                if (customer_question.toLowerCase().includes("64g") || customer_question.toLowerCase().includes("64 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 64GB";
                }
            }
            if (sessions[sessionId].product.toLowerCase().includes("iphone") &&
                (!sessions[sessionId].product.toLowerCase().includes("128g") && !sessions[sessionId].product.toLowerCase().includes("128 g"))) {
                if (customer_question.toLowerCase().includes("128g") || customer_question.toLowerCase().includes("128 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 128GB";
                }
            }
            if (sessions[sessionId].product.toLowerCase().includes("iphone") &&
                (!sessions[sessionId].product.toLowerCase().includes("256g") && !sessions[sessionId].product.toLowerCase().includes("256 g"))) {
                if (customer_question.toLowerCase().includes("256g") || customer_question.toLowerCase().includes("256 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 256GB";
                }
            }

            //xử lý realme
            if (sessions[sessionId].product.toLowerCase().includes("realme") &&
                (!sessions[sessionId].product.toLowerCase().includes("3g") && !sessions[sessionId].product.toLowerCase().includes("3 g"))) {
                if (customer_question.toLowerCase().includes("3g") || customer_question.toLowerCase().includes("3 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 3GB";
                }
            }

            if (sessions[sessionId].product.toLowerCase().includes("realme") &&
                (!sessions[sessionId].product.toLowerCase().includes("4g") && !sessions[sessionId].product.toLowerCase().includes("4 g"))) {
                if (customer_question.toLowerCase().includes("4g") || customer_question.toLowerCase().includes("4 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 4GB";
                }
            }

            if (sessions[sessionId].product.toLowerCase().includes("realme") &&
                (!sessions[sessionId].product.toLowerCase().includes("6g") && !sessions[sessionId].product.toLowerCase().includes("6 g"))) {
                if (customer_question.toLowerCase().includes("6g") || customer_question.toLowerCase().includes("6 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 6GB";
                }
            }

            if (sessions[sessionId].product.toLowerCase().includes("realme") &&
                (!sessions[sessionId].product.toLowerCase().includes("8g") && !sessions[sessionId].product.toLowerCase().includes("8 g"))) {
                if (customer_question.toLowerCase().includes("8g") || customer_question.toLowerCase().includes("8 g")) {
                    sessions[sessionId].product = sessions[sessionId].product + " 8GB";
                }
            }

            if (!sessions[sessionId].product.toLocaleLowerCase().includes("iphone")
                && !sessions[sessionId].product.toLocaleLowerCase().includes("ipad")
                && sessions[sessionId].product.toLocaleLowerCase().includes("ip")) {
                sessions[sessionId].product = sessions[sessionId].product.replace("ip", "iphone ");
            }

            if (!sessions[sessionId].product.toLocaleLowerCase().includes("plus")
                && sessions[sessionId].product.toLocaleLowerCase().includes("pl")) {
                sessions[sessionId].product = sessions[sessionId].product.replace("pl", "plus ");
            }

            //===============storage========================
            sessions[sessionId].product = sessions[sessionId].product.replace("64 gb", "64GB");
            sessions[sessionId].product = sessions[sessionId].product.replace("32 gb", "32GB");
            sessions[sessionId].product = sessions[sessionId].product.replace("128 gb", "128GB");
            sessions[sessionId].product = sessions[sessionId].product.replace("16 gb", "16GB");
            sessions[sessionId].product = sessions[sessionId].product.replace("256 gb", "256GB");
            //===============storage========================
            //xu ly huawei 
            sessions[sessionId].product = sessions[sessionId].product.replace("hawei", "huawei");
            sessions[sessionId].product = sessions[sessionId].product.replace("hawai", "huawei");
            sessions[sessionId].product = sessions[sessionId].product.replace("huwei", "huawei");
            sessions[sessionId].product = sessions[sessionId].product.replace("huwai", "huawei");
            sessions[sessionId].product = sessions[sessionId].product.replace("huawai", "huawei");
            sessions[sessionId].product = sessions[sessionId].product.replace("hưawei", "huawei");


        }



        console.log("===product==", sessions[sessionId].product);


        //trường hợp sản phẩm chung chung thì xem như chưa xác định
        if (sessions[sessionId].product && isGeneralProduct(sessions[sessionId].product)) {
            sessions[sessionId].product = null;
        }


        if (!intent && ((!sessions[sessionId].product) && (!sessions[sessionId].province) && (!sessions[sessionId].district))) {
            //nếu đã có trong session

            questionTitle = "Xin chào!";
            resultanswer = "Mình là BOT. Mình chưa rõ câu hỏi của " + sessions[sessionId].gender + "  lắm. Vui lòng chọn thông tin cần quan tâm!";
            intent = "null";

        }
        else {

            //câu chào HI
            if (customer_question.trim().toLowerCase() === "hi") {
                var rn = randomNumber(greet.length);
                resultanswer = greet[rn];

                SentToClient(sender, resultanswer, "Xin chào!", button_payload_state, "greet", replyobject, siteid)
                    .catch(console.error);
                return;
            }

            ///


            //truong hợp này intent có thể null
            // console.log("====truong hợp này intent có thể null==",intent);
            //console.log("====truong hợp này intent có thể null==",sessions[sessionId].prev_intent);
            if (!intent) {
                if (sessions[sessionId].prev_intent)//nếu trước đó đã hỏi
                {

                    if (sessions[sessionId].isLatestAskBrief || sessions[sessionId].isLatestAskMonthInstalment
                        || sessions[sessionId].isLatestAskPercentInstalment || sessions[sessionId].isLatestAskNormalInstallment) {
                        intent = sessions[sessionId].prev_intent;
                    }
                    else {
                        intent = "null";
                    }
                }
                else {
                    intent = "null";
                }
            }

            //=============
            if (!sessions[sessionId].prev_intent) {
                sessions[sessionId].prev_intent = "";
            }
            //===========

            if (intent === "greet") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                if (customer_question.toLowerCase() === "chào " + sessions[sessionId].gender + " " && (sessions[sessionId].prev_intent === "ask_price" || sessions[sessionId].prev_intent === "ask_stock"
                    || sessions[sessionId].prev_intent === "ask_promotion" || sessions[sessionId].prev_intent === "ask_delivery"
                    || sessions[sessionId].prev_intent === "thankyou" || sessions[sessionId].prev_intent === "felling_love")) {
                    intent = "goodbye";
                    sessions[sessionId].prev_intent = "goodbye";
                }
                else {
                    sessions[sessionId].prev_intent = "greet";
                    questionTitle = "Xin chào!";

                    var rn = randomNumber(greet.length);
                    resultanswer = greet[rn];

                }

            }
            if (intent === "goodbye") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                sessions[sessionId].prev_intent = "goodbye";
                questionTitle = "Cảm ơn!";

                var rn = randomNumber(goodbye.length);
                resultanswer = goodbye[rn];

                fbEvaluate(sender, replyobject, siteid);


            }
            else if (intent === "thankyou") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                sessions[sessionId].prev_intent = "thankyou";
                questionTitle = "Cảm ơn!";
                var rn = randomNumber(thankyou.length);
                resultanswer = thankyou[rn];

                fbEvaluate(sender, replyobject, siteid);
            }
            else if (intent === "ask_promotion" || sessions[sessionId].prev_intent === "ask_promotion") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                if (sessions[sessionId].prev_intent === "ask_promotion" && intent != "ask_promotion") {//nếu đã hỏi khuyến mãi trước mà hiện tại câu này không còn hỏi km nữa thì reset
                    sessions[sessionId].prev_intent = null;
                }
                if (intent === "ask_promotion") {//nếu câu hiện tại đang hỏi km 
                    sessions[sessionId].prev_intent = "ask_promotion";
                }

                if (sessions[sessionId].product) {
                    var productName = sessions[sessionId].product;
                    console.log(productName);
                    var keyword = productName;

                    var argsSearchProduct = "";


                    if (isIncludeAccessoryKeyword(keyword))//search phụ kiện
                    {
                        argsSearchProduct = {
                            q: keyword,
                            CateID: -3
                        };
                    }
                    else {

                        argsSearchProduct = {
                            q: keyword,
                            CateID: -4
                        };
                    }
                    APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                        if (result.SearchProductPhiResult != null) {

                            //console.log("================KẾT QUẢ SEARCH===============");
                            //console.log(result.SearchProductPhiResult);

                            //console.log("============================================");

                            var productID = result.SearchProductPhiResult.string[0];
                            sessions[sessionId].productID = productID;

                            var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                            var lstproduct = result;

                            APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                if (result && result.GetProductResult.productErpPriceBOField) {
                                    //lấy link sp
                                    var argsProductDetailGetSeoURL = {
                                        productCategoryLangBOField_uRLField: result.GetProductResult.productCategoryLangBOField.uRLField,
                                        productCategoryLangBOField_categoryNameField: result.GetProductResult.productCategoryLangBOField.categoryNameField,
                                        productCategoryBOField_uRLField: result.GetProductResult.productCategoryBOField.uRLField,
                                        productCategoryBOField_categoryNameField: result.GetProductResult.productCategoryBOField.categoryNameField,
                                        categoryNameField: result.GetProductResult.categoryNameField,
                                        productLanguageBOField_productNameField: result.GetProductResult.productLanguageBOField.productNameField,
                                        productLanguageBOField_uRLField: result.GetProductResult.productLanguageBOField.uRLField,
                                        productNameField: result.GetProductResult.productNameField,
                                        uRLField: result.GetProductResult.uRLField
                                    };


                                    //console.log(result);
                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                        + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                    //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                    //  console.log(resultanswer);

                                    APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {

                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 1) || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";


                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";


                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else {


                                            //console.log(result.GetProductResult.promotionField.Promotion[0]);
                                            if (result.GetProductResult.promotionField) {
                                                if (result.GetProductResult.promotionField.Promotion.length > 0) {
                                                    resultanswer += "<br /><p>Thông tin khuyến mãi:</p> ";
                                                    for (var i = 0; i < result.GetProductResult.promotionField.Promotion.length; i++) {
                                                        var currentPromotion = result.GetProductResult.promotionField.Promotion[i];
                                                        console.log(currentPromotion);
                                                        // if (!currentPromotion.homePageDescriptionField || currentPromotion.homePageDescriptionField === "undefined") {

                                                        // }
                                                        if (!currentPromotion.promotionListGroupNameField) {

                                                        }
                                                        else {
                                                            // resultanswer += "<p style='color:red'>" + currentPromotion.homePageDescriptionField + "</p>";
                                                            var fromDate = currentPromotion.beginDateField.split('T')[0];
                                                            var endDate = currentPromotion.endDateField.split('T')[0];
                                                            var fromDateSplit = fromDate.split("-");
                                                            var toDateSplit = endDate.split("-");

                                                            resultanswer += "<p style='color:red'>" + currentPromotion.promotionListGroupNameField + " ( <span style='color:green'> Từ " + fromDateSplit[2] + "/" + fromDateSplit[1] + " - " + toDateSplit[2] + "/" + toDateSplit[1] + "</span> )" + "</p>";


                                                        }


                                                    }


                                                }
                                                else {
                                                    resultanswer += "<p style='color:red'>Hiện tại không có chương trình khuyến mãi nào dành cho sản phẩm này!</p>";
                                                }
                                            }
                                            else {
                                                resultanswer += "<p style='color:red'>Hiện tại không có chương trình khuyến mãi nào dành cho sản phẩm này!</p>";
                                            }

                                            //console.log("Sản phẩm hỏi: " + productName);
                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                        }

                                    });
                                }

                                else {
                                    resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>NGỪNG KINH DOANH</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                        .catch(console.error);
                                }
                            });
                        }

                        else {

                            var rn = randomNumber(productnotfound.length);
                            resultanswer = productnotfound[rn];

                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                .catch(console.error);

                        }

                    });


                }

                else {
                    var rn = randomNumber(unknowproduct.length);
                    resultanswer = unknowproduct[rn];
                }

                intent = "ask_promotion";
                //sessions[sessionId].prev_intent = "ask_promotion";
            }



            else if (intent === "offense") {
                sessions[sessionId].isLatestAskNormalInstallment = false;
                var rn = randomNumber(offense.length);
                resultanswer += offense[rn];

                //var resultanswer2 = ""+sessions[sessionId].gender+"  có rảnh không? Rảnh thì mua điện thoại ở công ty Thế Giới Di Động của mình. Bảo đảm là \"Danh bất hư truyền\". :p"

                intent = "offense";
                sessions[sessionId].prev_intent = "offense";
            }

            else if (intent === "ask_consultant") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Tư vấn sản phẩm.";

                resultanswer += "<br />Chức năng tư vấn sản phẩm đang phát triển. Xin lỗi vì sự bất tiện này!";
                resultanswer += "Quý khách có thể truy cập trang <a href='https://www.thegioididong.com/hoi-dap' target='_blank'>Diễn đàn hỏi đáp</a> của TGDD để được tư vấn tốt nhất! ";
                resultanswer += "Hoặc liên hệ tổng đài 18001060 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ tận tình. <br/>";
                resultanswer += "" + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";
                intent = "ask_consultant";
                sessions[sessionId].prev_intent = "ask_consultant";

                //sessions[sessionId].product = null;
            }
            else if (intent === "ask_configuration") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Hỏi về cấu hình sản phẩm";

                resultanswer += "<br />Chức năng trả lời thông tin về CẤU HÌNH SẢN PHẨM hiện đang được phát triển cho BOT. Xin lỗi vì sự bất tiện này!";
                resultanswer += "Quý khách có thể truy cập trang <a href='https://www.thegioididong.com/hoi-dap' target='_blank'>Diễn đàn hỏi đáp</a> của TGDD để được tư vấn tốt nhất! ";
                resultanswer += "Hoặc liên hệ tổng đài 18001060 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ tận tình. <br/>";
                intent = "ask_configuration";
                sessions[sessionId].prev_intent = "ask_configuration";

                //sessions[sessionId].product = null;
            }
            else if (intent === "ask_transfermoney") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Hỏi về dịch vụ chuyển tiền";

                resultanswer += "<br/>Thông tin chi tiết về DỊCH VỤ CHUYỂN-NHẬN TIỀN, " + sessions[sessionId].gender + "  vui lòng tham khảo tại đây nhé: <a href='https://www.thegioididong.com/chuyen-tien' target='_blank'>Dịch vụ chuyển tiền</a> ";
                resultanswer += "<br/>" + sessions[sessionId].gender + "  có thể liên hệ tổng đài 18001060 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ tận tình. <br/>";
                intent = "ask_transfermoney";
                sessions[sessionId].prev_intent = "ask_transfermoney";

                //sessions[sessionId].product = null;
            }

            else if (intent === "ask_technique") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Hỏi về kỹ thuật";

                resultanswer += "<br />Rất tiếc. BOT không hỗ trợ được các vấn đề vễ KỸ THUẬT rồi ạ. Vui lòng chat trực tiếp với nhân viên hoặc mang tới siêu thị TGDD gần nhất để được hỗ trợ ạ. Xin lỗi vì sự bất tiện này!";
                resultanswer += "Hoặc liên hệ tổng đài 1800 1763 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ các vấn đề KỸ THUẬT một cách tận tình nhất ạ. <br/>";
                resultanswer += "Hoặc quý khách cũng có thể truy cập trang <a href='https://www.thegioididong.com/hoi-dap' target='_blank'>Diễn đàn hỏi đáp</a> của TGDD để được tư vấn tốt nhất! ";

                intent = "ask_technique";
                sessions[sessionId].prev_intent = "ask_technique";

                //sessions[sessionId].product = null;
            }
            else if (intent === "ask_sim_card") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Hỏi về sim, thẻ cào";

                resultanswer += "<br />Để mua SIM, THẺ CÀO ĐIỆN THOẠI, THẺ GAME (Zing,Gate,Garena,Vcoin...)... quý khách vui lòng vào <a href='https://www.thegioididong.com/sim-so-dep' target='_blank'>https://www.thegioididong.com/sim-so-dep</a> để xem và mua nhé!";
                resultanswer += "Hoặc liên hệ tổng đài 1800 1060 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ các vấn đề MUA HÀNG một cách tận tình nhất ạ. <br/>";
                resultanswer += "Chức năng mua hàng trực tiếp từ BOT sẽ được phát triển sớm nhất cho BOT trong tương lai. Xin quý khách thông cảm vì sự bất tiện này !";

                intent = "ask_sim_card";
                sessions[sessionId].prev_intent = "ask_sim_card";

                //sessions[sessionId].product = null;
            }



            else if (intent === "ask_name") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Hỏi tên";
                var rn = randomNumber(ask_name.length);
                resultanswer = ask_name[rn];

                intent = "ask_name";
                sessions[sessionId].prev_intent = "ask_name";
            }

            else if (intent === "felling_love") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Cảm xúc";
                resultanswer = "Cảm ơn " + sessions[sessionId].gender + " . Rất hân hạnh được phục vụ " + sessions[sessionId].gender + " . !" + "<br />";

                intent = "felling_love";
                sessions[sessionId].prev_intent = "felling_love";
            }

            else if (intent === "felling_price") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Cảm xúc giá";
                resultanswer = "Chất lượng sản phẩm ở Thế Giới Di Động được cam kết là chất lượng và chính hãng nha " + sessions[sessionId].gender + " . Giá cả rất hợp lý cho người mua ạ. " + "<br />";

                //suggest kh
                intent = "felling_price";
                sessions[sessionId].prev_intent = "felling_price";
            }
            else if (intent === "ask_delivery") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Giao hàng";
                resultanswer = "Chúng tôi hỗ trợ giao hàng trên toàn quốc.";
                resultanswer += " " + sessions[sessionId].gender + "  có thể tham khảo thông tin về chính sách, chi phí giao hàng ở đây <a href='https://www.thegioididong.com/giao-hang' target='_blank'>https://www.thegioididong.com/giao-hang</a><br/>";
                resultanswer += "Hỗ trợ gấp, xin gọi 18001060 (MIỄN PHÍ CUỘC GỌI) để được tư vấn cụ thể.<br/>";
                resultanswer += "" + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";

                //suggest kh
                intent = "ask_delivery";
                sessions[sessionId].prev_intent = "ask_delivery";
            }
            else if (intent === "ask_compare") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "So sánh";
                resultanswer = "Muốn so sánh lựa chọn, vui lòng truy cập trang <a href='https://www.thegioididong.com/hoi-dap' target='_blank'>Diễn đàn hỏi đáp</a> của TGDD để được tư vấn tốt nhất!";

                resultanswer += "" + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";

                //suggest kh
                intent = "ask_compare";
                sessions[sessionId].prev_intent = "ask_compare";
            }
            else if (intent == "ask_helper") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Danh sách tổng đài hỗ trợ của TGDD (TẤT CẢ CUỘC GỌI MIỄN PHÍ): <br />";
                resultanswer += "<ul><li> Gọi mua hàng 1800.1060 (7: 30 - 22: 00)</li> <li> Gọi khiếu nại 1800.1062 (8: 00 - 21: 30)</li> <li> Gọi bảo hành 1800.1064 (8: 00 - 21: 00)</li> <li>Hỗ trợ kỹ thuật 1800.1763 (7: 30 - 22: 00) </li> </ul>";


            }
            else if (intent == "ask_guarantee") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Về các dịch vụ liên quan đến bảo hành như <span style='font-style:italic'>thay màn hình, thay phụ kiện, hư hỏng do lỗi nhà sản xuất, lỗi nóng máy, lỗi tụt pin, hỏng nguồn...</span>";
                resultanswer += "Kính mong quý khách đem máy đến cửa hàng Thế Giới Di Động gần nhất để được phục vụ, báo giá chi tiết và chính xác nhất ạ.";
                resultanswer += "Dịch vụ hỗ trợ Online chỉ giải đáp cho quý khách các vấn đề liên quan đến mua bán thôi ạ. Quý khách có thể xem chính sách bảo hành tại đây <a href='https://www.thegioididong.com/chinh-sach-bao-hanh-san-pham' targer='_blank'>Chính sách bảo hành</a><br/>";
                resultanswer += "Rất xin lỗi vì sự bất tiện này."


            }
            else if (intent == "ans_tel") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Cảm ơn " + sessions[sessionId].gender + " .Chúng tôi sẽ liên hệ " + sessions[sessionId].gender + "  sớm nhất có thể. " + sessions[sessionId].gender + "  cần tư vấn hỗ trợ gì nữa không ạ?";
            }
            else if (intent == "ask_return") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Chức năng ĐỔI TRẢ VÀ MUA LẠI hiện tại đang phát triển cho BOT. Xin quý khách vui lòng thông cảm. Quý khách có thể liên hệ tổng đài 18001064 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ. <br/>";
                resultanswer += "Quý khách có thể tham khảo chính sách đổi trả tại đây <a href='https://www.thegioididong.com/thu-cu-doi-moi' targer='_blank'>Chính sách đổi trả, thu cũ đổi mới</a><br/>";
                resultanswer += "Xin cảm ơn";
            }
            else if (intent == "ask_order") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Chức năng KIỂM TRA ĐƠN HÀNG và ĐẶT HÀNG ONLINE hiện tại đang phát triển cho BOT. Xin quý khách vui lòng thông cảm. Quý khách có thể liên hệ tổng đài 18001062 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ hoặc quý khách có thể đặt hàng trực tiếp trên web. Xin cảm ơn";
            }

            else if (intent.includes("ask_instalment") || sessions[sessionId].prev_intent.includes("ask_instalment")) {


                questionTitle = "Thông tin trả góp!";
                var originIntent = intent;
                console.log("====intent=======", intent);
                //==================================
                if (!intent.includes("ask_instalment")) {//ví dụ: cau truoc hỏi trả góp, câu sau support thêm sản phẩm cần trả góp
                    if (!ishaveMonthInstalment && !ishavePercentInstalment && !ishaveProductEntity) {
                        sessions[sessionId].prev_intent = intent;
                        return;//câu hỏi này không phải trả góp và cũng chẳng có chứa thông tin gì về prouct , month hay percent support cho câu hỏi trả góp phía trước
                        // =>vức đi)
                    }
                    else {
                        intent = sessions[sessionId].prev_intent ? sessions[sessionId].prev_intent : intent;
                        console.log("đổi intent", intent);
                    }
                }
                sessions[sessionId].prev_intent = originIntent;
                console.log("==========pre_intent=======", sessions[sessionId].prev_intent);

                //console.log("====product====",sessions[sessionId].product);

                var comboIntent = intent.split("+");
                var subIntent = comboIntent[1];

                if (subIntent === "briefsupport") {
                    resultanswer = "<p>Dạ, điều kiện giấy tờ trả góp của công ty tài chính là:</br>\
                    1. Đủ 20-60 tuổi</br>\
                    2. Giấy tờ CMND không quá 15 năm, rõ hình, chữ</br>\
                    <span style='color:red;'>Tùy theo gói trả góp sẽ có thêm yêu cầu giấy tờ:</span>  </br>\
                    3. Bằng lái xe (còn thời hạn)</br>\
                    4. Sổ hộ khẩu (có tên người trả góp), chấp nhận bản photo có công chứng không quá 3 tháng (photo nguyên cuốn)</br>\
                    5. Hóa đơn điện(cáp/nước/internet) có địa chỉ trùng với địa chỉ trên CMND để được hưởng lãi suất tốt nhất "+ sessions[sessionId].gender + " nhé</br>\
                    <span style='color:red;font-style:italic'>LƯU Ý: THỜI GIAN DUYỆT HỒ SƠ TỪ 4-14 TIẾNG Ạ.</span></p>";

                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                        .catch(console.error);


                    return;
                }
                else if (subIntent === "how") {
                    resultanswer = "<p>Dạ, về thủ tục mua trả góp online: " + sessions[sessionId].gender + " chọn sản phẩm và gói trả góp phù hợp\
                    ,sau đó đặt trên web và công ty tài chính sẽ gọi là cho "+ sessions[sessionId].gender + " để xác nhận ạ. Hồ sơ sẽ được thông báo kết quả trong vòng 4h-14h ạ. Sau đó, " + sessions[sessionId].gender + " mang giấy tờ và tiền trả trước ra siêu thị đối chứng và làm hợp đồng nhận máy ạ.</br>\
                    Hoặc "+ sessions[sessionId].gender + " có thể ra trực tiếp siêu thị TGDD để làm thủ tục trả góp luôn ạ.</p>";
                    // SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                    //     .catch(console.error);

                    //send button briefsupport
                    var jsonbuttonBrief = getButtonBriefSupport(sender, siteid, replyobject, resultanswer);
                    setTimeout(() => {
                        SentToClientButton(sender, jsonbuttonBrief, "ask_instalment+how")
                            .catch(console.error);

                    }, 100);

                    return;
                }
                else if (subIntent === "information") {

                    if (!sessions[sessionId].product) {

                        resultanswer += "" + sessions[sessionId].gender + "  muốn hỏi thông tin trả góp cho sản phẩm nào ạ?";

                    }
                    else {
                        //check sản phẩm có hỗ trợ trả góp hay không
                        var productID = sessions[sessionId].product;
                        var productName = sessions[sessionId].product;
                        console.log(productName);
                        var keyword = productName;
                        var argsSearchProduct = "";

                        if (isIncludeAccessoryKeyword(keyword))//search phụ kiện
                        {
                            argsSearchProduct = {
                                q: keyword,
                                CateID: -3
                            };
                        }
                        else {

                            argsSearchProduct = {
                                q: keyword,
                                CateID: -4
                            };
                        }
                        APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                            if (result.SearchProductPhiResult != null) {

                                var productID = result.SearchProductPhiResult.string[0];
                                sessions[sessionId].productID = productID;

                                var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                                var lstproduct = result;

                                APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                    var productDetail = result.GetProductResult;
                                    if (result && result.GetProductResult.productErpPriceBOField) {
                                        //lấy link sp
                                        var argsProductDetailGetSeoURL = {
                                            productCategoryLangBOField_uRLField: result.GetProductResult.productCategoryLangBOField.uRLField,
                                            productCategoryLangBOField_categoryNameField: result.GetProductResult.productCategoryLangBOField.categoryNameField,
                                            productCategoryBOField_uRLField: result.GetProductResult.productCategoryBOField.uRLField,
                                            productCategoryBOField_categoryNameField: result.GetProductResult.productCategoryBOField.categoryNameField,
                                            categoryNameField: result.GetProductResult.categoryNameField,
                                            productLanguageBOField_productNameField: result.GetProductResult.productLanguageBOField.productNameField,
                                            productLanguageBOField_uRLField: result.GetProductResult.productLanguageBOField.uRLField,
                                            productNameField: result.GetProductResult.productNameField,
                                            uRLField: result.GetProductResult.uRLField
                                        };


                                        //console.log(result);
                                        var categoryID = parseInt(result.GetProductResult.categoryIDField);

                                        resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                            + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>Không xác định</span>") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                        resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                        //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                        //  console.log(resultanswer);

                                        APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                            resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";
                                            console.log(result.GetProductResult.productErpPriceBOField.webStatusIdField);
                                            if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại  <span style='color:red'>CHƯA CÓ HÀNG</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else {
                                                var productPrice = result.GetProductResult.productErpPriceBOField.priceField === "0" ? 0 : parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                                if (productPrice >= 1200000) {
                                                    console.log("===support tra gop===========");
                                                    console.log("======find 0% package============");

                                                    //nếu có trả góp 0% cho sp đó
                                                    var argCheckZeroInstalment = {
                                                        ProductId: productID,
                                                        SiteId: 1
                                                    };
                                                    APICheckZeroInstalment(urlwcfProduct, argCheckZeroInstalment, function callback(result) {

                                                        //console.log("=====CHECK=======", result);
                                                        // sessions[sessionId].isHasZeroInstallment = result;
                                                        if (isAsk0PTInstalment || (sessions[sessionId].percent_instalment === 0 && !sessions[sessionId].isLatestAskNormalInstallment && !sessions[sessionId].isLatestAskCompanyForNormalInstalment
                                                            && !sessions[sessionId].isLatestAskBrief && !sessions[sessionId].isLatestAskMonthInstalment && !sessions[sessionId].isLatestAskPercentInstalment) ||
                                                            (!ishavePercentInstalment && !ishaveMonthInstalment && !ishaveMoneyPrepaidInstalment && !sessions[sessionId].isLatestAskBrief &&
                                                                !sessions[sessionId].isLatestAskMonthInstalment && !sessions[sessionId].isLatestAskPercentInstalment
                                                                && !sessions[sessionId].isLatestAskNormalInstallment && !sessions[sessionId].isLatestAskCompanyForNormalInstalment)) {//đéo có concat gi het thi ném gói 0% ra chứ làm me gì
                                                            if (result) {
                                                                resultanswer += "<br />Sản phẩm " + productName + " hiện đang có gói <span style='color:green'>trả góp 0%</span>. (<span style='color:green'>trả góp 0%</span> là gói trả góp đặc biệt rất hấp dẫn, không phải chịu bất kỳ lãi suất nào từ công ty cho vay). </br> ";
                                                                //send ds ctytc
                                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                    .catch(console.error);

                                                                // if (!sessions[sessionId].financialCompany) {
                                                                //     questionTitle = "Mời " + sessions[sessionId].gender + " lựa chọn công ty tài chính cho vay để xem gói trả góp tương ứng!";
                                                                //     var jsonbuttonFinancialCompany = getButtonFinancialCompany(productID, productName, sender, siteid, replyobject, questionTitle);
                                                                //     //console.log(jsonbuttonFinancialCompany);

                                                                //     setTimeout(() => {
                                                                //         SentToClientButton(sender, jsonbuttonFinancialCompany, "ask_instalment")
                                                                //             .catch(console.error);

                                                                //     }, 1000);
                                                                // }
                                                                //else {
                                                                var finalCompanySpecialInstalment = -1;
                                                                if (sessions[sessionId].financialCompany) {
                                                                    if (sessions[sessionId].financialCompany === 8) {
                                                                        finalCompanySpecialInstalment = 1;
                                                                    }
                                                                    else {
                                                                        finalCompanySpecialInstalment = 3;
                                                                    }
                                                                }
                                                                else {
                                                                    finalCompanySpecialInstalment = -1;
                                                                }

                                                                var argGetZeroPackage = {
                                                                    CompanyId: finalCompanySpecialInstalment,
                                                                    CategoryId: -1,
                                                                    ProductId: parseInt(productID),
                                                                    Percent: -1,
                                                                    Month: -1,
                                                                    MoneyLoan: -1,
                                                                    FeatureType: 1,
                                                                    IsDefaultPackage: -1,
                                                                    SiteId: 1,
                                                                    InventStatusId: 1
                                                                };
                                                                APIGetInfoZeroInstalmentPackage(urlwcfProduct, argGetZeroPackage, function (packageInfo) {
                                                                    // console.log(packageInfo.GetFeatureInstallment2018Result);

                                                                    if (packageInfo && packageInfo.length > 0) {
                                                                        packageInfo.forEach(function (packageDetail) {
                                                                            if (!packageDetail || !packageDetail.GetFeatureInstallment2018Result) return;

                                                                            //====================ÁP DỤNG KHUYẾN MÃI====================
                                                                            var desPrice = GetSystemPromotionWithoutPrevent(productDetail, parseFloat(productPrice), true, packageDetail.GetFeatureInstallment2018Result.ErpInstallmentId);
                                                                            console.log("======GIA GIAM==========", desPrice);

                                                                            //tính lại % 
                                                                            var newPercent = GetInstallPercentPrepaid(packageDetail.GetFeatureInstallment2018Result, parseFloat(productPrice) - desPrice);
                                                                            console.log("======% trả trước==========", newPercent);

                                                                            //lấy gói trả góp đưa ra
                                                                            finalCompanySpecialInstalment = parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID);

                                                                            var argsInstalmentResult = {
                                                                                CategoryId: -1,
                                                                                Price: parseFloat(productPrice - desPrice),
                                                                                CompanyId: finalCompanySpecialInstalment,
                                                                                Percent: newPercent,
                                                                                Month: parseInt(packageDetail.GetFeatureInstallment2018Result.PaymentMonth),
                                                                                BriefId: parseInt(packageDetail.GetFeatureInstallment2018Result.BriefId),
                                                                                ListDealId: -1,
                                                                                ProductId: parseInt(productID),
                                                                                CollectionFee: finalCompanySpecialInstalment === 1 ? 11000 : finalCompanySpecialInstalment === 3 ? 12000 : 11000,
                                                                                SiteId: 1,
                                                                                InventStatusId: 1
                                                                            }
                                                                            APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                                //console.log(InstallmentResult);
                                                                                if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {

                                                                                    //=====================================================

                                                                                    resultanswer = "Thông tin gói trả góp 0% " + (parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 1 ? "<span style='color:red;font-weight:bold'> Home Credit</span>" : parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 3 ? "<span style='color:green;font-weight:bold'>FE Credit</span>" : "") + "</br>";
                                                                                    var moneyPrepaid = (packageDetail.GetFeatureInstallment2018Result.PaymentPercentFrom / 100) * (parseFloat(productPrice) - desPrice);
                                                                                    resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency((productPrice - desPrice).toString()) + "đ</span></br>";
                                                                                    if (desPrice > 0) {
                                                                                        resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(desPrice.toString()) + "đ</span>" + "</br>";

                                                                                    }
                                                                                    resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + newPercent + "%)</br>";

                                                                                    //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                                    console.log(packageDetail.GetFeatureInstallment2018Result);
                                                                                    var m1 = parseFloat(productPrice) - parseFloat(desPrice) - moneyPrepaid;
                                                                                    var m2 = m1 / packageDetail.GetFeatureInstallment2018Result.PaymentMonth;
                                                                                    var CollectionFee = sessions[sessionId].financialCompany === 8 ? 11000 : 12000;
                                                                                    var moneyPayInMonth = parseFloat(m2 + CollectionFee + parseFloat(InstallmentResult.GetInstallmentResult2018Result.InsuranceFee)).toFixed(0);
                                                                                    // console.log(m3);

                                                                                    resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + packageDetail.GetFeatureInstallment2018Result.PaymentMonth + " tháng</span>)" + "</br>";


                                                                                    var moneyDiff = (moneyPrepaid + packageDetail.GetFeatureInstallment2018Result.PaymentMonth * moneyPayInMonth - (parseFloat(productPrice) - parseFloat(desPrice))).toFixed(0);
                                                                                    resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                                    var FromDate = (packageDetail.GetFeatureInstallment2018Result.FromDate.split('T')[0]).split('-');
                                                                                    var ToDate = (packageDetail.GetFeatureInstallment2018Result.ToDate.split('T')[0]).split('-');
                                                                                    var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                                    var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                                    resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[packageDetail.GetFeatureInstallment2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                                    resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                    resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                    resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                    // setTimeout(() => {
                                                                                    //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                    //         .catch(console.error);
                                                                                    // }, 800);

                                                                                    questionTitle = "Lựa chọn khác";
                                                                                    var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, resultanswer, productPrice);

                                                                                    setTimeout(() => {
                                                                                        SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                            .catch(console.error);

                                                                                    }, 100);
                                                                                }


                                                                            });
                                                                        });
                                                                    }
                                                                    else {
                                                                        if (finalCompanySpecialInstalment === -1) {
                                                                            resultanswer = "Rất tiếc. Sản phẩm này không hỗ trợ gói trả góp 0% ạ.</br>";
                                                                        }
                                                                        else {
                                                                            resultanswer = "Công ty " + (finalCompanySpecialInstalment === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + " không hỗ trợ gói trả góp 0% cho sản phẩm này.</br>";
                                                                        }

                                                                        setTimeout(() => {
                                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                .catch(console.error);
                                                                        }, 500);

                                                                        questionTitle = "Lựa chọn khác";
                                                                        var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, questionTitle);

                                                                        setTimeout(() => {
                                                                            SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                .catch(console.error);

                                                                        }, 700);
                                                                    }



                                                                });

                                                                // }
                                                            }
                                                            else {
                                                                console.log("======productname=======", productName);
                                                                //TH samsung galaxy A7 2018 đặc beiejt (chưa có thông tin trả góp 0% trogn API)
                                                                // if (productName.trim().includes("a7") && !productName.trim().includes("oppo")) {
                                                                //     resultanswer += "Cần phải đặt cọc trước 500.000đ để được tham gia gói trả góp lãi suất 0%</br>";
                                                                //     resultanswer += "*Phần trăm trả trước: 30%</br>";
                                                                //     resultanswer += "*Số tháng góp: 4 tháng</br>";
                                                                //     resultanswer += "*Công ty tài chính: <span style='color:red'>Home Credit</span></br>";
                                                                //     resultanswer += "*Quà tặng:</br>";
                                                                //     resultanswer += "1. Phiếu mua hàng 1.000.000đ</br>\
                                                                //     2. 6 tháng bảo hiểm rơi vỡ</br>\
                                                                //     3. Trả góp 0% nhà tài chính</br>\
                                                                //     4. Quà tặng Galaxy Café Highland & Xem Phim Lotte trị giá 700.000đ</br>";


                                                                //     setTimeout(() => {
                                                                //         SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                //             .catch(console.error);
                                                                //     }, 500);
                                                                // }
                                                            }
                                                        }
                                                        else {

                                                            if (sessions[sessionId].isLatestAskPercentInstalment) {//nếu câu liền trước là hỏi số % trả trước
                                                                //==> mục đích là lấy đúng input người dùng nhập vào cho câu đó

                                                                if (sessions[sessionId].percent_instalment != null && typeof sessions[sessionId].percent_instalment !== "undefined") {
                                                                    sessions[sessionId].isLatestAskPercentInstalment = false;
                                                                    console.log("=======Phần trăm trả trước== " + sessions[sessionId].percent_instalment);
                                                                }
                                                            }
                                                            if (sessions[sessionId].isLatestAskMonthInstalment) {
                                                                if (sessions[sessionId].month_instalment) {
                                                                    sessions[sessionId].isLatestAskMonthInstalment = false;
                                                                    console.log("=======số tháng trả trước== " + sessions[sessionId].month_instalment);
                                                                }
                                                            }
                                                            if (sessions[sessionId].isLatestAskBrief) {
                                                                if (sessions[sessionId].BriefID) {
                                                                    sessions[sessionId].isLatestAskBrief = false;
                                                                    console.log("=======BriefID== " + sessions[sessionId].BriefID);
                                                                }
                                                            }

                                                            //số tiền trả trước
                                                            if (sessions[sessionId].money_prepaid && !ishavePercentInstalment) {
                                                                var prepaidPercent = (sessions[sessionId].money_prepaid / productPrice) * 100;
                                                                console.log("============số tiền trả trước money_prepaid==========", sessions[sessionId].money_prepaid);

                                                                if (prepaidPercent < 5 || prepaidPercent > 90) {
                                                                    console.log("============số tiền trả trước không hợp lệ==========", prepaidPercent);
                                                                }
                                                                else {
                                                                    //làm tròn % trả trước
                                                                    var propPecent = helpernumber.RoudPercentProperly(prepaidPercent);
                                                                    console.log("============% trả trước==========", propPecent);
                                                                    sessions[sessionId].percent_instalment = propPecent;
                                                                    if (sessions[sessionId].isLatestAskPercentInstalment) {
                                                                        sessions[sessionId].isLatestAskPercentInstalment = false;
                                                                    }

                                                                }
                                                            }

                                                            //hỏi giấy tờ
                                                            //default giấy tờ luôn
                                                            if (!sessions[sessionId].BriefID) {
                                                                sessions[sessionId].BriefID = 2;//CMND+SHK/BLX
                                                            }

                                                            if (!sessions[sessionId].BriefID) {
                                                                //if (sessions[sessionId].isLatestAskNormalInstallment) {

                                                                resultanswer += "<br />Mời " + sessions[sessionId].gender + "  thêm một số thông tin sau để xem góp trả góp thường phù hợp nhất. </br> ";

                                                                // }
                                                                // else {
                                                                //  resultanswer += "<br />Sản phẩm này <span style='font-style:italic;color:red'>không hỗ trợ trả góp 0%</span>. Mời " + sessions[sessionId].gender + "  thêm một số thông tin sau để xem góp trả góp thường phù hợp nhất. </br> ";
                                                                //}

                                                                resultanswer = "<br />1. <span style='font-style:italic;'>" + sessions[sessionId].gender + " có giấy tờ nào dưới đây?</span></br>";
                                                                sessions[sessionId].isLatestAskBrief = true;
                                                                var jsonbuttonBrief = getButtonListBrief(productID, productName, sender, siteid, replyobject, resultanswer);

                                                                // SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                //     .catch(console.error);

                                                                setTimeout(() => {
                                                                    SentToClientButton(sender, jsonbuttonBrief, intent)
                                                                        .catch(console.error);
                                                                }, 600)


                                                                return;

                                                            }
                                                            else if ((sessions[sessionId].percent_instalment === null || typeof sessions[sessionId].percent_instalment === "undefined") || sessions[sessionId].isLatestAskPercentInstalment) {

                                                                resultanswer = "<br/><span style='font-style:italic;'>" + sessions[sessionId].gender + "  muốn trả trước bao nhiêu %? </span></br>";
                                                                sessions[sessionId].isLatestAskPercentInstalment = true;
                                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                    .catch(console.error);
                                                                return;
                                                            }
                                                            //lấy danh sách tháng dựa vào giấy tờ và % trả trước
                                                            else if (!sessions[sessionId].month_instalment || sessions[sessionId].isLatestAskMonthInstalment) {
                                                                console.log("===% tra truoc===" + sessions[sessionId].percent_instalment);
                                                                console.log("===BriefID===" + sessions[sessionId].BriefID);

                                                                //xử lý logic..
                                                                if (sessions[sessionId].BriefID === -1)//không đủ đk trả góp
                                                                {

                                                                    //reset
                                                                    sessions[sessionId].isAskedGID = false;
                                                                    sessions[sessionId].isAskedBLX = false;
                                                                    sessions[sessionId].isAskedHDDN = false;
                                                                    sessions[sessionId].isAskedSHK = false;
                                                                    sessions[sessionId].isAskedPercentInstalment = false;



                                                                    SentToClient(sender, "<span style='color:red'>Rất tiếc. Giấy tờ " + sessions[sessionId].gender + "  cung cấp không đủ điều kiện để trả góp. Xin lỗi vì sự bất tiện này.</span>", questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                        .catch(console.error);
                                                                    return;
                                                                }
                                                                else {
                                                                    //chọn tháng trả góp dựa vào điều kiện

                                                                    var argsGetListMonth = {
                                                                        CategoryId: categoryID,
                                                                        Price: productPrice,
                                                                        CompanyId: -1,
                                                                        Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                        Month: -1,
                                                                        BriefId: sessions[sessionId].BriefID,
                                                                        ProductId: -1,
                                                                        SiteId: 1,
                                                                        InvenStatusId: 1
                                                                    }
                                                                    sessions[sessionId].isBeforeAskeMonthInstalment = true;
                                                                    APIGetNormalInstallment(urlwcfProduct, argsGetListMonth, function (allpackages) {
                                                                        //console.log(allpackages);
                                                                        //console.log(argsGetListMonth);
                                                                        if (allpackages.GetListNormalInstallment2018Result) {
                                                                            if (allpackages.GetListNormalInstallment2018Result.InstallmentBO) {
                                                                                sessions[sessionId].InstalmentMonth = [];
                                                                                for (var i = 0; i < allpackages.GetListNormalInstallment2018Result.InstallmentBO.length; i++) {
                                                                                    //console.log(element);
                                                                                    //khác số % trả trước
                                                                                    var element = allpackages.GetListNormalInstallment2018Result.InstallmentBO[i];
                                                                                    if (parseInt(element.PaymentPercentFrom) === parseInt(sessions[sessionId].percent_instalment)) {
                                                                                        if (!sessions[sessionId].InstalmentMonth.includes(parseInt(element.PaymentMonth))) {
                                                                                            sessions[sessionId].InstalmentMonth.push(parseInt(element.PaymentMonth));
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (sessions[sessionId].InstalmentMonth.length === 0) {
                                                                                resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp cho trả trước " + sessions[sessionId].percent_instalment + "%. Mời chọn lại.</span></br>";

                                                                                setTimeout(() => {
                                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                        .catch(console.error);
                                                                                }, 400);

                                                                                // questionTitle = "Lựa chọn khác";
                                                                                // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                // setTimeout(() => {
                                                                                //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                //         .catch(console.error);

                                                                                // }, 800);


                                                                                return;
                                                                            }

                                                                            sessions[sessionId].InstalmentMonth.sort(function (a, b) { return a - b });
                                                                            // sessions[sessionId].InstalmentMonth.forEach(element => {
                                                                            //     console.log(element);
                                                                            // });
                                                                            resultanswer = "<br /><span style='font-style:italic;'>" + sessions[sessionId].gender + " muốn trả góp trong vòng mấy tháng ạ?</span></br>";
                                                                            sessions[sessionId].isLatestAskMonthInstalment = true;

                                                                            var jsonbuttonMI = getButtonMonthInstalment(productID, productName, sender, siteid, replyobject, resultanswer, sessions[sessionId].InstalmentMonth);

                                                                            // SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                            //     .catch(console.error);
                                                                            sessions[sessionId].isBeforeAskeMonthInstalment = false;

                                                                            setTimeout(() => {
                                                                                SentToClientButton(sender, jsonbuttonMI, "ask_instalment")
                                                                                    .catch(console.error);
                                                                            }, 600)

                                                                            return;


                                                                        }
                                                                        else {//không có số tháng phù hợp cho % này
                                                                            resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp cho trả trước " + sessions[sessionId].percent_instalment + "%. Mời chọn lại.</span></br>";

                                                                            setTimeout(() => {
                                                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                    .catch(console.error);
                                                                            }, 400);

                                                                            // questionTitle = "Lựa chọn khác";
                                                                            // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                            // setTimeout(() => {
                                                                            //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                            //         .catch(console.error);

                                                                            // }, 800);


                                                                            return;
                                                                        }

                                                                    });

                                                                }
                                                            }
                                                            else {
                                                                //sau khi đã hỏi xong hết=> Bắt đầu đưa ra thông tin trả góp
                                                                console.log("===% tra truoc===" + sessions[sessionId].percent_instalment);
                                                                console.log("===so thang gop===" + sessions[sessionId].month_instalment);
                                                                console.log("===giá===" + productPrice);
                                                                console.log("===cate===" + categoryID);
                                                                console.log("===BreadID===" + sessions[sessionId].BriefID);

                                                                //ctytc
                                                                var finalCTTC = -1;
                                                                if (sessions[sessionId].financialCompany) {
                                                                    if (parseInt(sessions[sessionId].financialCompany) === 8) {
                                                                        finalCTTC = 1;
                                                                    }
                                                                    else if (parseInt(sessions[sessionId].financialCompany) === 9) {
                                                                        finalCTTC = 3;

                                                                    }
                                                                    else {
                                                                        finalCTTC = -1;
                                                                    }
                                                                }
                                                                else {
                                                                    //if (categoryID === 522) {
                                                                    finalCTTC = 3;//default fe,
                                                                    //}
                                                                    // else {
                                                                    //     finalCTTC = -1;
                                                                    // }

                                                                }



                                                                //lấy gói trả góp đưa ra
                                                                var argsInstalmentResult = {
                                                                    CategoryId: categoryID,
                                                                    Price: productPrice,
                                                                    CompanyId: finalCTTC,
                                                                    Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                    Month: parseInt(sessions[sessionId].month_instalment),
                                                                    BriefId: sessions[sessionId].BriefID,
                                                                    ListDealId: -1,
                                                                    ProductId: -1,
                                                                    CollectionFee: finalCTTC === 1 ? 11000 : 12000,
                                                                    SiteId: 1,
                                                                    InventStatusId: 1
                                                                }
                                                                //console.log("======thông số=======", argsInstalmentResult);
                                                                APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                    //console.log(InstallmentResult);

                                                                    if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                        //====================ÁP DỤNG KHUYẾN MÃI====================
                                                                        var discountPrice = parseFloat(GetSystemPromotionDisCountValue(productDetail, parseFloat(productPrice), false));
                                                                        console.log("======GIA GIAM==========", discountPrice);
                                                                        productPrice = productPrice - discountPrice;
                                                                        console.log("======GIA SAU GIAM==========", productPrice);

                                                                        var bIsNotApplyPromoHC = false;
                                                                        bIsNotApplyPromoHC = IsSystemPromoNotApplyForCompany(productDetail, InstallmentResult.GetInstallmentResult2018Result.ErpInstallmentId);
                                                                        console.log("========bIsNotApplyPromoHC====", bIsNotApplyPromoHC);
                                                                        if (bIsNotApplyPromoHC)
                                                                            productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi


                                                                        //=====================================================
                                                                        var newargsInstalmentResult = {
                                                                            CategoryId: categoryID,
                                                                            Price: productPrice,
                                                                            CompanyId: finalCTTC,
                                                                            Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                            Month: parseInt(sessions[sessionId].month_instalment),
                                                                            BriefId: sessions[sessionId].BriefID,
                                                                            ListDealId: -1,
                                                                            ProductId: -1,
                                                                            CollectionFee: finalCTTC === 1 ? 11000 : 12000,
                                                                            SiteId: 1,
                                                                            InventStatusId: 1
                                                                        }
                                                                        APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                                            //console.log(InstallmentResult);

                                                                            if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                resultanswer += "</br>Thông tin gói trả góp của " + (InstallmentResult.GetInstallmentResult2018Result.CompanyID === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                                var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                                resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                                if (discountPrice > 0) {
                                                                                    resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                                }

                                                                                resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom + "%)</br>";

                                                                                //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                                // var m1 = parseFloat(productPrice) - moneyPrepaid;
                                                                                // var m2 = m1 / InstallmentResult.GetInstallmentResultResult.PaymentMonth + 11000;
                                                                                // var moneyPayInMonth = m2.toFixed(0);
                                                                                var CollectionFee = finalCTTC === 1 ? 11000 : 12000;
                                                                                //console.log(InstallmentResult.GetInstallmentResult2018Result);
                                                                                var totlapaymonth = parseFloat(InstallmentResult.GetInstallmentResult2018Result.MoneyPayPerMonth) + parseFloat(InstallmentResult.GetInstallmentResult2018Result.InsuranceFee) + CollectionFee;

                                                                                var moneyPayInMonth = parseFloat(totlapaymonth).toFixed(0);
                                                                                console.log("===========moneyPayInMonth====: " + moneyPayInMonth);
                                                                                console.log("=======newargsInstalmentResult====:", newargsInstalmentResult);

                                                                                // console.log(m3);

                                                                                resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + " tháng</span>)</br>";


                                                                                var moneyDiff = (parseFloat(InstallmentResult.GetInstallmentResult2018Result.TotalPay) - parseFloat(productPrice)).toFixed(0);
                                                                                resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                                var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                                var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                                var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                                var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                                resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                                resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                setTimeout(() => {
                                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                        .catch(console.error);
                                                                                }, 800);

                                                                                // questionTitle = "Lựa chọn khác";
                                                                                // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                // setTimeout(() => {
                                                                                //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                //         .catch(console.error);

                                                                                // }, 1500);
                                                                            }
                                                                            else {
                                                                                resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp với công ty " + finalCTTC === 1 ? "<span style='color:red'>HomeCredit</span>" : finalCTTC === 3 ? "<span style='color:green'>FECredit</span>" : "CHƯA CHỌN" + "</span></br>";

                                                                                setTimeout(() => {
                                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                        .catch(console.error);
                                                                                }, 400);

                                                                                questionTitle = "Lựa chọn khác";
                                                                                return;
                                                                                // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                // setTimeout(() => {
                                                                                //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                //         .catch(console.error);

                                                                                // }, 800);

                                                                            }

                                                                        });
                                                                    }
                                                                    else {
                                                                        //if (categoryID === 522)//máy tính bảng lấy thêm company=1 xem sao
                                                                        {
                                                                            argsInstalmentResult.CompanyId = 1;
                                                                            finalCTTC = 1;
                                                                            APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                                if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                    //====================ÁP DỤNG KHUYẾN MÃI====================
                                                                                    var discountPrice = parseFloat(GetSystemPromotionDisCountValue(productDetail, parseFloat(productPrice), false));
                                                                                    console.log("======GIA GIAM==========", discountPrice);
                                                                                    productPrice = productPrice - discountPrice;
                                                                                    var bIsNotApplyPromoHC = false;
                                                                                    bIsNotApplyPromoHC = IsSystemPromoNotApplyForCompany(productDetail, InstallmentResult.GetInstallmentResult2018Result.ErpInstallmentId);
                                                                                    if (bIsNotApplyPromoHC)
                                                                                        productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi


                                                                                    //=====================================================
                                                                                    var newargsInstalmentResult = {
                                                                                        CategoryId: categoryID,
                                                                                        Price: productPrice,
                                                                                        CompanyId: finalCTTC,
                                                                                        Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                                        Month: parseInt(sessions[sessionId].month_instalment),
                                                                                        BriefId: sessions[sessionId].BriefID,
                                                                                        ListDealId: -1,
                                                                                        ProductId: -1,
                                                                                        CollectionFee: finalCTTC === 1 ? 11000 : 12000,
                                                                                        SiteId: 1,
                                                                                        InventStatusId: 1
                                                                                    }
                                                                                    APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                                                        //console.log(InstallmentResult);

                                                                                        if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                            resultanswer += "</br>Thông tin gói trả góp của " + (InstallmentResult.GetInstallmentResult2018Result.CompanyID === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                                            var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                                            resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                                            if (discountPrice > 0) {
                                                                                                resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                                            }

                                                                                            resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom + "%)</br>";

                                                                                            //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                                            // var m1 = parseFloat(productPrice) - moneyPrepaid;
                                                                                            // var m2 = m1 / InstallmentResult.GetInstallmentResultResult.PaymentMonth + 11000;
                                                                                            // var moneyPayInMonth = m2.toFixed(0);
                                                                                            var CollectionFee = finalCTTC === 1 ? 11000 : 12000;
                                                                                            //console.log(InstallmentResult.GetInstallmentResult2018Result);
                                                                                            var totlapaymonth = parseFloat(InstallmentResult.GetInstallmentResult2018Result.MoneyPayPerMonth) + parseFloat(InstallmentResult.GetInstallmentResult2018Result.InsuranceFee) + CollectionFee;

                                                                                            var moneyPayInMonth = parseFloat(totlapaymonth).toFixed(0);
                                                                                            // console.log(m3);

                                                                                            resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + " tháng</span>)</br>";


                                                                                            var moneyDiff = (parseFloat(InstallmentResult.GetInstallmentResult2018Result.TotalPay) - parseFloat(productPrice)).toFixed(0);
                                                                                            resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                                            var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                                            var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                                            var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                                            var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                                            resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                                            resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                            resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                            resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                            setTimeout(() => {
                                                                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                                    .catch(console.error);
                                                                                            }, 800);

                                                                                            // questionTitle = "Lựa chọn khác";
                                                                                            // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                            // setTimeout(() => {
                                                                                            //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                            //         .catch(console.error);

                                                                                            // }, 1500);
                                                                                        }
                                                                                        else {
                                                                                            resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp với công ty " + finalCTTC === 1 ? "<span style='color:red'>HomeCredit</span>" : finalCTTC === 3 ? "<span style='color:green'>FECredit</span>" : "CHƯA CHỌN" + "</span></br>";

                                                                                            setTimeout(() => {
                                                                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                                    .catch(console.error);
                                                                                            }, 400);

                                                                                            questionTitle = "Lựa chọn khác";
                                                                                            return;
                                                                                            // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                            // setTimeout(() => {
                                                                                            //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                            //         .catch(console.error);

                                                                                            // }, 800);

                                                                                        }

                                                                                    });
                                                                                }
                                                                                else {
                                                                                    resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp nào với </span>" +
                                                                                        "<span style='color:red'>số tháng là " + sessions[sessionId].month_instalment + "</span> và " +
                                                                                        "<span style='color:green'>% trả trước là " + sessions[sessionId].percent_instalment + "%</span></br>";
                                                                                    if (parseInt(sessions[sessionId].percent_instalment) === 0) {
                                                                                        var jsonmessageAnother =
                                                                                            {
                                                                                                username: sender,
                                                                                                siteid: siteid,
                                                                                                messagetype: "template",
                                                                                                replyobject: replyobject,
                                                                                                messagecontentobject: {
                                                                                                    elements: [
                                                                                                        {
                                                                                                            title: resultanswer,
                                                                                                            buttons: [
                                                                                                                {
                                                                                                                    type: "postback",
                                                                                                                    title: "Xem gói trả trước 0đ",
                                                                                                                    payload: "INSTALMENT_PACKAGE0D"
                                                                                                                },
                                                                                                                {
                                                                                                                    type: "postback",
                                                                                                                    title: "Xem gói 0% lãi suất",
                                                                                                                    payload: "INSTALMENT_0PTLS"
                                                                                                                }

                                                                                                            ]
                                                                                                        }
                                                                                                    ]
                                                                                                }
                                                                                            };

                                                                                        var anotheroptionbutton = JSON.stringify(jsonmessageAnother);


                                                                                        setTimeout(() => {
                                                                                            SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                                                .catch(console.error);

                                                                                        }, 400);
                                                                                    }
                                                                                    else {
                                                                                        setTimeout(() => {
                                                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                                .catch(console.error);
                                                                                        }, 400);
                                                                                    }
                                                                                    return;
                                                                                }
                                                                            });

                                                                        }
                                                                        // else {
                                                                        //     console.log("==========O DAY=================");
                                                                        //     resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp nào với </span>" +
                                                                        //         "<span style='color:red'>số tháng là " + sessions[sessionId].month_instalment + "</span> và " +
                                                                        //         "<span style='color:green'>% trả trước là " + sessions[sessionId].percent_instalment + "%</span></br>";
                                                                        //     if (parseInt(sessions[sessionId].percent_instalment) === 0) {
                                                                        //         var jsonmessageAnother =
                                                                        //             {
                                                                        //                 username: sender,
                                                                        //                 siteid: siteid,
                                                                        //                 messagetype: "template",
                                                                        //                 replyobject: replyobject,
                                                                        //                 messagecontentobject: {
                                                                        //                     elements: [
                                                                        //                         {
                                                                        //                             title: resultanswer,
                                                                        //                             buttons: [
                                                                        //                                 {
                                                                        //                                     type: "postback",
                                                                        //                                     title: "Xem gói trả trước 0đ",
                                                                        //                                     payload: "INSTALMENT_PACKAGE0D"
                                                                        //                                 },
                                                                        //                                 {
                                                                        //                                     type: "postback",
                                                                        //                                     title: "Xem gói 0% lãi suất",
                                                                        //                                     payload: "INSTALMENT_0PTLS"
                                                                        //                                 }

                                                                        //                             ]
                                                                        //                         }
                                                                        //                     ]
                                                                        //                 }
                                                                        //             };

                                                                        //         var anotheroptionbutton = JSON.stringify(jsonmessageAnother);


                                                                        //         setTimeout(() => {
                                                                        //             SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                        //                 .catch(console.error);

                                                                        //         }, 400);
                                                                        //     }
                                                                        //     else {
                                                                        //         setTimeout(() => {
                                                                        //             SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                        //                 .catch(console.error);
                                                                        //         }, 400);
                                                                        //     }
                                                                        //     return;
                                                                        // }

                                                                        // questionTitle = "Lựa chọn khác";
                                                                        // var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                        // setTimeout(() => {
                                                                        //     SentToClientButton(sender, anotheroptionbutton, "ask_instalment")
                                                                        //         .catch(console.error);

                                                                        // }, 800);


                                                                    }


                                                                });
                                                            }

                                                            // if (!sessions[sessionId].isBeforeAskeMonthInstalment) {
                                                            //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                            //         .catch(console.error);
                                                            // }

                                                        }
                                                    });
                                                    //nếu không có...
                                                }
                                                else {
                                                    resultanswer += "<br />Sản phẩm này hiện tại không hỗ trợ bất kỳ hình thức trả góp nào. " + sessions[sessionId].gender + "  có thể hỏi sản phẩm khác hoặc " + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";
                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                        .catch(console.error);
                                                    // resultanswer += "<br />"+sessions[sessionId].gender+"  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho "+sessions[sessionId].gender+"  tốt hơn. ";

                                                }
                                            }

                                        });
                                    }

                                    else {
                                        resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG CÓ HÀNG</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                            .catch(console.error);
                                    }
                                });
                            }

                            else {
                                // var rn = randomNumber(productnotfound.length);

                                // resultanswer = productnotfound[rn];
                                resultanswer = "Dạ không tìm thấy sản phẩm <span style='color:red'>" + productName + "</span>. " + sessions[sessionId].gender + " có thể nõi rõ và đúng tên sản phẩm để phục vụ tốt hơn ạ. Em cảm ơn " + sessions[sessionId].gender + "</br>";


                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                    .catch(console.error);

                            }

                        });

                    }
                }
                else if (subIntent === "issupportinstalment") {
                    questionTitle = "Hỗ trợ trả góp";
                    resultanswer = "";
                    if (sessions[sessionId].product) {
                        var productName = sessions[sessionId].product;
                        console.log(productName);
                        var keyword = productName;
                        var argsSearchProduct = "";

                        if (isIncludeAccessoryKeyword(keyword))//search phụ kiện
                        {
                            argsSearchProduct = {
                                q: keyword,
                                CateID: -3
                            };
                        }
                        else {

                            argsSearchProduct = {
                                q: keyword,
                                CateID: -4
                            };
                        }
                        APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                            if (result.SearchProductPhiResult != null) {
                                var productID = result.SearchProductPhiResult.string[0];
                                sessions[sessionId].productID = productID;

                                var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                                APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                    var productDetail = result.GetProductResult;
                                    if (result && result.GetProductResult.productErpPriceBOField) {
                                        //lấy link sp
                                        var argsProductDetailGetSeoURL = {
                                            productCategoryLangBOField_uRLField: result.GetProductResult.productCategoryLangBOField.uRLField,
                                            productCategoryLangBOField_categoryNameField: result.GetProductResult.productCategoryLangBOField.categoryNameField,
                                            productCategoryBOField_uRLField: result.GetProductResult.productCategoryBOField.uRLField,
                                            productCategoryBOField_categoryNameField: result.GetProductResult.productCategoryBOField.categoryNameField,
                                            categoryNameField: result.GetProductResult.categoryNameField,
                                            productLanguageBOField_productNameField: result.GetProductResult.productLanguageBOField.productNameField,
                                            productLanguageBOField_uRLField: result.GetProductResult.productLanguageBOField.uRLField,
                                            productNameField: result.GetProductResult.productNameField,
                                            uRLField: result.GetProductResult.uRLField
                                        };

                                        productName = result.GetProductResult.productNameField;
                                        //console.log(result);
                                        var categoryID = parseInt(result.GetProductResult.categoryIDField);

                                        resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                            + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>Không xác định</span>") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                        resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/>";

                                        APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                            resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";
                                            console.log(result.GetProductResult.productErpPriceBOField.webStatusIdField);
                                            if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại  <span style='color:red'>CHƯA CÓ HÀNG</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else {
                                                var productPrice = result.GetProductResult.productErpPriceBOField.priceField === "0" ? 0 : parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                                if (productPrice >= 1200000) {
                                                    var argCheckZeroInstalment = {
                                                        ProductId: productID,
                                                        SiteId: 1
                                                    };
                                                    APICheckZeroInstalment(urlwcfProduct, argCheckZeroInstalment, function callback(result) {
                                                        resultanswer += "Hiện tại, <span style='color:green'>" + productName + "</span> đang hỗ trợ các gói trả góp sau đây ạ";
                                                        var jsonbuttonInstalment = "";
                                                        if (result) {//co tra gop 0%                                                                                                               
                                                            jsonbuttonInstalment = getButtonInstalment(sender, siteid, replyobject, resultanswer, productPrice, true);

                                                        }
                                                        else {
                                                            jsonbuttonInstalment = getButtonInstalment(sender, siteid, replyobject, resultanswer, productPrice, false);

                                                        }
                                                        setTimeout(() => {
                                                            SentToClientButton(sender, jsonbuttonInstalment, "ask_instalment+issupportinstalment")
                                                                .catch(console.error);

                                                        }, 100);
                                                    });
                                                }
                                                else {
                                                    resultanswer += "<br />Sản phẩm này hiện tại không hỗ trợ bất kỳ hình thức trả góp nào. " + sessions[sessionId].gender + "  có thể hỏi sản phẩm khác hoặc " + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";
                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                        .catch(console.error);
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG CÓ HÀNG</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                            .catch(console.error);
                                    }
                                });
                            }
                            else {
                                resultanswer = "Dạ không tìm thấy sản phẩm <span style='color:red'>" + productName + "</span>. " + sessions[sessionId].gender + " có thể nõi rõ và đúng tên sản phẩm để phục vụ tốt hơn ạ. Em cảm ơn " + sessions[sessionId].gender + "</br>";
                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                    .catch(console.error);

                            }
                        });
                        //check có trả góp không

                        //check có trả góp 0đ không


                        //check có trả góp 0% không




                    }


                }
                else if (subIntent === "package0d") {
                    questionTitle = "Trả trước 0đ";
                    if (!sessions[sessionId].product) {
                        resultanswer = "Dạ, mua trả trước 0đ cần <span style='color:red'>Hộ Khẩu + CMND</span> và các sản phẩm tầm giá từ 2 triệu - 25 triệu đều hỗ trợ trả trước 0đ qua công ty <span style='color:green'>FE Credit</span> nha " + sessions[sessionId].gender + ", nhưng lãi suất sẽ tương đối cao ạ. Không biết " + sessions[sessionId].gender + " quan tâm đến\
                     trả trước 0đ cho sản phẩm nào ạ? Em sẽ tính giúp "+ sessions[sessionId].gender + " thông tin trả góp";
                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                            .catch(console.error);
                        sessions[sessionId].isLatestAskProduct0d = true;

                        return;
                    }
                    else {
                        //  resultanswer = "Thông tin gói trả trước 0đ cho sản phẩm " + sessions[sessionId].product + "của <span style='color:green'>FE Credit</span>";
                        //sau khi đã hỏi xong hết=> Bắt đầu đưa ra thông tin trả góp

                        var productName = sessions[sessionId].product;
                        console.log("===0đ===", productName);
                        var keyword = productName;
                        var argsSearchProduct = "";

                        if (isIncludeAccessoryKeyword(keyword))//search phụ kiện
                        {
                            argsSearchProduct = {
                                q: keyword,
                                CateID: -3
                            };
                        }
                        else {

                            argsSearchProduct = {
                                q: keyword,
                                CateID: -4
                            };
                        }
                        APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                            if (result.SearchProductPhiResult != null) {

                                var productID = result.SearchProductPhiResult.string[0];
                                sessions[sessionId].productID = productID;

                                var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                                var lstproduct = result;

                                APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                    var productDetail = result.GetProductResult;
                                    if (result && result.GetProductResult.productErpPriceBOField) {
                                        //lấy link sp
                                        var argsProductDetailGetSeoURL = {
                                            productCategoryLangBOField_uRLField: result.GetProductResult.productCategoryLangBOField.uRLField,
                                            productCategoryLangBOField_categoryNameField: result.GetProductResult.productCategoryLangBOField.categoryNameField,
                                            productCategoryBOField_uRLField: result.GetProductResult.productCategoryBOField.uRLField,
                                            productCategoryBOField_categoryNameField: result.GetProductResult.productCategoryBOField.categoryNameField,
                                            categoryNameField: result.GetProductResult.categoryNameField,
                                            productLanguageBOField_productNameField: result.GetProductResult.productLanguageBOField.productNameField,
                                            productLanguageBOField_uRLField: result.GetProductResult.productLanguageBOField.uRLField,
                                            productNameField: result.GetProductResult.productNameField,
                                            uRLField: result.GetProductResult.uRLField
                                        };


                                        //console.log(result);
                                        var categoryID = parseInt(result.GetProductResult.categoryIDField);
                                        var productPrice = parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                        var productNameField = result.GetProductResult.productNameField;
                                        var productOriginPrice = parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                        resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                            + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>Không xác định</span>") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                        resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                        //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                        //  console.log(resultanswer);

                                        APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                            resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                            if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>CHƯA CÓ HÀNG</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else {
                                                if (productPrice <= 2000000 || productPrice > 25000000) {
                                                    resultanswer += "<br /><span style='color:red'>Không hỗ trợ trả trước 0đ cho sản phẩm này</span>. </br> ";

                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                        .catch(console.error);
                                                    return;

                                                }
                                                resultanswer += "<br /><span style='color:red'>Thông tin gói trả trước 0đ</span>. </br> ";
                                                //send ds ctytc

                                                if (sessions[sessionId].isLatestAskMonth0dInstalment) {
                                                    if (sessions[sessionId].month_instalment) {
                                                        sessions[sessionId].isLatestAskMonth0dInstalment = false;
                                                        console.log("=======số tháng trả trước== " + sessions[sessionId].month_instalment);
                                                    }
                                                }


                                                if (!sessions[sessionId].month_instalment ||
                                                    sessions[sessionId].isLatestAskMonth0dInstalment) {

                                                    // sessions[sessionId].isBeforeAskeMonthInstalment = true;

                                                    resultanswer += "<br /><span style='font-style:italic;'>" + sessions[sessionId].gender + " muốn trả góp trong vòng mấy tháng ạ?</span></br>";
                                                    sessions[sessionId].isLatestAskMonth0dInstalment = true;

                                                    var jsonbuttonMI = getButtonMonthInstalment(productID, productName, sender, siteid, replyobject, resultanswer, sessions[sessionId].InstalmentMonth);

                                                    // SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    //     .catch(console.error);


                                                    setTimeout(() => {
                                                        SentToClientButton(sender, jsonbuttonMI, "ask_instalment")
                                                            .catch(console.error);
                                                    }, 600)

                                                    return;
                                                }

                                                //region tra gop 0đ

                                                //lấy gói trả góp đưa ra
                                                var argsInstalmentResult = {
                                                    CategoryId: categoryID,
                                                    Price: productPrice,
                                                    CompanyId: 3,
                                                    Percent: 0,
                                                    Month: parseInt(sessions[sessionId].month_instalment),
                                                    BriefId: 1,
                                                    ListDealId: -1,
                                                    ProductId: -1,
                                                    CollectionFee: 12000,
                                                    SiteId: 1,
                                                    InventStatusId: 1
                                                }
                                                APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                    //console.log(InstallmentResult);
                                                    if (InstallmentResult) {
                                                        if (InstallmentResult.GetInstallmentResult2018Result) {
                                                            //====================ÁP DỤNG KHUYẾN MÃI====================
                                                            var discountPrice = parseFloat(GetSystemPromotionDisCountValue(productDetail, parseFloat(productPrice), false));
                                                            console.log("======GIA GIAM==========", discountPrice);
                                                            productPrice = productPrice - discountPrice;
                                                            var bIsNotApplyPromoHC = false;
                                                            bIsNotApplyPromoHC = IsSystemPromoNotApplyForCompany(productDetail, InstallmentResult.GetInstallmentResult2018Result.ErpInstallmentId);
                                                            if (bIsNotApplyPromoHC)
                                                                productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi


                                                            //=====================================================
                                                            var newargsInstalmentResult = {
                                                                CategoryId: categoryID,
                                                                Price: productPrice,
                                                                CompanyId: 3,
                                                                Percent: 0,
                                                                Month: parseInt(sessions[sessionId].month_instalment),
                                                                BriefId: 1,
                                                                ListDealId: -1,
                                                                ProductId: -1,
                                                                CollectionFee: 12000,
                                                                SiteId: 1,
                                                                InventStatusId: 1
                                                            }
                                                            APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                                if (InstallmentResult) {

                                                                    if (InstallmentResult.GetInstallmentResult2018Result) {
                                                                        resultanswer = "Thông tin gói trả trước 0đ của <span style='color:green;font-weight:bold'>FE Credit</span></br>";
                                                                        resultanswer += "Tên sản phẩm: <span style='font-weight:bold'>" + productNameField + "</span></br>";
                                                                        resultanswer += "Giá gốc: <span style='font-weight:bold'>" + format_currency(productOriginPrice.toString()) + "đ</span></br>";

                                                                        var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                        resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                        if (discountPrice > 0) {
                                                                            resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                        }

                                                                        resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom + "%)</br>";

                                                                        //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                        // var m1 = parseFloat(productPrice) - moneyPrepaid;
                                                                        // var m2 = m1 / InstallmentResult.GetInstallmentResultResult.PaymentMonth + 11000;
                                                                        // var moneyPayInMonth = m2.toFixed(0);
                                                                        var CollectionFee = 12000;
                                                                        //console.log(InstallmentResult.GetInstallmentResult2018Result);
                                                                        var totlapaymonth = parseFloat(InstallmentResult.GetInstallmentResult2018Result.MoneyPayPerMonth) + parseFloat(InstallmentResult.GetInstallmentResult2018Result.InsuranceFee) + CollectionFee;

                                                                        var moneyPayInMonth = parseFloat(totlapaymonth).toFixed(0);
                                                                        // console.log(m3);

                                                                        resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + " tháng</span>)</br>";


                                                                        var moneyDiff = (parseFloat(InstallmentResult.GetInstallmentResult2018Result.TotalPay) - parseFloat(productPrice)).toFixed(0);
                                                                        resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                        var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                        var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                        var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                        var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                        resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                        resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                        resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                        resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                        // setTimeout(() => {
                                                                        //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                                        //         .catch(console.error);
                                                                        // }, 800);

                                                                        questionTitle = "Lựa chọn khác";
                                                                        var anotheroptionbutton = AnotherOptionNormalInstalment0d(sender, siteid, replyobject, resultanswer);

                                                                        setTimeout(() => {
                                                                            SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d")
                                                                                .catch(console.error);

                                                                        }, 500);
                                                                    }
                                                                    else {
                                                                        resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả trước 0đ nào</span></br>";

                                                                        // setTimeout(() => {
                                                                        //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                                        //         .catch(console.error);
                                                                        // }, 400);

                                                                        questionTitle = "Lựa chọn khác";
                                                                        var anotheroptionbutton = AnotherOptionNormalInstalment0d(sender, siteid, replyobject, resultanswer);

                                                                        setTimeout(() => {
                                                                            SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d")
                                                                                .catch(console.error);

                                                                        }, 500);

                                                                    }
                                                                }
                                                                else {
                                                                    resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp.</span></br>";

                                                                    setTimeout(() => {
                                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 400);

                                                                    questionTitle = "Lựa chọn khác";
                                                                    var anotheroptionbutton = AnotherOptionNormalInstalment0d(sender, siteid, replyobject, questionTitle);

                                                                    setTimeout(() => {
                                                                        SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d")
                                                                            .catch(console.error);

                                                                    }, 800);

                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                            }
                                            //endregion
                                        });
                                    }
                                    else {
                                        resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG CÓ HÀNG</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }
                                });
                            }
                            else {
                                var rn = randomNumber(productnotfound.length);
                                resultanswer = productnotfound[rn];

                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                    .catch(console.error);

                            }
                        });
                    }

                }
                else if (subIntent === "needdobrief_again") {
                    questionTitle = "Làm lại hồ sơ";
                    resultanswer = "Dạ, trong trường hợp " + sessions[sessionId].gender + " đã mua trả góp rồi và giờ muốn mua trả góp nữa thì bắt buộc phải làm lại hồ sơ ạ. Xin thông tin đến " + sessions[sessionId].gender + ".";

                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+needdobrief_again", replyobject, siteid)
                        .catch(console.error);

                    return;
                }
                else if (subIntent === "canbuymultiproduct") {
                    questionTitle = "Mua trả góp nhiều sản phẩm cùng lúc";
                    resultanswer = "Dạ, hiện tại chỉ có công ty tài chính <span style='color:red'>Home Credit</span> hỗ trợ mua trả góp nhiều sản phẩm cùng lúc thôi ạ. ";

                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+canbuymultiproduct", replyobject, siteid)
                        .catch(console.error);

                    return;
                }
                else if (subIntent === "briefphoto") {
                    questionTitle = "Giấy tờ photo công chứng";
                    resultanswer = "Dạ theo quy định trả góp thì: </br>\
                     1. CMND cần phải là bản gốc, <span style='color:red'>không chấp nhận bản photo công chứng</span></br>\
                     2. Sổ hộ khẩu chấp nhận bản photo có công chứng không quá 3 tháng và phải đủ 16 trang (nguyên cuốn) ạ</br>";


                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+briefphoto", replyobject, siteid)
                        .catch(console.error);
                    return;
                }
                else if (subIntent === "cancontinuepayinstalment") {
                    questionTitle = "Có thể mua góp tiếp?";
                    resultanswer = "Dạ, có 2 trường hợp thế này: </br>\
                     1. Nếu "+ sessions[sessionId].gender + " đã trả góp xong rồi thì " + sessions[sessionId].gender + " có thể mua trả góp tiếp tục ạ. Lúc này " + sessions[sessionId].gender + " cần phải làm lại hồ sơ ạ. </br>\
                     2. Nếu "+ sessions[sessionId].gender + " vẫn đang trong quá trình trả góp thì " + sessions[sessionId].gender + " vẫn có thể làm hồ sơ trả góp tiếp. \
                     Lưu ý: " + sessions[sessionId].gender + " nên chọn công ty tài chính khác để tỷ lệ duyệt hồ sơ thành công cao hơn ạ.</br>";


                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+cancontinuepayinstalment", replyobject, siteid)
                        .catch(console.error);
                    return;

                }
                else if (subIntent === "information_oldproduct") {

                    return;
                }


            }
            else if (intent === "ask_stock" || intent === "ask_price" || intent === "ask_old_stock") {


                sessions[sessionId].isLatestAskNormalInstallment = false;
                return;//tạm thời không làm cái này


                if (intent === "ask_stock")
                    sessions[sessionId].prev_intent = "ask_stock";
                if (intent === "ask_price")
                    sessions[sessionId].prev_intent = "ask_price";
                if (intent === "ask_old_stock")
                    sessions[sessionId].prev_intent = "ask_old_stock";


                questionTitle = "Thông tin sản phẩm!";
                //ten san pham, gia ca, dia chi, mau sac

                if (sessions[sessionId].product) {

                    var productName = sessions[sessionId].product;
                    console.log(productName);

                    //nếu có tỉnh,tp => lấy tên tỉnh,tp
                    var province;
                    var district;
                    var color;
                    if (sessions[sessionId].province) {

                        province = sessions[sessionId].province;

                    }
                    //nếu có quận.huyện =>lấy nó
                    if (sessions[sessionId].district) {

                        district = sessions[sessionId].district;

                    }

                    if (sessions[sessionId].color) {
                        color = sessions[sessionId].color;

                    }

                    var keyword = productName;

                    // var intRowCountRef=0;
                    // var categoryLstRef=[];
                    // var productTypeLstRef=[];
                    // var categoryDefault=0;
                    var argsSearchProduct = "";

                    //console.log(keyword.toLowerCase());
                    console.log(keyword);
                    console.log(isIncludeAccessoryKeyword(keyword));

                    if (isIncludeAccessoryKeyword(keyword))//search phụ kiện
                    {
                        argsSearchProduct = {
                            q: keyword,
                            CateID: -3
                        };
                    }
                    else {

                        argsSearchProduct = {
                            q: keyword,
                            CateID: -4
                        };
                    }

                    if (intent === "ask_old_stock")//xử lý máy cũ
                    {
                        SentToClient(sender, "Chức năng tìm máy cũ đang được phát triển...Xin lỗi vì sự bất tiện này!", questionTitle, button_payload_state, intent, replyobject, siteid)
                            .catch(console.error);

                    }
                    else {

                        APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                            //console.log(result);
                            if (result.SearchProductPhiResult != null) {

                                //console.log("================KẾT QUẢ SEARCH===============");
                                //console.log(result.SearchProductPhiResult);

                                //console.log("============================================");

                                var productID = result.SearchProductPhiResult.string[0];
                                sessions[sessionId].productID = productID;

                                var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                                var lstproduct = result;

                                APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {


                                    if (result && result.GetProductResult.productErpPriceBOField) {
                                        //lấy link sp
                                        var argsProductDetailGetSeoURL = {
                                            productCategoryLangBOField_uRLField: result.GetProductResult.productCategoryLangBOField.uRLField,
                                            productCategoryLangBOField_categoryNameField: result.GetProductResult.productCategoryLangBOField.categoryNameField,
                                            productCategoryBOField_uRLField: result.GetProductResult.productCategoryBOField.uRLField,
                                            productCategoryBOField_categoryNameField: result.GetProductResult.productCategoryBOField.categoryNameField,
                                            categoryNameField: result.GetProductResult.categoryNameField,
                                            productLanguageBOField_productNameField: result.GetProductResult.productLanguageBOField.productNameField,
                                            productLanguageBOField_uRLField: result.GetProductResult.productLanguageBOField.uRLField,
                                            productNameField: result.GetProductResult.productNameField,
                                            uRLField: result.GetProductResult.uRLField
                                        };


                                        // console.log(result);
                                        resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                            + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                        //  console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                        resultanswer += "<br /><img width='120' height='120' src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                        //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                        // console.log(resultanswer);

                                        APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {

                                            resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                            if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 1) || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0") ||
                                                (result.GetProductResult.productErpPriceBOField.priceField.toString() === "-1")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";


                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";


                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else {

                                                //nếu có tỉnh/tp mới, reset lại huyện

                                                if (province && !district) {//có province, không có district

                                                    //lấy provinceID

                                                    var index = "locationdata";
                                                    var type = "province";
                                                    getElasticSearch(el, index, type, province, function callbackEL(err, result) {
                                                        if (err) return err;
                                                        //console.log(result);
                                                        if (result.length != 0) {//district được tìm thấy
                                                            var provinceID = result[0]._source.provinceID;
                                                            var provinceName = result[0]._source.provinceName;
                                                            sessions[sessionId].province = provinceName;
                                                            sessions[sessionId].provinveID = provinceID;

                                                            //console.log(provinceID);

                                                            //lấy danh sách siêu thị còn hàng
                                                            var total = 0;
                                                            var argsProductStock = "";
                                                            if (hasNumber(color)) {
                                                                argsProductStock = {
                                                                    productID: parseInt(productID), productCode: color, provinceID: provinceID,
                                                                    districtID: 0, pageSize: 30, pageIndex: pageIndexDefault, total
                                                                };
                                                            }
                                                            else {
                                                                argsProductStock = {
                                                                    productID: parseInt(productID), productCode: null, provinceID: provinceID,
                                                                    districtID: 0, pageSize: 30, pageIndex: pageIndexDefault, total
                                                                };
                                                            }

                                                            APICheckInStock(urlApiCategory, argsProductStock, function getResult(result) {
                                                                //console.log(argsProductStock);


                                                                // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                                // console.log(total);
                                                                console.log(result);
                                                                if (result.total) {//có hàng
                                                                    resultanswer = "";

                                                                    var type = "template";

                                                                    questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> tại " + provinceName;
                                                                    var jsonmessageStore = {
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
                                                                    var length = result.GetStoreInStock2016Result.StoreBO.length;

                                                                    // resultanswer += "<br />Danh sách siêu thị có hàng tại " + provinceName + "<br />";
                                                                    for (var i = 0; i < result.GetStoreInStock2016Result.StoreBO.length; i++) {
                                                                        var storeBO = result.GetStoreInStock2016Result.StoreBO[i];
                                                                        //resultanswer += (i + 1) + ". " + storeBO.webAddressField + "<br />";
                                                                        //resultanswer += " https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + "<br />";

                                                                        jsonmessageStore.messagecontentobject.elements[0].buttons.push({
                                                                            type: "web_url",
                                                                            title: (i + 1) + ". " + storeBO.webAddressField,
                                                                            url: "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField
                                                                        });
                                                                    }

                                                                    //SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                    //    .catch(console.error);
                                                                    // console.log(jsonmessageStore);

                                                                    //  var bodystring = JSON.parse(jsonmessageStore);
                                                                    var bodyjson = JSON.stringify(jsonmessageStore);


                                                                    //console.log("===============BUTTON URL STORE===================");
                                                                    //console.log(bodyjson);


                                                                    SentToClientButton(sender, bodyjson, intent)
                                                                        .catch(console.error);


                                                                    //===========================================================================================


                                                                    //lấy danh sách huyện của tỉnh đó

                                                                    var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };

                                                                    SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);


                                                                }
                                                                else {//hết hàng
                                                                    SentToClient(sender, "Rất tiếc. Sản phẩm " + productName + " đã <span style='color:red'>HẾT HÀNG HOẶC ĐANG NHẬP VỀ</span> tại khu vực " + provinceName + " của " + sessions[sessionId].gender + " ! Vui lòng chọn lại khu vực lân cận.", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        .catch(console.error);

                                                                }

                                                            });//end APIGetDistrictByProvince

                                                        }
                                                        else {

                                                            sessions[sessionId].province = null;
                                                            SentToClient(sender, "Không nhận diện được Tỉnh/Thành Phố " + sessions[sessionId].gender + "  đang ở. Vui lòng cung cấp tỉnh/Thành trước. (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                        }

                                                    });//end elastic



                                                }
                                                else if (province && district) {

                                                    //console.log(province+"-"+district);


                                                    //lấy danh sách cửa hàng còn hàng ở tỉnh, huyện  đó không theo màu

                                                    var index = "locationdata";
                                                    var type = "district";
                                                    if (!(sessions[sessionId].provinveID))//th này là do detect đc cả tỉnh lẫn huyện trong 1 câu (phức tạp)
                                                    {
                                                        sessions[sessionId].provinveID = 3;//cho tránh trường hợp lỗi query elastic (lấy mặc định là HCM)
                                                    }
                                                    //tìm huyện theo tỉnh trước
                                                    getElasticSearchDistrictAndProvince(el, index, type, district, sessions[sessionId].provinveID, function callbackEL(err, result) {
                                                        if (err) return err;
                                                        if (result.length != 0) {
                                                            if (result.length == 1)//đã xác định đúng chính xác huyện và tỉnh đó
                                                            {
                                                                var provinceID = result[0]._source.provinceID;
                                                                var districtID = result[0]._source.districtID;
                                                                var districtName = result[0]._source.districtName;
                                                                var provinceName = province;

                                                                //console.log(provinceID);

                                                                //lấy danh sách siêu thị còn hàng
                                                                var total = 0;
                                                                var argsProductStock = "";
                                                                if (hasNumber(color)) {
                                                                    argsProductStock = {
                                                                        productID: parseInt(productID), productCode: color, provinceID: parseInt(provinceID),
                                                                        districtID: parseInt(districtID), pageSize: 20, pageIndex: pageIndexDefault, total
                                                                    };
                                                                }
                                                                else {
                                                                    argsProductStock = {
                                                                        productID: parseInt(productID), productCode: null, provinceID: parseInt(provinceID),
                                                                        districtID: parseInt(districtID), pageSize: 20, pageIndex: pageIndexDefault, total
                                                                    };
                                                                }
                                                                APICheckInStock(urlApiCategory, argsProductStock, function getResult(result) {
                                                                    //console.log(argsProductStock);
                                                                    //console.log("Tham số truyền vào Check Stock:<br />" + JSON.parse(argsProductStock));

                                                                    // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                                    console.log(result);
                                                                    if (result.total > 0 && result.GetStoreInStock2016Result.StoreBO.length > 0 && result.GetStoreInStock2016Result.StoreBO[0].webAddressField != "undefined") {//có hàng

                                                                        // console.log(total);
                                                                        resultanswer = "";

                                                                        if (color && hasNumber(color)) {
                                                                            //resultanswer += "<br />Danh sách siêu thị có sản phẩm màu " + sessions[sessionId].colorname.toUpperCase() + " tại " + districtName + "," + provinceName + "<br />";
                                                                            questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> màu " + sessions[sessionId].colorname.toUpperCase() + " tại " + districtName + "," + provinceName;
                                                                        }
                                                                        else {
                                                                            //resultanswer += "<br />Danh sách siêu thị có sản phẩm có hàng tại " + districtName + "," + provinceName + "<br />";
                                                                            questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> tại " + districtName + "," + provinceName;
                                                                        }

                                                                        var type = "template";


                                                                        var jsonmessageStore = {
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

                                                                        var length = result.GetStoreInStock2016Result.StoreBO.length;

                                                                        for (var i = 0; i < result.GetStoreInStock2016Result.StoreBO.length; i++) {
                                                                            var storeBO = result.GetStoreInStock2016Result.StoreBO[i];
                                                                            if (storeBO.webAddressField && storeBO.webAddressField != "undefined") {
                                                                                // resultanswer += (i + 1) + ". " + storeBO.webAddressField + "<br />";
                                                                                // resultanswer += " https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + "<br />";


                                                                                jsonmessageStore.messagecontentobject.elements[0].buttons.push({
                                                                                    type: "web_url",
                                                                                    title: (i + 1) + ". " + storeBO.webAddressField,
                                                                                    url: "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField
                                                                                });

                                                                            }

                                                                        }
                                                                        //  var bodystring = JSON.parse(jsonmessageStore);
                                                                        var bodyjson = JSON.stringify(jsonmessageStore);


                                                                        //console.log("===============BUTTON URL STORE===================");
                                                                        //console.log(bodyjson);



                                                                        SentToClientButton(sender, bodyjson, intent)
                                                                            .catch(console.error);

                                                                        //SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        //    .catch(console.error);
                                                                        // resultanswer = "";
                                                                        //nếu có hỏi màu, gợi ý thêm danh sách màu
                                                                        //không hỏi thì kệ nó :v
                                                                        //if (color) {



                                                                        if (sessions[sessionId].isPreAskColor) {//nếu câu trước đã answer color rồi thì không đưa lại ds color nữa
                                                                            resultanswer = "";
                                                                            setTimeout(() => {
                                                                                SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                                    .catch(console.error);
                                                                            }, 1500);

                                                                        }
                                                                        else {
                                                                            resultanswer += "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm để xem danh sách cửa hàng còn hàng!";
                                                                            SendToUserListColor(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);
                                                                            return;
                                                                        }



                                                                        //}//end if color
                                                                        //else {
                                                                        //resultanswer = "Vui lòng chọn màu sắc "+sessions[sessionId].gender+"  quan tâm để xem danh sách cửa hàng còn hàng!"
                                                                        //}

                                                                    }//end if(result)
                                                                    else {
                                                                        //sessions[sessionId].province = null;
                                                                        //sessions[sessionId].district = null;

                                                                        if (color && hasNumber(color)) {


                                                                            resultanswer = "Rất tiếc. Sản phẩm có màu " + sessions[sessionId].colorname.toUpperCase() + " đã <span style='color:red'>HẾT HÀNG</span> tại khu vực của " + sessions[sessionId].gender + " ! Vui lòng chọn lại."

                                                                            //đưa ra ôption

                                                                            SentToClient(sender, resultanswer, questionTitle, 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                                .catch(console.error);

                                                                            resultanswer = "";
                                                                            //suggest khu vực


                                                                            //===================================================================



                                                                            //reset color
                                                                            //sessions[sessionId].color = null;
                                                                            //sessions[sessionId].colorname = null;


                                                                        }
                                                                        else {
                                                                            resultanswer = "Rất tiếc. Sản phẩm đã <span style='color:red;font-weight:bold'>HẾT HÀNG</span> tại khu vực " + districtName + " của " + sessions[sessionId].gender + " ! Vui lòng chọn lại khu vực lân cận.";

                                                                            //suggest khu vực
                                                                            var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
                                                                            //=======================================================================

                                                                            SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);

                                                                            //=======================================================================


                                                                        }

                                                                    }

                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        .catch(console.error);

                                                                });//end APICheckInStock
                                                            }
                                                            else {//nếu ra quá nhiều thì suggest ra quận huyện nào thành phố đó (3 kết quả tối đa)

                                                                resultanswer = "";
                                                                resultanswer += "Ý " + sessions[sessionId].gender + "  LÀ GÌ ?<br /> ";


                                                                var type = "template";
                                                                questionTitle = "Ý " + sessions[sessionId].gender + "  có phải là ?";
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

                                                                for (var i = 0; i < result.length; i++) {//lấy tối đa 6
                                                                    if (i > 5) break;
                                                                    var resultEach = result[i]._source;
                                                                    jsonmessageDistrict.messagecontentobject.elements[0].buttons.push({
                                                                        type: "postback",
                                                                        title: resultEach.districtName,
                                                                        payload: resultEach.districtID
                                                                    });

                                                                }

                                                                var bodyjson = JSON.stringify(jsonmessageDistrict);

                                                                //console.log(bodyjson);
                                                                SentToClientButton(sender, bodyjson, intent)
                                                                    .catch(console.error);
                                                            }

                                                        }
                                                        else {//trường hợp này có thể là tỉnh/thành phố một đằng (ID) mà huyện/quận lại một nẻo

                                                            //Dùng elastic, search theo đơn vị nhỏ nhất là quận/huyện (không theo province ID), Suggest ra tầm 3 kết quả 

                                                            var index1 = "locationdata";
                                                            var type1 = "district";
                                                            getElasticSearch(el, index1, type1, province, function callbackEL(err, result) {
                                                                if (err) return err;
                                                                //console.log(result);
                                                                if (result.length != 0) {//address được tìm thấy
                                                                    var provinceID = result[0]._source.provinceID;
                                                                    var districtName = result[0]._source.districtName;
                                                                    sessions[sessionId].province = districtName.split(",");
                                                                    sessions[sessionId].provinveID = provinceID;


                                                                    resultanswer = "";
                                                                    resultanswer += "CÓ PHẢI Ý " + sessions[sessionId].gender + "  LÀ CÁC ĐỊA CHỈ DƯỚI ĐÂY KHÔNG ?<br /> ";


                                                                    var type = "template";
                                                                    questionTitle = "Ý " + sessions[sessionId].gender + "  là ?";
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

                                                                    for (var i = 0; i < result.length; i++) {//lấy tối đa 6
                                                                        if (i > 5) break;
                                                                        var resultEach = result[i]._source;
                                                                        jsonmessageDistrict.messagecontentobject.elements[0].buttons.push({
                                                                            type: "postback",
                                                                            title: resultEach.districtName,
                                                                            payload: resultEach.districtID
                                                                        });

                                                                    }
                                                                    var bodyjson = JSON.stringify(jsonmessageDistrict);

                                                                    //console.log(bodyjson);
                                                                    SentToClientButton(sender, bodyjson, intent)
                                                                        .catch(console.error);
                                                                }

                                                                else {

                                                                    SentToClient(sender, "" + sessions[sessionId].gender + "  đang ở Tỉnh/Thành phố nào ạ? (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        .catch(console.error);
                                                                }



                                                            });//end getElasticSearch


                                                            sessions[sessionId].district = null;
                                                            //sessions[sessionId].province = null;


                                                            //fbMessage(sender, "Không nhận diện được địa chỉ. Vui lòng cung cấp tỉnh/thành phố trước (VIẾT HOA CHỮ ĐẦU), ví dụ: Hồ Chí Minh, Hà Nội, Phú Yên...", questionTitle, button_payload_state, intent)
                                                            //    .catch(console.error);

                                                        }

                                                    });//end getElasticSearchDistrictAndProvince

                                                    //suggest thêm màu để chọn                                        

                                                }//end if(product && province)
                                                else if (!province && district)//khong có tỉnh, chỉ có huyện/quận
                                                {
                                                    resultanswer = "<br />" + sessions[sessionId].gender + "  đang ở Tỉnh/Thành phố nào ạ? Vui lòng cung cấp tỉnh/thành phố trước (VIẾT HOA CHỮ ĐẦU), ví dụ: Hồ Chí Minh, Hà Nội, Phú Yên...";
                                                }
                                                else {//chỉ có product

                                                    resultanswer += "<br />Vui lòng cung cấp tên tỉnh/thành phố để xem siêu thị có hàng (VIẾT HOA CHỮ ĐẦU) Ví dụ: Hồ Chí Minh, Phú Yên, Cần Thơ...";

                                                }

                                                // console.log("Sản phẩm hỏi: " + productName);
                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                    .catch(console.error);
                                            }

                                        });
                                    }

                                    else {
                                        resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG KINH DOANH</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                    }



                                });


                                ////============================================================================================
                                ////gợi ý thêm 3 sản phẩm liên quan

                                //questionTitle = "Danh sách sản phẩm liên quan !";

                                //var type = "template";

                                //var jsonmessageDistrict = '{' +
                                //    '"recipient":' + '{' + '"id":' +
                                //    '"' + sender + '"' +
                                //    '},' +
                                //    '"message":' + '{' +
                                //    '"attachment":' + '{' +
                                //    '"type":' + '"' + type + '"' + ',' +
                                //    '"payload":' + '{' +
                                //    '"template_type":"generic"' + ',' +
                                //    '"elements":' + '[' +
                                //    '{' +
                                //    '"title":' + '"' + questionTitle + '"' + ',' +
                                //    '"buttons":' + '[';

                                //for (var i = 0; i < result.length; i++) {//lấy tối đa 6
                                //    if (i > 2) break;
                                //    var resultEach = result[i]._source;
                                //    if (i == 2 || i == result.length - 1) {

                                //        jsonmessageDistrict += '{' +
                                //            '"type":"postback"' + ',' +
                                //            '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                //            '"payload":' + '"' + resultEach.districtID + '"' + '}';

                                //    }
                                //    else {
                                //        jsonmessageDistrict += '{' +
                                //            '"type":"postback"' + ',' +
                                //            '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                //            '"payload":' + '"' + resultEach.districtID + '"' + '}' + ',';



                                //    }

                                //}
                                //jsonmessageDistrict +=
                                //    ']' +
                                //    '}' +
                                //    ']' +
                                //    '}' +
                                //    '}' +
                                //    '}' +
                                //    '}';

                                //var bodystring = JSON.parse(jsonmessageDistrict);

                                //var bodyjson = JSON.stringify(bodystring);

                                ////console.log(bodyjson);
                                //fbMessagebutton(sender, bodyjson)
                                //    .catch(console.error);
                                ////============================================================================================
                            }

                            else {
                                var rn = randomNumber(productnotfound.length);
                                resultanswer = productnotfound[rn];

                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                    .catch(console.error);

                            }

                        });
                    }

                }//end if (sessions[sessionId].product)

                else {
                    var rn = randomNumber(unknowproduct.length);
                    resultanswer = unknowproduct[rn];
                }

            }


            else {
                sessions[sessionId].isLatestAskNormalInstallment = false;
                if (intent === "greet") {
                }
                else {
                    resultanswer = "Em chưa rõ câu hỏi của " + sessions[sessionId].gender + "  lắm. " + sessions[sessionId].gender + "  vui lòng cung cấp rõ thông tin cần hỏi như: tên sản phẩm, giá cả, địa chỉ...Cảm ơn " + sessions[sessionId].gender + " ";
                }
            }


        }

        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
            .catch(console.error);
        //console.log(resultanswer);
    });

};

const responsepostbackgreet = (sender, sessionId, button_payload_state, replyobject, siteid) => {

    var resultanswer = ""
    var questionTitle = "";
    if (button_payload_state === "1") {
        questionTitle = "Hỏi thông tin sản phẩm"
        if (sessions[sessionId].product && sessions[sessionId].prev_intent != "ask_instalment") {
            var sever = severRasaQuery;
            var url = encodeURI(sever);
            sessions[sessionId].prev_intent = "ask_stock";
            getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
            return;
        }
        resultanswer = "" + sessions[sessionId].gender + "  muốn hỏi thông tin sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_stock";
    }
    else if (button_payload_state === "2") {
        questionTitle = "Hỏi giá sản phẩm"
        if (sessions[sessionId].product) {
            var sever = severRasaQuery;
            var url = encodeURI(sever);
            sessions[sessionId].prev_intent = "ask_price";
            getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
            return;
        }
        resultanswer = "" + sessions[sessionId].gender + "  muốn hỏi giá sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_price";
    }
    else if (button_payload_state === "3") {
        questionTitle = "Hỏi khuyến mãi sản phẩm"
        if (sessions[sessionId].product) {
            var sever = severRasaQuery;
            var url = encodeURI(sever);
            sessions[sessionId].prev_intent = "ask_promotion";
            getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
            return;
        }
        resultanswer = "" + sessions[sessionId].gender + "  muốn xem khuyến mãi của sản phẩm nào ạ?"

        sessions[sessionId].prev_intent = "ask_promotion";
    }
    else if (button_payload_state === "4") {

        sessions[sessionId].prev_intent = "ask_instalment";
        var sever = severRasaQuery;
        var url = encodeURI(sever);

        getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
        return;

    }


    SentToClient(sender, resultanswer, questionTitle, parseInt(button_payload_state), "", replyobject, siteid)
        .catch(console.error);


};


const responsepostbackothers = (sender, sessionId, othersID, replyobject, siteid) => {

    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = othersID;


    getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);


};

const responsepostbackcolor = (sender, sessionId, productCode, colorname, replyobject, siteid) => {

    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = productCode;

    sessions[sessionId].colorname = colorname;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
};
const responsepostbackFeedback = (sender, sessionId, feedback, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = feedback;


    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);

};
const responsepostbackfinancialcompany = (sender, sessionId, company, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = company;


    getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
}
const responseRepeatChooseFinancialCompany = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    questionTitle = "Mời " + sessions[sessionId].gender + " lựa chọn công ty tài chính cho vay để xem gói trả góp tương ứng!";

    if (sessions[sessionId].product && sessions[sessionId].productID) {//th bị reset đột ngột mất session
        var jsonbuttonFinancialCompany = getButtonFinancialCompany(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle);
        //console.log(jsonbuttonFinancialCompany);
        sessions[sessionId].isLatestAskCompanyForNormalInstalment = false;

        SentToClientButton(sender, jsonbuttonFinancialCompany, "ask_instalment")
            .catch(console.error);
    }
    else {
        var rn = randomNumber(unknowproduct.length);
        var resultanswer = unknowproduct[rn];
        if (!resultanswer) {//trường hợp chưa load xong file từ data
            resultanswer = "Không hiểu sản phẩm " + sessions[sessionId].gender + "  đang muốn hỏi là gì?";
        }

        SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment", replyobject, siteid)
            .catch(console.error);

    }



}
const responseRepeatChooseFinancialCompany_NormalInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    questionTitle = "Mời " + sessions[sessionId].gender + " lựa chọn công ty tài chính cho vay để xem gói trả góp tương ứng!";

    if (sessions[sessionId].product && sessions[sessionId].productID) {//th bị reset đột ngột mất session
        var jsonbuttonFinancialCompany = getButtonFinancialCompany(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle);
        //console.log(jsonbuttonFinancialCompany);

        //session phân biệt đang chọn company cho gói trả góp thường
        sessions[sessionId].isLatestAskCompanyForNormalInstalment = true;

        SentToClientButton(sender, jsonbuttonFinancialCompany, "ask_instalment")
            .catch(console.error);
    }
    else {
        var rn = randomNumber(unknowproduct.length);
        var resultanswer = unknowproduct[rn];
        if (!resultanswer) {//trường hợp chưa load xong file từ data
            resultanswer = "Không hiểu sản phẩm " + sessions[sessionId].gender + "  đang muốn hỏi là gì?";
        }

        SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment", replyobject, siteid)
            .catch(console.error);

    }
}
const responsePackage0d = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = button_payload_state;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}
const responsePackage0PTLS = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);

    var button_payload_state = button_payload_state;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}



const getPercentInstalment = (sender, sessionId, messagecontent, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    try {

        var percent = parseInt(messagecontent);
        console.log(percent);
        console.log(messagecontent);
        if (percent < 10 || percent > 90 || isNaN(percent) || percent % 10 != 0) {
            if (percent === 0 || messagecontent.toLocaleLowerCase().includes("0đ") ||
                messagecontent.toLocaleLowerCase().includes("0 đ") ||
                messagecontent.toLocaleLowerCase().includes("0 đồng") ||
                messagecontent.toLocaleLowerCase().includes("0đồng") ||
                messagecontent.toLocaleLowerCase().includes("0 dong") ||
                messagecontent.toLocaleLowerCase().includes("0dong") ||
                messagecontent.toLocaleLowerCase().includes("0%") ||
                messagecontent.toLocaleLowerCase().includes("0 %")) {//ý là trả góp 0đ
                console.log("====tra gop 0đ: =====", percent);
                getJsonAndAnalyze(url, sender, sessionId, "0", replyobject, siteid);

            }
            else {
                request({
                    url: encodeURI(severRasaQuery + messagecontent),
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                    json: true
                }, function (error, response, body) {
                    var object = JSON.stringify(body);
                    var json = JSON.parse(object);
                    // console.log(json);
                    var entities = json.entities;
                    // console.log(entities);
                    if (entities) {
                        for (var i = 0; i < entities.length; i++) {
                            if (entities[i].entity === "instalment_percent") {
                                try {
                                    percent = parseInt(entities[i].value.replace('_', ' '));
                                    sessions[sessionId].percent_instalment = percent;
                                    getJsonAndAnalyze(url, sender, sessionId, percent, replyobject, siteid);
                                    return;
                                }
                                catch (errr) {
                                    console.log("err when parse Percent_instalment", err);

                                }
                            }
                            if (entities[i].entity === "money_prepaid" || entities[i].entity === "consultant_price") {
                                try {
                                    var moneyPrepaid = parseFloat(entities[i].value);
                                    if (moneyPrepaid < 400000) {
                                        //không hợp lệ số tiền trả trước                           
                                        resultanswer = "Phần trăm trả trước không hợp lệ. Vui lòng chỉ nhập số TRÒN CHỤC và nằm trong khoảng từ 0% đến 80%."
                                        SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
                                            .catch(console.error);
                                        sessions[sessionId].isLatestAskPercentInstalment = false;

                                        return;
                                    }
                                    else {
                                        //sessions[sessionId].money_prepaid = moneyPrepaid;
                                        //console.log("=======so tien tra truoc money_prepaid getPercentInstalment==========", sessions[sessionId].money_prepaid);
                                        getJsonAndAnalyze(url, sender, sessionId, moneyPrepaid, replyobject, siteid);
                                        return;
                                    }


                                }
                                catch (error) {
                                    console.log("err when parse money_prepaid", err);
                                }
                            }
                        }
                    }
                    else {
                        resultanswer = "Phần trăm trả trước không hợp lệ. Vui lòng chỉ nhập số TRÒN CHỤC và nằm trong khoảng từ 0% đến 80%."
                        SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
                            .catch(console.error);
                        sessions[sessionId].isLatestAskPercentInstalment = false;

                        return;
                    }

                });
            }

        }
        else {

            getJsonAndAnalyze(url, sender, sessionId, percent, replyobject, siteid);
        }
    }
    catch (err) {
        console.log(err);
        //bị lỗi khi nhập
        resultanswer = "Phần trăm trả trước không hợp lệ. Vui lòng nhập lại và chỉ nhập số TRÒN CHỤC."
        SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}
const getMonthInstalmentByInputDirect = (sender, sessionId, messagecontent, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    try {
        var month = parseInt(messagecontent);
        console.log("=====MONTH====", month);
        console.log(messagecontent);

        getJsonAndAnalyze(url, sender, sessionId, month, replyobject, siteid);

    }
    catch (err) {
        console.log("ERROR month getMonthInstalmentByInputDirect", err);
        //bị lỗi khi nhập
        resultanswer = "ERROR month getMonthInstalmentByInputDirect."
        SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}

const getMonthInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    try {
        var month = parseInt(button_payload_state.split('|')[0]);
        console.log("==So thang==" + month);

        getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
    }
    catch (err) {
        console.log(err);
        //bị lỗi khi nhập
        resultanswer = "Số tháng không hợp lệ. Có lỗi xảy ra."
        SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}
const sendBriefSupport = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var resultanswer = "<p>Dạ, điều kiện giấy tờ trả góp của công ty tài chính là:</br>\
    1. Đủ 20-60 tuổi</br>\
    2. Giấy tờ CMND không quá 15 năm, rõ hình, chữ</br>\
    <span style='color:red;'>Tùy theo gói trả góp sẽ có thêm yêu cầu giấy tờ:</span>  </br>\
    3. Bằng lái xe (còn thời hạn)</br>\
    4. Sổ hộ khẩu (có tên người trả góp)</br>\
    5. Hóa đơn điện(cáp/nước/internet) có địa chỉ trùng với địa chỉ trên CMND để được hưởng lãi suất tốt nhất "+ sessions[sessionId].gender + " nhé</br></p>";


    SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment+briefsupport", replyobject, siteid)
        .catch(console.error);
    return;
}

const getGIDInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getBLXInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getSHKInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getHDDNInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}

const getBriefIDInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";

    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}

const askPercentMonthAgain = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const processNormalInstallment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = severRasaQuery;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}


function readFiles(dirname, onFileContent) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {

            console.log(err);
            return;
        }
        filenames.forEach(function (filename) {
            fs.readFile(path.join(dirname, filename), { encoding: 'utf8' }, function (err, content) {

                onFileContent(filename, content);
            });
        });

    });
};

var webhookController = {
    index: function (req, res) {

        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === 'rasa-bot') {
            res.send(req.query['hub.challenge']);
        } else {
            res.sendStatus(400);
        }


    },
    postmessage: function (req, res) {
        //thời gian từ 8h-18h hàng ngày
        var hours = new Date().getHours();
        console.log("==========Hour now==========", hours);
        if (hours < 8 || hours > 17) return;


        //load data
        if (!isGetExampleAnswer) {
            readFiles(pathToExample, function (filename, content) {
                isGetExampleAnswer = true;
                //console.log(filename);
                var splitcontent = content.split('\n');
                var fileName = filename.split('.')[0];

                for (var i = 0; i < splitcontent.length; i++) {
                    if (fileName === "greet") {
                        greet.push(splitcontent[i]);
                    }
                    else if (fileName === "offense") {
                        offense.push(splitcontent[i]);
                    }
                    else if (fileName === "ask_name") {
                        ask_name.push(splitcontent[i]);

                    }
                    else if (fileName === "thankyou") {
                        thankyou.push(splitcontent[i]);

                    }
                    else if (fileName === "goodbye") {
                        goodbye.push(splitcontent[i]);

                    }
                    else if (fileName === "unknowproduct") {
                        unknowproduct.push(splitcontent[i]);

                    }
                    else if (fileName === "productnotfound") {
                        productnotfound.push(splitcontent[i]);

                    }
                }

            });
        }
        var messageID = Date.parse(new Date()) + Math.floor((Math.random() * 1000000) + 1);
        var data = (req.body);

        // var data = JSON.parse(JSON.stringify((req.body)));
        console.log("=============DATA POST XUONG======================");
        console.log(data);
        console.log("===================================");
        if (data.replyobject.userType === 'a')//admin, skip qua
        {
            isAdminChat = true;
            tracechat.logChatHistory(data.replyobject.roomId, data, 2, isAdminChat, messageID);//1 là câu hỏi, 2 là câu trả lời
            res.sendStatus(200);
            return;
        }


        const sender = data.username;
        const siteid = data.siteid;

        const fullname = data.fullname;
        const gender = data.gender;
        const sessionId = findOrCreateSession(sender);
        sessions[sessionId].isPreAskColor = false;
        var isAdminChat = false;

        //gender
        if (parseInt(data.replyobject.gender) === 1) {
            sessions[sessionId].gender = "anh";

        }
        else if (parseInt(data.replyobject.gender) === 2) {
            sessions[sessionId].gender = "chị";
        }
        else {
            sessions[sessionId].gender = "bạn";
        }


        var replyobject = data.replyobject;
        //trace chat history
        tracechat.logChatHistory(sender, data, 1, isAdminChat, messageID);//1 là câu hỏi, 2 là câu trả lời

        //


        if (!data.postbackobject.title) {//xu ly message tu user


            // We retrieve the message content
            var messagetype = data.messageobject.type;
            var messagecontent = data.messageobject.content.toLowerCase();
            if (messagecontent.includes("https") || messagecontent.includes("http")) {
                return;
            }
            //console.log(event.message);
            if (messagetype == 2) {
                // We received an attachment
                // Let's reply with an automatic message
                SentToClient(sender, '"+sessions[sessionId].gender+"  đáng yêu quá trời. ', "", "", "", replyobject, siteid)
                    .catch(console.error);
            } else {

                messagecontent = messagecontent.replace("@", " ");
                messagecontent = messagecontent.replace("+", " plus ");
                messagecontent = messagecontent.replace("-", " ");
                messagecontent = messagecontent.replace("o%", "0%");
                messagecontent = messagecontent.replace("o %", "0%");
                messagecontent = messagecontent.replace("sámung", "samsung");
                messagecontent = messagecontent.replace("flush", "plus");
                messagecontent = messagecontent.replace("pluss", "plus ");
                messagecontent = messagecontent.replace("ss", "samsung  ");
                messagecontent = messagecontent.replace("j2pro", "j2 pro  ");
                messagecontent = messagecontent.replace("(", " ");
                messagecontent = messagecontent.replace(")", " ");


                messagecontent = messagecontent.replace(/\n/g, '');
                var button_payload_state = 0;//không có gì, 1: hoi sp, 2: hỏi giá, 3: hỏi km

                if (!messagecontent.includes("nokia") && !messagecontent.includes("inch")) {
                    messagecontent = messagecontent.replace('.', " ");
                    messagecontent = messagecontent.replace(',', " ");
                }

                var sever = severRasaQuery + messagecontent;
                var url = encodeURI(sever);



                if (sessions[sessionId].isLatestAskPercentInstalment) {
                    //console.log("ok");               

                    getPercentInstalment(sender, sessionId, messagecontent, replyobject, siteid);

                }
                // if (sessions[sessionId].isLatestAskMonthInstalment) {
                //     getMonthInstalmentByInputDirect(sender, sessionId, messagecontent, replyobject, siteid);

                // }
                // else if (sessions[sessionId].isLatestAskMonthInstalment) {
                //     getMonthInstalment(sender, sessionId, messagecontent, replyobject, siteid);
                // }
                else {
                    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);


                }


            }
        }
        else//xử lý postback
        {

            // We retrieve the user's current session, or create one if it doesn't exist
            // This is needed for our bot to figure out the conversation history

            var button_payload_state = 0;
            var postbackTitle = "";

            //console.log(event.postback);
            if (data.postbackobject.payload) {
                button_payload_state = data.postbackobject.payload;
                postbackTitle = data.postbackobject.title;

            }

            if (button_payload_state === "1" || button_payload_state === "2" || button_payload_state === "3" || button_payload_state === "4")//greet
            {

                responsepostbackgreet(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state === "8" || button_payload_state === "9") {//2 cty tai chinh   
                responsepostbackfinancialcompany(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state === "10")//chọn lại công ty tài chính
            {
                responseRepeatChooseFinancialCompany(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state.toUpperCase() === "NORMALINSTALMENT_COMPANY") {
                responseRepeatChooseFinancialCompany_NormalInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state.toUpperCase() === "INSTALMENT_PACKAGE0D") {
                responsePackage0d(sender, sessionId, button_payload_state, replyobject, siteid);

            }
            else if (button_payload_state.toUpperCase() === "INSTALMENT_0PTLS") {
                responsePackage0PTLS(sender, sessionId, button_payload_state, replyobject, siteid);

            }

            else if (button_payload_state === "11")//muốn xem gói trả góp thương của sp đó
            {
                processNormalInstallment(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state === "12" || button_payload_state === "13")//có.không
            {
                if (sessions[sessionId].isLatestAskGID)//trước đó là câu hỏi CMND
                {
                    getGIDInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
                }
                else if (sessions[sessionId].isLatestAskBLX) {
                    getBLXInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
                }
                else if (sessions[sessionId].isLatestAskSHK) {
                    getSHKInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
                }
                else if (sessions[sessionId].isLatestAskHDDN) {
                    getHDDNInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
                }


            }
            else if (button_payload_state === "14" || button_payload_state === "15")//hỏi lại % trả trước || số tháng
            {
                askPercentMonthAgain(sender, sessionId, button_payload_state, replyobject, siteid);
            }
            else if (button_payload_state.includes("BID")) {

                getBriefIDInstalment(sender, sessionId, button_payload_state, replyobject, siteid);

            }
            else if (button_payload_state.includes("MONTH")) {

                getMonthInstalment(sender, sessionId, button_payload_state, replyobject, siteid);

            }
            else if (button_payload_state.includes("BRIEFSUPPORT")) {

                sendBriefSupport(sender, sessionId, button_payload_state, replyobject, siteid);

            }


            else {//quận/huyện select hoặc select color


                if (button_payload_state.length >= 10)//nếu ID lớn hơn 10 chữ số (vì nó là productCode)
                {


                    var productCode = button_payload_state;

                    responsepostbackcolor(sender, sessionId, productCode, postbackTitle, replyobject, siteid);

                }
                else if (button_payload_state === "BAD" || button_payload_state === "GOOD" || button_payload_state === "NORMAL") {
                    var feedback = button_payload_state;
                    responsepostbackFeedback(sender, sessionId, feedback, replyobject, siteid);
                }
                else {


                    var others = parseInt(button_payload_state);

                    responsepostbackothers(sender, sessionId, others, replyobject, siteid);

                }
            }



        }

        res.sendStatus(200);

    },
    processsubmit: function (req, res) {//xử lý message accept or deny from admin
        //console.log("==============Nhan message admin ========");
        //  console.log(req.body);
        var obj = req.body;

        var result = tracechat.editMessage(obj.roomId, obj.messageID, obj.isaccepted, obj);//1 là câu hỏi, 2 là câu trả lời

        setTimeout(() => {
            if (result) { res.sendStatus(200); }
            else {

                res.sendStatus(500);
            }

        }, 100);


    }
};

module.exports = webhookController;

