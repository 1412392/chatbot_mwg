//import { read } from 'fs';

var tracechat = require('../helpers/index');
var fetch = require('node-fetch');
var request = require("request")
var path = require('path');
var elasticsearch = require('elasticsearch');
var soap = require('soap');
var fs = require('fs');

var FB_PAGE_TOKEN = 'EAAdDXpuJZCS8BAHrQmdaKGOUC51GPjtXwZBXlX6ZCN4OuGNssuky7ffyNwciAmicecV7IfX0rOfsFNUwZCMnZATJxWpkK0aFmj2XUuhacR8XA1sWsFiGasBtBcAOgon0BQqeP8RDCm6VQR9V9Ygxow0EvBwbhrHjwViGHDQ77dIkfkY3XDhzv';

var FB_APP_SECRET = '2ee14b4e3ccc367b37fce196af51ae09';
var severRasaQuery = "http://localhost:5000/parse?q=";

var severResponse = "https://fe70b148.ngrok.io/chatbot";

// var severResponse = "http://rtm.thegioididong.com/chatbot";

var urlApiProduct = "http://api.thegioididong.com/ProductSvc.svc?singleWsdl";
var urlApiCategory = "http://api.thegioididong.com/CategorySvc.svc?singleWsdl";
var urlwcfProduct = "http://webservice.thegioididong.com/ProductSvc.asmx?wsdl";
var provinceDefault = 3;
var pagesizedefault = 10;
var pageIndexDefault = 0;

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


const SentToClientButton = (id, text) => {
    //console.log("============SentToClientButton===============");
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

    tracechat.logChatHistory(id, contentlogs, 2);//1 là câu hỏi, 2 là câu trả lời

    //console.log(text);
    return fetch(severResponse, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: text,
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


    // console.log("===============================================");

    var body = "";

    if (state === 0)//câu hỏi do user send, không phải từ postback
    {
        if (intent == "greet") {
            body = JSON.stringify({
                username: id,
                siteid: siteid,
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
                                {
                                    type: "postback",
                                    title: "Xem tồn kho sản phẩm",
                                    payload: "1"
                                },
                                {
                                    type: "postback",
                                    title: "Xem giá sản phẩm",
                                    payload: "2"
                                },
                                {
                                    type: "postback",
                                    title: "Xem khuyễn mãi sản phẩm",
                                    payload: "3"
                                },
                                {
                                    type: "postback",
                                    title: "Thông tin trả góp",
                                    payload: "4"
                                }
                            ]
                        }
                    ]

                }
            });
            var contentlogs = "<p>" + text + "</p>";
            contentlogs += "<button " + "type=button>" + "Xem tồn kho sản phẩm" + "</button>" + "<br />";
            contentlogs += "<button " + "type=button>" + "Xem giá sản phẩm" + "</button>" + "<br />";
            contentlogs += "<button " + "type=button>" + "Xem khuyễn mãi sản phẩm" + "</button>" + "<br />";
            //contentlogs += "<button " + "type=button>" + "Thông tin trả góp" + "</button>" + "<br />";

            tracechat.logChatHistory(id, contentlogs, 2);//1 là câu hỏi, 2 là câu trả lời

        }
        else if (intent == "option_whenoutcolorstock") {
            body = JSON.stringify({
                username: id,
                siteid: siteid,
                messagetype: "template",
                replyobject: replyobject,
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

            tracechat.logChatHistory(id, contentlogs, 2);//1 là câu hỏi, 2 là câu trả lời

        }
        else {
            body = JSON.stringify({
                username: id,
                siteid: siteid,
                replyobject: replyobject,
                messagetype: "text",
                messagecontentobject: text
            });

            tracechat.logChatHistory(id, text, 2);//1 là câu hỏi, 2 là câu trả lời

        }

    }
    else {
        body = JSON.stringify({
            username: id,
            siteid: siteid,
            replyobject: replyobject,
            messagetype: "text",
            messagecontentobject: text
        });
        tracechat.logChatHistory(id, text, 2);//1 là câu hỏi, 2 là câu trả lời

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

function SendToUserListColor(productID, productName, sender, siteid, replyobject, questionTitle) {
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

            //resultanswer += "<br />CHỌN MÀU SẮC BẠN QUAN TÂM CHO SẢN PHẨM ĐỂ KIỂM TRA CHÍNH XÁC HƠN? ";

            var type = "template";
            questionTitle = "Danh sách màu sắc";

            var jsoncolortemplate = '{' +
                '"username":' + '"' + sender + '"' + ',' +
                '"siteid":' + '"' + siteid + '"' + ',' +
                '"messagetype":"template"' + ',' +
                '"replyobject":' + '{' +
                '"username":' + '"' + replyobject.username + '"' + ',' +
                '"message":' + '"' + replyobject.message + '"' + ',' +
                '"fullname":' + '"' + replyobject.fullname + '"' + ',' +
                '"currenturl":' + '"' + replyobject.currenturl + '"' + ',' +
                '"sentAt":' + replyobject.sentAt + ',' +
                '"userType":' + '"' + replyobject.userType + '"' + ',' +
                '"gender":' + replyobject.gender + ',' +
                '"roomId":' + '"' + replyobject.roomId + '"' + ',' +
                '"msgid":' + '"' + replyobject.msgid + '"' + ',' +
                '"isbot":' + replyobject.isbot +
                '}' + ',' +
                '"messagecontentobject":' + '{' +
                '"elements":' + '[' +
                '{' +
                '"title":' + '"' + questionTitle + '"' + ',' +
                '"buttons":' + '[';


            for (var i = 0; i < length; i++) {
                var colorBo = result.GetProductColorByProductIDLangResult.ProductColorBO[i];
                //console.log(colorBo);                                                                           
                if (i == (length - 1)) {
                    jsoncolortemplate += '{' +
                        '"type":"postback"' + ',' +
                        '"title":' + '"' + colorBo.ColorName + '"' + ',' +
                        '"payload":' + '"' + colorBo.ProductCode + '"' + '}';


                }
                else {
                    jsoncolortemplate += '{' +


                        '"type":"postback"' + ',' +
                        '"title":' + '"' + colorBo.ColorName + '"' + ',' +
                        '"payload":' + '"' + colorBo.ProductCode + '"' + '}' + ',';

                }
            }
            jsoncolortemplate +=
                ']' +
                '}' + ']' + '}' + '}';

            var bodystring = JSON.parse(jsoncolortemplate);
            var bodyjson = JSON.stringify(bodystring);

            // console.log(bodyjson);
            //xóa màu cũ đi
            sessions[sessionId].color = null;
            sessions[sessionId].colorname = null;

            setTimeout(() => {
                SentToClientButton(sender, bodyjson)
                    .catch(console.error);
            }, 1500);

        });//end APIGetProductColor
    }
}

function SendToUserListDistrict(productID, provinceID, sender, siteid, replyobject, questionTitle) {



    if (provinceID) {

        var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
        APIGetDistrictByProvince(urlApiCategory, argsDistrictByProvince, function getResult(result) {
            //console.log(result.GetDistricByProvinceResult.DistrictBO[0]);
            var length = result.GetDistricByProvinceResult.DistrictBO.length;
            var arrDistrictBO = result.GetDistricByProvinceResult.DistrictBO;
            resultanswer = "";
            //resultanswer += "<br />CHỌN QUẬN/HUYỆN CỦA BẠN ĐỂ KIỂM TRA CHÍNH XÁC HƠN? ";

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


                    SentToClientButton(sender, bodyjson)
                        .catch(console.error);
                }

            }, 2000);


        });
    }

}

const fbEvaluate = (id, replyobject, siteid) => {

    var body = JSON.stringify({
        username: id,
        siteid: siteid,
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

    tracechat.logChatHistory(id, contentlogs, 2);//1 là câu hỏi, 2 là câu trả lời


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

const AnotherOptionInstalment = (sender, siteid, replyobject, questionTitle) => {
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
                                title: "Chọn lại công ty tài chính",
                                payload: 10
                            },
                            {
                                type: "postback",
                                title: "Xem gói trả góp thường",
                                payload: 11
                            }

                        ]
                    }
                ]
            }
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
                            }
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
            console.log(productSearch);
            if (productSearch) {
                if (productSearch.GetZeroInstallmentByProductResult.ID) {
                    var fromDate = Date.parse(productSearch.GetZeroInstallmentByProductResult.FromDate);
                    var toDate = Date.parse(productSearch.GetZeroInstallmentByProductResult.ToDate);
                    var nowDate = Date.parse(new Date());
                    console.log(fromDate)

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
    soap.createClient(url, function (err, client) {

        client.GetFeatureInstallment(args, function (err, result) {

            var package = JSON.parse(JSON.stringify(result));
            fn(package);

        });

    });
}

function APIGetNormalInstallment(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetListNormalInstallment(args, function (err, result) {

            var packages = JSON.parse(JSON.stringify(result));

            fn(packages);

        });

    });
}

function APIGetInstallmentResult(url, args, fn) {
    soap.createClient(url, function (err, client) {

        client.GetInstallmentResult(args, function (err, result) {

            var package = JSON.parse(JSON.stringify(result));
            fn(package);
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
        var a = "";

        //xác định entities
        if (entities == null || entities.length == 0) {
            // sessions[sessionId].product=null;

            if (sessions[sessionId].isLatestAskPercentInstalment) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var percent = parseInt(button_payload_state);
                sessions[sessionId].percent_instalment = percent;
            }
            else if (sessions[sessionId].isLatestAskMonthInstalment) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var month = parseInt(button_payload_state);
                sessions[sessionId].month_instalment = month;
            }
            else if (sessions[sessionId].isLatestAskGID) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var GIDoption = parseInt(button_payload_state);
                sessions[sessionId].GID_instalment = GIDoption === 12 ? 1 : 0;
                //nếu không có CMND =>kết thúc,reset
                if (sessions[sessionId].GID_instalment === 0) {

                    sessions[sessionId].GID_instalment = null;
                    sessions[sessionId].isLatestAskGID = false;
                    sessions[sessionId].isAskedGID = false;

                    SentToClient(sender, "Rất tiếc. Nếu bạn không có CMND thì bạn không thể thực hiện thủ tục mua hàng trả góp được. Xin lỗi vì sự bất tiện này.", questionTitle, button_payload_state, "", replyobject, siteid)
                        .catch(console.error);
                    return;
                }
            }
            else if (sessions[sessionId].isLatestAskBLX) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var BLXoption = parseInt(button_payload_state);
                sessions[sessionId].BLX_instalment = BLXoption === 12 ? 1 : 0;
            }
            else if (sessions[sessionId].isLatestAskSHK) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var SHKoption = parseInt(button_payload_state);
                sessions[sessionId].SHK_instalment = SHKoption === 12 ? 1 : 0;
            }
            else if (sessions[sessionId].isLatestAskHDDN) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var HDDNoption = parseInt(button_payload_state);
                sessions[sessionId].HDDN_instalment = HDDNoption === 12 ? 1 : 0;
            }
            else if (sessions[sessionId].isLatestAskMonthInstalment) {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                var month = parseInt(button_payload_state.split('|')[0]);
                sessions[sessionId].month_instalment = month;
            }
            else if (button_payload_state === 4)//hỏi trả góp ngay lúc đầu
            {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";


            }
            else if (button_payload_state === 11)//hỏi trả góp thường
            {
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                sessions[sessionId].isAskedPercentInstalment = null;
                sessions[sessionId].percent_instalment = null;

                sessions[sessionId].isAskedMonthInstalment = null;
                sessions[sessionId].month_instalment = null;
                sessions[sessionId].isLatestAskNormalInstallment = true;


            }
            else if (button_payload_state === 14) {//hỏi lại %
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                sessions[sessionId].isAskedPercentInstalment = null;
                sessions[sessionId].percent_instalment = null;

                sessions[sessionId].isAskedMonthInstalment = null;
                sessions[sessionId].month_instalment = null;
            }
            else if (button_payload_state === 15) {//hỏi lại so thang
                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
                sessions[sessionId].isAskedMonthInstalment = null;
                sessions[sessionId].month_instalment = null;
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
                    questionTitle = "Vui lòng chọn màu sắc bạn quan tâm";

                    //console.log(sessions[sessionId].productID);
                    SendToUserListColor(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle);

                    return;
                }
                else if (button_payload_state === 7)//gợi ý lại danh sách quận huyện (đã có product, province)
                {
                    questionTitle = "Chọn quận/huyện nơi bạn ở";
                    SendToUserListDistrict(sessions[sessionId].productID, sessions[sessionId].provinveID, sender, siteid, replyobject, questionTitle);
                    return;
                }
                else if (button_payload_state === 8 || button_payload_state === 9)//cong ty tai chinh
                {
                    sessions[sessionId].financialCompany = button_payload_state;
                }

                else if (button_payload_state === "NORMAL" || button_payload_state === "BAD" || button_payload_state === "GOOD") {
                    SentToClient(sender, "Cảm ơn bạn đã đánh giá. Rất vui được phục vụ bạn.", questionTitle, button_payload_state, "", replyobject, siteid)
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

            for (var i = 0; i < entities.length; i++) {

                sessions[sessionId].currentvalue = entities[i].value;
                if (entities[i].entity === "product") {
                    if (entities[i].value.includes("cường lực")) {
                        entities[i].value = entities[i].value.replace("cường lực", "màn hình");
                    }
                    sessions[sessionId].product = entities[i].value;
                }
                if (entities[i].entity === "color") {
                    sessions[sessionId].color = entities[i].value;
                }
                if (entities[i].entity === "price") {
                    sessions[sessionId].price = entities[i].value;
                }
                if (entities[i].entity === "province") {

                    //nếu có tỉnh mới, reset lại huyện

                    if (sessions[sessionId].province)
                        sessions[sessionId].district = null;

                    sessions[sessionId].province = entities[i].value;

                }
                if (entities[i].entity === "district") {
                    sessions[sessionId].district = entities[i].value;

                }

            }
        }



        if ((intent === null || intent === "") && ((!sessions[sessionId].product) && (!sessions[sessionId].province) && (!sessions[sessionId].district))) {
            //nếu đã có trong session

            questionTitle = "Xin chào!";
            resultanswer = "Mình là BOT. Mình chưa rõ câu hỏi của bạn lắm. Vui lòng chọn thông tin cần quan tâm!";


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
            if (intent === null || intent === "") {
                if (sessions[sessionId].prev_intent)//nếu trước đó đã hỏi
                {
                    intent = sessions[sessionId].prev_intent;
                }
            }


            if (intent === "greet") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                if (customer_question.toLowerCase() === "chào bạn" && (sessions[sessionId].prev_intent === "ask_price" || sessions[sessionId].prev_intent === "ask_stock"
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

                if (sessions[sessionId].prev_intent === "ask_promotion" && intent != "ask_promotion") {//nếu đã hỏi khuyễn mãi trước mà hiện tại câu này không còn hỏi km nữa thì reset
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

                    if (keyword.toLowerCase().includes("ốp lưng") ||
                        keyword.toLowerCase().includes("op lung") ||
                        keyword.toLowerCase().includes("tai nghe") ||
                        keyword.toLowerCase().includes("pin") ||
                        keyword.toLowerCase().includes("sạc") ||
                        keyword.toLowerCase().includes("sac") ||
                        keyword.toLowerCase().includes("bàn phím") ||
                        keyword.toLowerCase().includes("ban phim") ||
                        keyword.toLowerCase().includes("loa") ||
                        keyword.toLowerCase().includes("thẻ nhớ") ||
                        keyword.toLowerCase().includes("the nho") ||
                        keyword.toLowerCase().includes("usb") ||
                        keyword.toLowerCase().includes("đồng hồ") ||
                        keyword.toLowerCase().includes("dong ho") ||
                        keyword.toLowerCase().includes("gậy") ||
                        keyword.toLowerCase().includes("dán màn hình") ||
                        keyword.toLowerCase().includes("cường lực") ||
                        keyword.toLowerCase().includes("tai phone") ||
                        keyword.toLowerCase().includes("gay tu suong"))//search phụ kiện
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
                                            resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";


                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";


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
            else if (intent === "ask_instalment" || sessions[sessionId].prev_intent === "ask_instalment") {

                questionTitle = "Thông tin trả góp!";
                if (/*!sessions[sessionId].financialCompany ||*/ sessions[sessionId].prev_intent != "ask_instalment") {
                    resultanswer += "<p style='color:red;font-style: italic;'>Để mua hàng trả góp, tuổi của bạn phải lớn hớn 20 và nhỏ hơn 60, và bắt buộc phải có CMND chính chủ.Lưu ý tất cả các giấy tờ phải còn hạn sử dụng. Chấp nhận bản photo phải có CÔNG CHỨNG không quá 6 tháng.</p>";
                }
                else {
                    resultanswer = "";
                }
                if (!sessions[sessionId].product) {

                    resultanswer += "Bạn muốn hỏi thông tin trả góp cho sản phẩm nào ạ?";

                }
                else {
                    //check sản phẩm có hỗ trợ trả góp hay không
                    var productID = sessions[sessionId].product;
                    var productName = sessions[sessionId].product;
                    console.log(productName);
                    var keyword = productName;
                    var argsSearchProduct = "";

                    if (keyword.toLowerCase().includes("ốp lưng") ||
                        keyword.toLowerCase().includes("op lung") ||
                        keyword.toLowerCase().includes("tai nghe") ||
                        keyword.toLowerCase().includes("pin") ||
                        keyword.toLowerCase().includes("sạc") ||
                        keyword.toLowerCase().includes("sac") ||
                        keyword.toLowerCase().includes("bàn phím") ||
                        keyword.toLowerCase().includes("ban phim") ||
                        keyword.toLowerCase().includes("loa") ||
                        keyword.toLowerCase().includes("thẻ nhớ") ||
                        keyword.toLowerCase().includes("the nho") ||
                        keyword.toLowerCase().includes("usb") ||
                        keyword.toLowerCase().includes("đồng hồ") ||
                        keyword.toLowerCase().includes("dong ho") ||
                        keyword.toLowerCase().includes("gậy") ||
                        keyword.toLowerCase().includes("dán màn hình") ||
                        keyword.toLowerCase().includes("cường lực") ||
                        keyword.toLowerCase().includes("tai phone") ||
                        keyword.toLowerCase().includes("gay tu suong"))//search phụ kiện
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

                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 1) || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";


                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";

                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
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
                                                    if (result && !sessions[sessionId].isLatestAskNormalInstallment) {
                                                        resultanswer += "<br />Sản phẩm " + productName + " hiện đang có gói <span style='color:green'>trả góp 0%</span>. (<span style='color:green'>trả góp 0%</span> là gói trả góp đặc biệt rất hấp dẫn, không phải chịu bất kỳ lãi suất nào từ công ty cho vay). </br> ";
                                                        //send ds ctytc
                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                            .catch(console.error);

                                                        if (!sessions[sessionId].financialCompany) {
                                                            questionTitle = "Mời lựa chọn công ty tài chính cho vay để xem gói trả góp tương ứng!";
                                                            var jsonbuttonFinancialCompany = getButtonFinancialCompany(productID, productName, sender, siteid, replyobject, questionTitle);
                                                            //console.log(jsonbuttonFinancialCompany);

                                                            setTimeout(() => {
                                                                SentToClientButton(sender, jsonbuttonFinancialCompany)
                                                                    .catch(console.error);

                                                            }, 1000);
                                                        }
                                                        else {
                                                            var argGetZeroPackage = {
                                                                CompanyId: sessions[sessionId].financialCompany === 8 ? 1 : 3,
                                                                CategoryId: -1,
                                                                ProductId: productID,
                                                                Percent: -1,
                                                                Month: -1,
                                                                MoneyLoan: -1,
                                                                FeatureType: 1,
                                                                IsDefaultPackage: -1,
                                                                SiteId: 1
                                                            };
                                                            APIGetInfoZeroInstalmentPackage(urlwcfProduct, argGetZeroPackage, function (packageInfo) {
                                                                console.log(packageInfo);
                                                                if (packageInfo.GetFeatureInstallmentResult) {

                                                                    resultanswer = "Thông tin gói trả góp 0% của " + (sessions[sessionId].financialCompany === 8 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                    var moneyPrepaid = (packageInfo.GetFeatureInstallmentResult.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                    resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + packageInfo.GetFeatureInstallmentResult.PaymentPercentFrom + "%)</br>";

                                                                    //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                    var m1 = parseFloat(productPrice) - moneyPrepaid;
                                                                    var m2 = m1 / packageInfo.GetFeatureInstallmentResult.PaymentMonth + 11000;
                                                                    var moneyPayInMonth = m2.toFixed(0);
                                                                    // console.log(m3);

                                                                    resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + packageInfo.GetFeatureInstallmentResult.PaymentMonth + " tháng</span>)</br>";


                                                                    var moneyDiff = (moneyPrepaid + packageInfo.GetFeatureInstallmentResult.PaymentMonth * moneyPayInMonth - parseFloat(productPrice)).toFixed(0);
                                                                    resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                    var FromDate = (packageInfo.GetFeatureInstallmentResult.FromDate.split('T')[0]).split('-');
                                                                    var ToDate = (packageInfo.GetFeatureInstallmentResult.ToDate.split('T')[0]).split('-');
                                                                    var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                    var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                    resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[packageInfo.GetFeatureInstallmentResult.BriefId - 1] + "</span>" + "</br>";

                                                                    resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                    resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                    resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ. TẤT CẢ THÔNG TIN CHỈ MANG TÍNH CHẤT THAM KHẢO</span>";


                                                                    setTimeout(() => {
                                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 800);

                                                                    questionTitle = "Lựa chọn khác";
                                                                    var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, questionTitle);

                                                                    setTimeout(() => {
                                                                        SentToClientButton(sender, anotheroptionbutton)
                                                                            .catch(console.error);

                                                                    }, 1000);

                                                                }

                                                            });

                                                        }
                                                    }
                                                    else {

                                                        if (sessions[sessionId].isLatestAskPercentInstalment) {//nếu câu liền trước là hỏi số % trả trước
                                                            //==> mục đích là lấy đúng input người dùng nhập vào cho câu đó
                                                            if (sessions[sessionId].percent_instalment != null) {
                                                                sessions[sessionId].isLatestAskPercentInstalment = false;
                                                                console.log("=======Phần trăm trả trước== " + sessions[sessionId].percent_instalment);
                                                            }
                                                        }
                                                        if (sessions[sessionId].isLatestAskMonthInstalment) {
                                                            if (sessions[sessionId].month_instalment != null) {
                                                                sessions[sessionId].isLatestAskMonthInstalment = false;
                                                                console.log("=======số tháng trả trước== " + sessions[sessionId].month_instalment);
                                                            }
                                                        }
                                                        if (sessions[sessionId].isLatestAskGID) {
                                                            if (sessions[sessionId].GID_instalment != null) {
                                                                sessions[sessionId].isLatestAskGID = false;
                                                                console.log("=======CMND== " + sessions[sessionId].GID_instalment);
                                                            }
                                                        }
                                                        if (sessions[sessionId].isLatestAskBLX) {
                                                            if (sessions[sessionId].BLX_instalment != null) {
                                                                sessions[sessionId].isLatestAskBLX = false;
                                                                console.log("=======BLX== " + sessions[sessionId].BLX_instalment);
                                                            }
                                                        }
                                                        if (sessions[sessionId].isLatestAskSHK) {
                                                            if (sessions[sessionId].SHK_instalment != null) {
                                                                sessions[sessionId].isLatestAskSHK = false;
                                                                console.log("=======SHK== " + sessions[sessionId].SHK_instalment);
                                                            }
                                                        }
                                                        if (sessions[sessionId].isLatestAskHDDN) {
                                                            if (sessions[sessionId].HDDN_instalment != null) {
                                                                sessions[sessionId].isLatestAskHDDN = false;
                                                                console.log("=======HDDN== " + sessions[sessionId].HDDN_instalment);
                                                            }
                                                        }


                                                        //-------hoi thong tin giay to
                                                        //hỏi CMND
                                                        if (!sessions[sessionId].isAskedGID || sessions[sessionId].isLatestAskGID /*chưa bị reset (phá ngang câu hỏi)*/) {
                                                            if (sessions[sessionId].isLatestAskNormalInstallment) {

                                                                resultanswer += "<br />Mời bạn thêm một số thông tin sau để xem góp trả góp thường phù hợp nhất. </br> ";

                                                            }
                                                            else {
                                                                resultanswer += "<br />Sản phẩm này <span style='font-style:italic;color:red'>không hỗ trợ trả góp 0%</span>. Mời bạn thêm một số thông tin sau để xem góp trả góp thường phù hợp nhất. </br> ";
                                                            }

                                                            resultanswer += "<br />1. <span style='font-style:italic;'>Bạn có CMND chính chủ không? (chấp nhận bản photo có công chứng không quá 6 tháng)?</span></br>";
                                                            sessions[sessionId].isLatestAskGID = true;
                                                            sessions[sessionId].isAskedGID = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại
                                                            var jsonbuttonYN = getButtonYESNO(productID, productName, sender, siteid, replyobject, "Chứng minh nhân dân");

                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                            setTimeout(() => {
                                                                SentToClientButton(sender, jsonbuttonYN)
                                                                    .catch(console.error);
                                                            }, 600)


                                                            return;

                                                        }
                                                        //hỏi BLX
                                                        else if ((!sessions[sessionId].isAskedBLX && sessions[sessionId].isAskedGID) || sessions[sessionId].isLatestAskBLX) {
                                                            resultanswer += "<br />2. <span style='font-style:italic;'>Bạn có Bằng Lái Xe không? (chấp nhận bản photo có công chứng không quá 6 tháng)?</span></br>";
                                                            sessions[sessionId].isLatestAskBLX = true;
                                                            sessions[sessionId].isAskedBLX = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại
                                                            var jsonbuttonYN = getButtonYESNO(productID, productName, sender, siteid, replyobject, "Bằng lái xe");

                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                            setTimeout(() => {
                                                                SentToClientButton(sender, jsonbuttonYN)
                                                                    .catch(console.error);
                                                            }, 600)

                                                            return;

                                                        }

                                                        //hỏi SHK
                                                        else if ((!sessions[sessionId].isAskedSHK && sessions[sessionId].isAskedGID &&
                                                            sessions[sessionId].isAskedBLX) || sessions[sessionId].isLatestAskSHK) {
                                                            resultanswer += "<br />3. <span style='font-style:italic;'>Bạn có Sổ Hộ Khẩu không? (Lưu ý: Sổ hộ khẩu phải có tên bạn. Chấp nhận bản photo có công chứng không quá 6 tháng)?</span></br>";
                                                            sessions[sessionId].isLatestAskSHK = true;
                                                            sessions[sessionId].isAskedSHK = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại

                                                            var jsonbuttonYN = getButtonYESNO(productID, productName, sender, siteid, replyobject, "Sổ hộ khẩu");

                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                            setTimeout(() => {
                                                                SentToClientButton(sender, jsonbuttonYN)
                                                                    .catch(console.error);
                                                            }, 600)

                                                            return;

                                                        }

                                                        //hỏi HDDN
                                                        else if ((!sessions[sessionId].isAskedHDDN && sessions[sessionId].isAskedGID &&
                                                            sessions[sessionId].isAskedBLX && sessions[sessionId].isAskedSHK) || sessions[sessionId].isLatestAskHDDN) {
                                                            resultanswer += "<br />4. <span style='font-style:italic;'>Bạn có Hóa đơn điện/nước/internet không? (Lưu ý: Hóa đơn phải là hóa đơn không quá 3 tháng)?</span></br>";
                                                            sessions[sessionId].isLatestAskHDDN = true;
                                                            sessions[sessionId].isAskedHDDN = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại
                                                            var jsonbuttonYN = getButtonYESNO(productID, productName, sender, siteid, replyobject, "Hóa đơn điện nước");

                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                            setTimeout(() => {
                                                                SentToClientButton(sender, jsonbuttonYN)
                                                                    .catch(console.error);
                                                            }, 600)

                                                            return;

                                                        }
                                                        //hỏi %
                                                        else if ((!sessions[sessionId].isAskedPercentInstalment && sessions[sessionId].isAskedHDDN &&
                                                            sessions[sessionId].isAskedGID && sessions[sessionId].isAskedBLX && sessions[sessionId].isAskedSHK) || sessions[sessionId].isLatestAskPercentInstalment) {

                                                            resultanswer += "<br/>5. <span style='font-style:italic;'>Bạn muốn trả trước bao nhiêu %? (vui lòng chỉ nhập số TRÒN CHỤC và nằm trong phạm vi từ 10 đến 80 (<span style='color:red;font-style:italic'>Một số sản phẩm có hỗ trợ trả góp 0% nên có thể nhập 0</span>), ví dụ: 0,20,30...</span></br>";
                                                            sessions[sessionId].isLatestAskPercentInstalment = true;
                                                            sessions[sessionId].isAskedPercentInstalment = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại

                                                        }
                                                        //lấy danh sách tháng dựa vào giấy tờ và % trả trước
                                                        else if ((!sessions[sessionId].isAskedMonthInstalment && sessions[sessionId].isAskedGID &&
                                                            sessions[sessionId].isAskedBLX && sessions[sessionId].isAskedSHK
                                                            && sessions[sessionId].isAskedHDDN && sessions[sessionId].isAskedPercentInstalment) || sessions[sessionId].isLatestAskMonthInstalment) {
                                                            console.log("===cmnd===" + sessions[sessionId].GID_instalment);
                                                            console.log("===shk===" + sessions[sessionId].SHK_instalment);
                                                            console.log("===blx===" + sessions[sessionId].BLX_instalment);
                                                            console.log("===hddn===" + sessions[sessionId].HDDN_instalment);
                                                            console.log("===% tra truoc===" + sessions[sessionId].percent_instalment);

                                                            if (sessions[sessionId].GID_instalment === 1) {

                                                                if (sessions[sessionId].SHK_instalment === 1) {
                                                                    if (sessions[sessionId].BLX_instalment === 0) {
                                                                        if (sessions[sessionId].HDDN_instalment === 0) {
                                                                            sessions[sessionId].BriefID = 1;
                                                                        }
                                                                        else {
                                                                            sessions[sessionId].BriefID = 3;
                                                                        }
                                                                    }
                                                                    else {//có blx
                                                                        if (sessions[sessionId].HDDN_instalment === 0) {
                                                                            sessions[sessionId].BriefID = 4;
                                                                        }
                                                                        else {
                                                                            sessions[sessionId].BriefID = 2;
                                                                        }
                                                                    }
                                                                }
                                                                else {//không có shk
                                                                    if (sessions[sessionId].BLX_instalment === 1) {//có blx
                                                                        if (sessions[sessionId].HDDN_instalment === 1) {
                                                                            sessions[sessionId].BriefID = 4;
                                                                        }
                                                                        else {
                                                                            sessions[sessionId].BriefID = 2;
                                                                        }
                                                                    }
                                                                    else {//kh có blx
                                                                        sessions[sessionId].BriefID = -1;//không hợp lệ
                                                                    }
                                                                }

                                                            }
                                                            else {
                                                                //không có cmnd thì không hợp lệ rồi, đã loại ở trên
                                                                sessions[sessionId].BriefID = -1;
                                                            }

                                                            //xử lý logic..
                                                            if (sessions[sessionId].BriefID === -1)//không đủ đk trả góp
                                                            {

                                                                //reset
                                                                sessions[sessionId].isAskedGID = false;
                                                                sessions[sessionId].isAskedBLX = false;
                                                                sessions[sessionId].isAskedHDDN = false;
                                                                sessions[sessionId].isAskedSHK = false;
                                                                sessions[sessionId].isAskedPercentInstalment = false;



                                                                SentToClient(sender, "<span style='color:red'>Rất tiếc. Giấy tờ bạn cung cấp không đủ điều kiện để trả góp. Xin lỗi vì sự bất tiện này.</span>", questionTitle, button_payload_state, "", replyobject, siteid)
                                                                    .catch(console.error);
                                                                return;
                                                            }
                                                            else {
                                                                //chọn tháng trả góp dựa vào điều kiện
                                                                console.log("===BriefID===" + sessions[sessionId].BriefID);

                                                                var argsGetListMonth = {
                                                                    CategoryId: categoryID,
                                                                    Price: productPrice,
                                                                    CompanyId: -1,
                                                                    Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                    Month: -1,
                                                                    BriefId: sessions[sessionId].BriefID,
                                                                    ProductId: -1,
                                                                    SiteId: 1
                                                                }
                                                                APIGetNormalInstallment(urlwcfProduct, argsGetListMonth, function (allpackages) {
                                                                    console.log(allpackages);
                                                                    console.log(argsGetListMonth);
                                                                    if (allpackages.GetListNormalInstallmentResult) {
                                                                        if (allpackages.GetListNormalInstallmentResult.InstallmentBO) {
                                                                            sessions[sessionId].InstalmentMonth = [];
                                                                            allpackages.GetListNormalInstallmentResult.InstallmentBO.forEach(element => {
                                                                                //console.log(element);
                                                                                //khác số % trả trước
                                                                                if (parseInt(element.PaymentPercentFrom) === parseInt(sessions[sessionId].percent_instalment)) {
                                                                                    if (!sessions[sessionId].InstalmentMonth.includes(parseInt(element.PaymentMonth))) {
                                                                                        sessions[sessionId].InstalmentMonth.push(parseInt(element.PaymentMonth));
                                                                                    }
                                                                                }
                                                                            });
                                                                        }
                                                                        setTimeout(() => {
                                                                            if (sessions[sessionId].InstalmentMonth.length === 0) {
                                                                                resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp cho trả trước " + sessions[sessionId].percent_instalment + "%. Mời chọn lại.</span></br>";

                                                                                setTimeout(() => {
                                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                                        .catch(console.error);
                                                                                }, 400);

                                                                                questionTitle = "Lựa chọn khác";
                                                                                var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                                setTimeout(() => {
                                                                                    SentToClientButton(sender, anotheroptionbutton)
                                                                                        .catch(console.error);

                                                                                }, 800);


                                                                                return;
                                                                            }

                                                                            sessions[sessionId].InstalmentMonth.sort(function (a, b) { return a - b });
                                                                            // sessions[sessionId].InstalmentMonth.forEach(element => {
                                                                            //     console.log(element);
                                                                            // });
                                                                            resultanswer += "<br />6. <span style='font-style:italic;'>Xin mời chọn số tháng trả góp?</span></br>";
                                                                            sessions[sessionId].isLatestAskMonthInstalment = true;
                                                                            sessions[sessionId].isAskedMonthInstalment = true;//sẽ bị reset khi hết vòng hỏi này, hoặc khách hàng chọn hỏi sp khác, hỏi lại
                                                                            var jsonbuttonMI = getButtonMonthInstalment(productID, productName, sender, siteid, replyobject, "Số tháng góp", sessions[sessionId].InstalmentMonth);

                                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                                .catch(console.error);

                                                                            setTimeout(() => {
                                                                                SentToClientButton(sender, jsonbuttonMI)
                                                                                    .catch(console.error);
                                                                            }, 600)

                                                                            return;
                                                                        }, 1000);

                                                                    }
                                                                    else {//không có số tháng phù hợp cho % này
                                                                        resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp cho trả trước " + sessions[sessionId].percent_instalment + "%. Mời chọn lại.</span></br>";

                                                                        setTimeout(() => {
                                                                            SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                                .catch(console.error);
                                                                        }, 400);

                                                                        questionTitle = "Lựa chọn khác";
                                                                        var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                        setTimeout(() => {
                                                                            SentToClientButton(sender, anotheroptionbutton)
                                                                                .catch(console.error);

                                                                        }, 800);


                                                                        return;
                                                                    }

                                                                });

                                                            }
                                                        }
                                                        else {
                                                            //sau khi đã hỏi xong hết=> Bắt đầu đưa ra thông tin trả góp
                                                            console.log("===cmnd===" + sessions[sessionId].GID_instalment);
                                                            console.log("===shk===" + sessions[sessionId].SHK_instalment);
                                                            console.log("===blx===" + sessions[sessionId].BLX_instalment);
                                                            console.log("===hddn===" + sessions[sessionId].HDDN_instalment);
                                                            console.log("===% tra truoc===" + sessions[sessionId].percent_instalment);
                                                            console.log("===so thang gop===" + sessions[sessionId].month_instalment);
                                                            console.log("===giá===" + productPrice);
                                                            console.log("===cate===" + categoryID);
                                                            console.log("===BreadID===" + sessions[sessionId].BriefID);

                                                            //lấy gói trả góp đưa ra
                                                            var argsInstalmentResult = {
                                                                CategoryId: categoryID,
                                                                Price: productPrice,
                                                                CompanyId: -1,
                                                                Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                Month: parseInt(sessions[sessionId].month_instalment),
                                                                BriefId: sessions[sessionId].BriefID,
                                                                ListDealId: -1,
                                                                ProductId: -1,
                                                                CollectionFee: 11000,
                                                                SiteId: 1
                                                            }
                                                            APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                console.log(InstallmentResult);
                                                                if (InstallmentResult.GetInstallmentResultResult) {

                                                                    resultanswer = "Thông tin gói trả góp của " + (InstallmentResult.GetInstallmentResultResult.CompanyID === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                    var moneyPrepaid = (InstallmentResult.GetInstallmentResultResult.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                    resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + InstallmentResult.GetInstallmentResultResult.PaymentPercentFrom + "%)</br>";

                                                                    //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht

                                                                    // var m1 = parseFloat(productPrice) - moneyPrepaid;
                                                                    // var m2 = m1 / InstallmentResult.GetInstallmentResultResult.PaymentMonth + 11000;
                                                                    // var moneyPayInMonth = m2.toFixed(0);
                                                                    var moneyPayInMonth = parseFloat(InstallmentResult.GetInstallmentResultResult.MoneyPayPerMonth).toFixed(0);
                                                                    // console.log(m3);

                                                                    resultanswer += "*Số tiền góp hàng tháng: <span style='font-weight:bold'>" + format_currency(moneyPayInMonth.toString()) + "đ</span>" + " (<span style='font-weight:bold'>" + InstallmentResult.GetInstallmentResultResult.PaymentMonth + " tháng</span>)</br>";


                                                                    var moneyDiff = (parseFloat(InstallmentResult.GetInstallmentResultResult.TotalPay) - parseFloat(productPrice)).toFixed(0);
                                                                    resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                    var FromDate = (InstallmentResult.GetInstallmentResultResult.FromDate.split('T')[0]).split('-');
                                                                    var ToDate = (InstallmentResult.GetInstallmentResultResult.ToDate.split('T')[0]).split('-');
                                                                    var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                    var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                    resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResultResult.BriefId - 1] + "</span>" + "</br>";

                                                                    resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                    resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                    resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ. TẤT CẢ THÔNG TIN CHỈ MANG TÍNH CHẤT THAM KHẢO</span>";


                                                                    setTimeout(() => {
                                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 800);

                                                                    questionTitle = "Lựa chọn khác";
                                                                    var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                    setTimeout(() => {
                                                                        SentToClientButton(sender, anotheroptionbutton)
                                                                            .catch(console.error);

                                                                    }, 1500);
                                                                }
                                                                else {
                                                                    resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp.</span></br>";

                                                                    setTimeout(() => {
                                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 400);

                                                                    questionTitle = "Lựa chọn khác";
                                                                    var anotheroptionbutton = AnotherOptionNormalInstalment(sender, siteid, replyobject, questionTitle);

                                                                    setTimeout(() => {
                                                                        SentToClientButton(sender, anotheroptionbutton)
                                                                            .catch(console.error);

                                                                    }, 800);


                                                                    return;
                                                                }

                                                            });



                                                        }

                                                        SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                            .catch(console.error);

                                                    }
                                                });
                                                //nếu không có...
                                            }
                                            else {
                                                resultanswer += "<br />Sản phẩm này hiện tại không hỗ trợ bất kỳ hình thức trả góp nào. Bạn có thể hỏi sản phẩm khác hoặc bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";
                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                    .catch(console.error);
                                                // resultanswer += "<br />Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";

                                            }
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

                intent = "ask_instalment";
                sessions[sessionId].prev_intent = "ask_instalment";
            }
            else if (intent === "ask_stock" || intent === "ask_price" || intent === "ask_old_stock") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

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

                    if (keyword.toLowerCase().includes("ốp lưng") ||
                        keyword.toLowerCase().includes("op lung") ||
                        keyword.toLowerCase().includes("tai nghe") ||
                        keyword.toLowerCase().includes("pin") ||
                        keyword.toLowerCase().includes("sạc") ||
                        keyword.toLowerCase().includes("sac") ||
                        keyword.toLowerCase().includes("bàn phím") ||
                        keyword.toLowerCase().includes("ban phim") ||
                        keyword.toLowerCase().includes("loa") ||
                        keyword.toLowerCase().includes("thẻ nhớ") ||
                        keyword.toLowerCase().includes("the nho") ||
                        keyword.toLowerCase().includes("usb") ||
                        keyword.toLowerCase().includes("đồng hồ") ||
                        keyword.toLowerCase().includes("dong ho") ||
                        keyword.toLowerCase().includes("gậy") ||
                        keyword.toLowerCase().includes("gay tu suong") ||
                        keyword.toLowerCase().includes("dán màn hình") ||
                        keyword.toLowerCase().includes("tai phone") ||
                        keyword.toLowerCase().includes("cường lực"))//search phụ kiện
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
                                                resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại <span style='color:red'>NGỪNG KINH DOANH</span>. Vui lòng chọn sản phẩm khác ạ!";


                                                SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                            else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                                resultanswer += "<br />" + "Sản phẩm bạn hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";


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
                                                                    var jsonmessageStore = '{' +
                                                                        '"username":' + '"' + sender + '"' + ',' +
                                                                        '"siteid":' + '"' + siteid + '"' + ',' +
                                                                        '"messagetype":"template"' + ',' +
                                                                        '"replyobject":' + '{' +
                                                                        '"username":' + '"' + replyobject.username + '"' + ',' +
                                                                        '"message":' + '"' + replyobject.message + '"' + ',' +
                                                                        '"fullname":' + '"' + replyobject.fullname + '"' + ',' +
                                                                        '"currenturl":' + '"' + replyobject.currenturl + '"' + ',' +
                                                                        '"sentAt":' + replyobject.sentAt + ',' +
                                                                        '"userType":' + '"' + replyobject.userType + '"' + ',' +
                                                                        '"gender":' + replyobject.gender + ',' +
                                                                        '"roomId":' + '"' + replyobject.roomId + '"' + ',' +
                                                                        '"msgid":' + '"' + replyobject.msgid + '"' + ',' +
                                                                        '"isbot":' + replyobject.isbot +
                                                                        '}' + ',' +
                                                                        '"messagecontentobject":' + '{' +
                                                                        '"elements":' + '[' +
                                                                        '{' +
                                                                        '"title":' + '"' + questionTitle + '"' + ',' +
                                                                        '"buttons":' + '[';


                                                                    var length = result.GetStoreInStock2016Result.StoreBO.length;

                                                                    // resultanswer += "<br />Danh sách siêu thị có hàng tại " + provinceName + "<br />";
                                                                    for (var i = 0; i < result.GetStoreInStock2016Result.StoreBO.length; i++) {
                                                                        var storeBO = result.GetStoreInStock2016Result.StoreBO[i];
                                                                        //resultanswer += (i + 1) + ". " + storeBO.webAddressField + "<br />";
                                                                        //resultanswer += " https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + "<br />";

                                                                        if (i == (length - 1)) {

                                                                            jsonmessageStore += '{' +
                                                                                '"type":"web_url"' + ',' +
                                                                                '"title":' + '"' + (i + 1) + storeBO.webAddressField + '"' + ',' +
                                                                                '"url":' + '"' + "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + '"' + '}';


                                                                        }
                                                                        else {
                                                                            jsonmessageStore += '{' +
                                                                                '"type":"web_url"' + ',' +
                                                                                '"title":' + '"' + storeBO.webAddressField + '"' + ',' +
                                                                                '"url":' + '"' + "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + '"' + '}' + ',';

                                                                        }


                                                                    }
                                                                    //resultanswer += "..................";



                                                                    //SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                    //    .catch(console.error);

                                                                    jsonmessageStore +=
                                                                        ']' +
                                                                        '}' + ']' + '}' + '}';
                                                                    // console.log(jsonmessageStore);

                                                                    var bodystring = JSON.parse(jsonmessageStore);
                                                                    var bodyjson = JSON.stringify(bodystring);


                                                                    //console.log("===============BUTTON URL STORE===================");
                                                                    //console.log(bodyjson);


                                                                    SentToClientButton(sender, bodyjson)
                                                                        .catch(console.error);


                                                                    //===========================================================================================


                                                                    //lấy danh sách huyện của tỉnh đó

                                                                    var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };

                                                                    SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle);


                                                                }
                                                                else {//hết hàng
                                                                    SentToClient(sender, "Rất tiếc. Sản phẩm " + productName + " đã <span style='color:red'>HẾT HÀNG HOẶC ĐANG NHẬP VỀ</span> tại khu vực " + provinceName + " của bạn! Vui lòng chọn lại khu vực lân cận.", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        .catch(console.error);

                                                                }

                                                            });//end APIGetDistrictByProvince

                                                        }
                                                        else {

                                                            sessions[sessionId].province = null;
                                                            SentToClient(sender, "Không nhận diện được Tỉnh/Thành Phố bạn đang ở. Vui lòng cung cấp tỉnh/Thành trước. (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
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


                                                                        var jsonmessageStore = '{' +
                                                                            '"username":' + '"' + sender + '"' + ',' +
                                                                            '"siteid":' + '"' + siteid + '"' + ',' +
                                                                            '"messagetype":"template"' + ',' +
                                                                            '"replyobject":' + '{' +
                                                                            '"username":' + '"' + replyobject.username + '"' + ',' +
                                                                            '"message":' + '"' + replyobject.message + '"' + ',' +
                                                                            '"fullname":' + '"' + replyobject.fullname + '"' + ',' +
                                                                            '"currenturl":' + '"' + replyobject.currenturl + '"' + ',' +
                                                                            '"sentAt":' + replyobject.sentAt + ',' +
                                                                            '"userType":' + '"' + replyobject.userType + '"' + ',' +
                                                                            '"gender":' + replyobject.gender + ',' +
                                                                            '"roomId":' + '"' + replyobject.roomId + '"' + ',' +
                                                                            '"msgid":' + '"' + replyobject.msgid + '"' + ',' +
                                                                            '"isbot":' + replyobject.isbot +
                                                                            '}' + ',' +
                                                                            '"messagecontentobject":' + '{' +
                                                                            '"elements":' + '[' +
                                                                            '{' +
                                                                            '"title":' + '"' + questionTitle + '"' + ',' +
                                                                            '"buttons":' + '[';
                                                                        var length = result.GetStoreInStock2016Result.StoreBO.length;

                                                                        for (var i = 0; i < result.GetStoreInStock2016Result.StoreBO.length; i++) {
                                                                            var storeBO = result.GetStoreInStock2016Result.StoreBO[i];
                                                                            if (storeBO.webAddressField && storeBO.webAddressField != "undefined") {
                                                                                // resultanswer += (i + 1) + ". " + storeBO.webAddressField + "<br />";
                                                                                // resultanswer += " https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + "<br />";


                                                                                if (i == (length - 1)) {

                                                                                    jsonmessageStore += '{' +
                                                                                        '"type":"web_url"' + ',' +
                                                                                        '"title":' + '"' + (i + 1) + storeBO.webAddressField + '"' + ',' +
                                                                                        '"url":' + '"' + "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + '"' + '}';


                                                                                }
                                                                                else {
                                                                                    jsonmessageStore += '{' +
                                                                                        '"type":"web_url"' + ',' +
                                                                                        '"title":' + '"' + (i + 1) + storeBO.webAddressField + '"' + ',' +
                                                                                        '"url":' + '"' + "https://www.thegioididong.com/sieu-thi-so-" + storeBO.storeIDField + '"' + '}' + ',';

                                                                                }

                                                                            }

                                                                        }

                                                                        jsonmessageStore +=
                                                                            ']' +
                                                                            '}' + ']' + '}' + '}';

                                                                        var bodystring = JSON.parse(jsonmessageStore);
                                                                        var bodyjson = JSON.stringify(bodystring);


                                                                        //console.log("===============BUTTON URL STORE===================");
                                                                        //console.log(bodyjson);



                                                                        SentToClientButton(sender, bodyjson)
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
                                                                            resultanswer += "Vui lòng chọn màu sắc bạn quan tâm để xem danh sách cửa hàng còn hàng!";
                                                                            SendToUserListColor(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle);
                                                                            return;
                                                                        }



                                                                        //}//end if color
                                                                        //else {
                                                                        //resultanswer = "Vui lòng chọn màu sắc bạn quan tâm để xem danh sách cửa hàng còn hàng!"
                                                                        //}

                                                                    }//end if(result)
                                                                    else {
                                                                        //sessions[sessionId].province = null;
                                                                        //sessions[sessionId].district = null;

                                                                        if (color && hasNumber(color)) {


                                                                            resultanswer = "Rất tiếc. Sản phẩm có màu " + sessions[sessionId].colorname.toUpperCase() + " đã <span style='color:red'>HẾT HÀNG</span> tại khu vực của bạn! Vui lòng chọn lại."

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
                                                                            resultanswer = "Rất tiếc. Sản phẩm đã <span style='color:red;font-weight:bold'>HẾT HÀNG</span> tại khu vực " + districtName + " của bạn! Vui lòng chọn lại khu vực lân cận.";

                                                                            //suggest khu vực
                                                                            var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
                                                                            //=======================================================================

                                                                            SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle);

                                                                            //=======================================================================


                                                                        }

                                                                    }

                                                                    SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                        .catch(console.error);

                                                                });//end APICheckInStock
                                                            }
                                                            else {//nếu ra quá nhiều thì suggest ra quận huyện nào thành phố đó (3 kết quả tối đa)

                                                                resultanswer = "";
                                                                resultanswer += "Ý BẠN LÀ GÌ ?<br /> ";


                                                                var type = "template";
                                                                questionTitle = "Ý bạn có phải là ?";

                                                                var jsonmessageDistrict = '{' +
                                                                    '"username":' + '"' + sender + '"' + ',' +
                                                                    '"siteid":' + '"' + siteid + '"' + ',' +
                                                                    '"messagetype":"template"' + ',' +
                                                                    '"replyobject":' + '{' +
                                                                    '"username":' + '"' + replyobject.username + '"' + ',' +
                                                                    '"message":' + '"' + replyobject.message + '"' + ',' +
                                                                    '"fullname":' + '"' + replyobject.fullname + '"' + ',' +
                                                                    '"currenturl":' + '"' + replyobject.currenturl + '"' + ',' +
                                                                    '"sentAt":' + replyobject.sentAt + ',' +
                                                                    '"userType":' + '"' + replyobject.userType + '"' + ',' +
                                                                    '"gender":' + replyobject.gender + ',' +
                                                                    '"roomId":' + '"' + replyobject.roomId + '"' + ',' +
                                                                    '"msgid":' + '"' + replyobject.msgid + '"' + ',' +
                                                                    '"isbot":' + replyobject.isbot +
                                                                    '}' + ',' +
                                                                    '"messagecontentobject":' + '{' +
                                                                    '"elements":' + '[' +
                                                                    '{' +
                                                                    '"title":' + '"' + questionTitle + '"' + ',' +
                                                                    '"buttons":' + '[';

                                                                for (var i = 0; i < result.length; i++) {//lấy tối đa 6
                                                                    if (i > 5) break;
                                                                    var resultEach = result[i]._source;
                                                                    if (i == result.length - 1) {
                                                                        jsonmessageDistrict += '{' +
                                                                            '"type":"postback"' + ',' +
                                                                            '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                                                            '"payload":' + '"' + resultEach.districtID + '"' + '}';

                                                                    }
                                                                    else {
                                                                        jsonmessageDistrict += '{' +
                                                                            '"type":"postback"' + ',' +
                                                                            '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                                                            '"payload":' + '"' + resultEach.districtID + '"' + '}' + ',';
                                                                    }

                                                                }
                                                                jsonmessageDistrict +=
                                                                    ']' +
                                                                    '}' + ']' + '}' + '}';

                                                                var bodystring = JSON.parse(jsonmessageDistrict);
                                                                var bodyjson = JSON.stringify(bodystring);

                                                                //console.log(bodyjson);
                                                                SentToClientButton(sender, bodyjson)
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
                                                                    resultanswer += "CÓ PHẢI Ý BẠN LÀ CÁC ĐỊA CHỈ DƯỚI ĐÂY KHÔNG ?<br /> ";


                                                                    var type = "template";
                                                                    questionTitle = "Ý bạn là ?";

                                                                    var jsonmessageDistrict = '{' +
                                                                        '"username":' + '"' + sender + '"' + ',' +
                                                                        '"siteid":' + '"' + siteid + '"' + ',' +
                                                                        '"messagetype":"template"' + ',' +
                                                                        '"replyobject":' + '{' +
                                                                        '"username":' + '"' + replyobject.username + '"' + ',' +
                                                                        '"message":' + '"' + replyobject.message + '"' + ',' +
                                                                        '"fullname":' + '"' + replyobject.fullname + '"' + ',' +
                                                                        '"currenturl":' + '"' + replyobject.currenturl + '"' + ',' +
                                                                        '"sentAt":' + replyobject.sentAt + ',' +
                                                                        '"userType":' + '"' + replyobject.userType + '"' + ',' +
                                                                        '"gender":' + replyobject.gender + ',' +
                                                                        '"roomId":' + '"' + replyobject.roomId + '"' + ',' +
                                                                        '"msgid":' + '"' + replyobject.msgid + '"' + ',' +
                                                                        '"isbot":' + replyobject.isbot +
                                                                        '}' + ',' +
                                                                        '"messagecontentobject":' + '{' +
                                                                        '"elements":' + '[' +
                                                                        '{' +
                                                                        '"title":' + '"' + questionTitle + '"' + ',' +
                                                                        '"buttons":' + '[';

                                                                    for (var i = 0; i < result.length; i++) {//lấy tối đa 6
                                                                        if (i > 5) break;
                                                                        var resultEach = result[i]._source;
                                                                        if (i == result.length - 1 || i == 5) {


                                                                            jsonmessageDistrict += '{' +
                                                                                '"type":"postback"' + ',' +
                                                                                '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                                                                '"payload":' + '"' + resultEach.districtID + '"' + '}';
                                                                        }
                                                                        else {

                                                                            jsonmessageDistrict += '{' +
                                                                                '"type":"postback"' + ',' +
                                                                                '"title":' + '"' + resultEach.districtName + '"' + ',' +
                                                                                '"payload":' + '"' + resultEach.districtID + '"' + '}' + ',';
                                                                        }

                                                                    }
                                                                    jsonmessageDistrict +=
                                                                        ']' +
                                                                        '}' + ']' + '}' + '}';

                                                                    var bodystring = JSON.parse(jsonmessageDistrict);
                                                                    var bodyjson = JSON.stringify(bodystring);

                                                                    //console.log(bodyjson);
                                                                    SentToClientButton(sender, bodyjson)
                                                                        .catch(console.error);
                                                                }

                                                                else {

                                                                    SentToClient(sender, "Bạn đang ở Tỉnh/Thành phố nào ạ? (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
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
                                                    resultanswer = "<br />Bạn đang ở Tỉnh/Thành phố nào ạ? Vui lòng cung cấp tỉnh/thành phố trước (VIẾT HOA CHỮ ĐẦU), ví dụ: Hồ Chí Minh, Hà Nội, Phú Yên...";
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

            else if (intent === "offense") {
                sessions[sessionId].isLatestAskNormalInstallment = false;
                var rn = randomNumber(offense.length);
                resultanswer += offense[rn];

                //var resultanswer2 = "Bạn có rảnh không? Rảnh thì mua điện thoại ở công ty Thế Giới Di Động của mình. Bảo đảm là \"Danh bất hư truyền\". :p"

                intent = "offense";
                sessions[sessionId].prev_intent = "offense";
            }

            else if (intent === "ask_consultant") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Tư vấn sản phẩm.";

                resultanswer += "<br />Chức năng tư vấn sản phẩm đang phát triển. Xin lỗi vì sự bất tiện này!"
                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";
                intent = "ask_consultant";
                sessions[sessionId].prev_intent = "ask_consultant";

                sessions[sessionId].product = null;
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
                resultanswer = "Cảm ơn bạn. Rất hân hạnh được phục vụ bạn. !" + "<br />";

                intent = "felling_love";
                sessions[sessionId].prev_intent = "felling_love";
            }

            else if (intent === "felling_price") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Cảm xúc giá";
                resultanswer = "Chất lượng sản phẩm ở Thế Giới Di Động được cam kết là chất lượng và chính hãng nha bạn. Giá cả rất hợp lý cho người mua ạ. " + "<br />";

                //suggest kh
                intent = "felling_price";
                sessions[sessionId].prev_intent = "felling_price";
            }
            else if (intent === "ask_delivery") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "Giao hàng";
                resultanswer = "Chức năng giao hàng đang được phát triển... Xin lỗi bạn vì sự bất tiện này!";
                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";

                //suggest kh
                intent = "ask_delivery";
                sessions[sessionId].prev_intent = "ask_delivery";
            }
            else if (intent === "ask_compare") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                questionTitle = "So sánh";
                resultanswer = "Muốn so sánh lựa chọn, vui lòng truy cập https://www.thegioididong.com/hoi-dap để được trả lời cụ thể hơn nha bạn!";

                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";

                //suggest kh
                intent = "ask_compare";
                sessions[sessionId].prev_intent = "ask_compare";
            }
            else if (intent == "ask_helper") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Danh sách tổng đài hỗ trợ của TGDD: <br />";
                resultanswer += "<ul><li> Gọi mua hàng 1800.1060 (7: 30 - 22: 00)</li> <li> Gọi khiếu nại 1800.1062 (8: 00 - 21: 30)</li> <li> Gọi bảo hành 1800.1064 (8: 00 - 21: 00)</li> <li>Hỗ trợ kỹ thuật 1800.1763 (7: 30 - 22: 00) </li> </ul>";


            }
            else if (intent == "ask_guarantee") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Về các dịch vụ liên quan đến bảo hành như thay màn hình, thay phụ kiện, hư hỏng do lỗi nhà sản xuất, lỗi nóng máy, lỗi tụt pin... <br />";
                resultanswer += "Kính mong quý khách đem máy đến cửa hàng Thế Giới Di Động gần nhất để được phục vụ, báo giá chi tiết và chính xác nhất ạ.";
                resultanswer += "Rất xin lỗi vì sự bất tiện này."


            }
            else if (intent == "ans_tel") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Cảm ơn bạn.Chúng tôi sẽ liên hệ bạn sớm nhất có thể. Bạn cần tư vấn hỗ trợ gì nữa không ạ?";
            }
            else if (intent == "ask_return") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Chức năng ĐỔI TRẢ VÀ MUA LẠI hiện tại đang phát triển cho BOT. Xin quý khách vui lòng thông cảm. Quý khách có thể liên hệ tổng đài 18001064 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ. Xin cảm ơn";
            }
            else if (intent == "ask_order") {
                sessions[sessionId].isLatestAskNormalInstallment = false;

                resultanswer = "Chức năng KIỂM TRA ĐƠN HÀNG hiện tại đang phát triển cho BOT. Xin quý khách vui lòng thông cảm. Quý khách có thể liên hệ tổng đài 18001062 (MIỄN PHÍ CUỘC GỌI) để được hỗ trợ. Xin cảm ơn";
            }

            else {
                sessions[sessionId].isLatestAskNormalInstallment = false;
                if (intent === "greet") {
                }
                else {
                    resultanswer = "Mình chưa rõ câu hỏi của bạn lắm. Bạn vui lòng cung cấp rõ thông tin cần hỏi như: tên sản phẩm, giá cả, địa chỉ...Cảm ơn bạn";
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
        resultanswer = "Bạn muốn hỏi thông tin sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_stock";
    }
    else if (button_payload_state === "2") {
        questionTitle = "Hỏi giá sản phẩm"
        resultanswer = "Bạn muốn hỏi giá sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_price";
    }
    else if (button_payload_state === "3") {
        questionTitle = "Hỏi khuyễn mãi sản phẩm"
        resultanswer = "Bạn muốn xem khuyễn mãi của sản phẩm nào ạ?"

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
    questionTitle = "Mời lựa chọn công ty tài chính cho vay để xem gói trả góp tương ứng!";

    if (sessions[sessionId].product && sessions[sessionId].productID) {//th bị reset đột ngột mất session
        var jsonbuttonFinancialCompany = getButtonFinancialCompany(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle);
        //console.log(jsonbuttonFinancialCompany);


        SentToClientButton(sender, jsonbuttonFinancialCompany)
            .catch(console.error);
    }
    else {
        var rn = randomNumber(unknowproduct.length);
        var resultanswer = unknowproduct[rn];
        if (!resultanswer) {//trường hợp chưa load xong file từ data
            resultanswer = "Không hiểu sản phẩm bạn đang muốn hỏi là gì?";
        }

        SentToClient(sender, resultanswer, "", button_payload_state, "", replyobject, siteid)
            .catch(console.error);

    }



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
            if (percent === 0)//một số sp có hỗ trợ trả góp 0%
            {
                getJsonAndAnalyze(url, sender, sessionId, percent, replyobject, siteid);
            }
            else {
                resultanswer = "Phần trăm trả trước không hợp lệ. Vui lòng chỉ nhập số TRÒN CHỤC và nằm trong khoảng từ 10% đến 80%."
                SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
                    .catch(console.error);

                return;
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

        var data = (req.body);

        // var data = JSON.parse(JSON.stringify((req.body)));
        console.log("=============DATA POST XUONG======================");
        console.log(data);
        console.log("===================================");


        const sender = data.username;
        const siteid = data.siteid;

        const fullname = data.fullname;
        const gender = data.gender;
        const sessionId = findOrCreateSession(sender);
        sessions[sessionId].isPreAskColor = false;

        //trace chat history
        tracechat.logChatHistory(sender, data, 1);//1 là câu hỏi, 2 là câu trả lời

        //

        var replyobject = data.replyobject;

        if (!data.postbackobject.title) {//xu ly message tu user


            // We retrieve the message content
            var messagetype = data.messageobject.type;
            var messagecontent = data.messageobject.content.toLowerCase();

            //console.log(event.message);
            if (messagetype == 2) {
                // We received an attachment
                // Let's reply with an automatic message
                SentToClient(sender, 'Bạn đáng yêu quá trời. ', "", "", "", replyobject, siteid)
                    .catch(console.error);
            } else {

                if (messagecontent.includes("@"))
                    messagecontent = messagecontent.replace("@", " ");
                messagecontent = messagecontent.replace(/\n/g, '');
                var button_payload_state = 0;//không có gì, 1: hoi sp, 2: hỏi giá, 3: hỏi km


                var sever = severRasaQuery + messagecontent;
                var url = encodeURI(sever);

                if (sessions[sessionId].isLatestAskPercentInstalment) {
                    //console.log("ok");
                    getPercentInstalment(sender, sessionId, messagecontent, replyobject, siteid);

                }
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

                else if (sessions[sessionId].isLatestAskMonthInstalment) {
                    getMonthInstalment(sender, sessionId, button_payload_state, replyobject, siteid);
                }
                else {
                    var others = parseInt(button_payload_state);

                    responsepostbackothers(sender, sessionId, others, replyobject, siteid);
                }
            }
            else if (button_payload_state === "14" || button_payload_state === "15")//hỏi lại % trả trước || số tháng
            {
                askPercentMonthAgain(sender, sessionId, button_payload_state, replyobject, siteid);
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
};

module.exports = webhookController;

