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

var severResponse = "https://6ca4e410.ngrok.io/chatbot";

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
                                // {
                                //     type: "postback",
                                //     title: "Thông tin trả góp",
                                //     payload: "4"
                                // }
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
                // var bodystring = JSON.parse(jsonmessageDistrict);
                var bodyjson = JSON.stringify(jsonmessageDistrict);
                console.log(bodyjson);


                SentToClientButton(sender, bodyjson)
                    .catch(console.error);

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
                    console.log(toDate)
                    console.log(nowDate)
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
                sessions[sessionId].district = button_payload_state;
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
            else if (button_payload_state === "NORMAL" || button_payload_state === "BAD" || button_payload_state === "GOOD") {
                SentToClient(sender, "Cảm ơn bạn đã đánh giá. Rất vui được phục vụ bạn.", questionTitle, button_payload_state, "", replyobject, siteid)
                    .catch(console.error);
                return;
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

                sessions[sessionId].prev_intent = "goodbye";
                questionTitle = "Cảm ơn!";

                var rn = randomNumber(goodbye.length);
                resultanswer = goodbye[rn];

                fbEvaluate(sender, replyobject, siteid);


            }
            else if (intent === "thankyou") {
                sessions[sessionId].prev_intent = "thankyou";
                questionTitle = "Cảm ơn!";
                var rn = randomNumber(thankyou.length);
                resultanswer = thankyou[rn];

                fbEvaluate(sender, replyobject, siteid);
            }
            else if (intent === "ask_promotion" || sessions[sessionId].prev_intent === "ask_promotion") {
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

                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "'>" + seoURL + "</a>" + "<br />";

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
                resultanswer += "<p style='color:red;font-style: italic;'>Để mua hàng trả góp, tuổi của bạn phải lớn hớn 20 và nhỏ hơn 60, và bắt buộc phải có CMND chính chủ.Lưu ý tất cả các giấy tờ phải còn hạn sử dụng. Chấp nhận bản photo phải có CÔNG CHỨNG không quá 6 tháng.</p>";
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
                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + "<br />"
                                        + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>Không xác định</span>") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                    //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                    //  console.log(resultanswer);

                                    APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "'>" + seoURL + "</a>" + "<br />";

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
                                                    if (result) {
                                                        resultanswer += "<br />Sản phẩm " + productName + " hiện đang có gói trả góp 0%. (trả góp 0% là gói trả góp đặc biệt rất hấp dẫn, không phải chịu bất kỳ lãi suất nào từ công ty cho vay). </br> ";
                                                        //send ds ctytc

                                                        var jsonbuttonFinancialCompany = getButtonFinancialCompany(productID, productName, sender, siteid, replyobject, questionTitle);
                                                        console.log(jsonbuttonFinancialCompany);


                                                        SentToClientButton(sender, jsonbuttonFinancialCompany)
                                                            .catch(console.error);



                                                    }
                                                    else {
                                                        resultanswer += "<br />Sản phẩm này không hỗ trợ trả góp 0%. Mời bạn thêm một số thông tin sau để xem góp trả góp thường phù hợp nhất. </br> ";
                                                        resultanswer += "1. Bạn muốn trả trước bao nhiêu %? (vui lòng chỉ nhập số, ví dụ: 10,20,30...</br>";

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

                                            resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "'>" + seoURL + "</a>" + "<br />";

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

                var rn = randomNumber(offense.length);
                resultanswer += offense[rn];

                //var resultanswer2 = "Bạn có rảnh không? Rảnh thì mua điện thoại ở công ty Thế Giới Di Động của mình. Bảo đảm là \"Danh bất hư truyền\". :p"

                intent = "offense";
                sessions[sessionId].prev_intent = "offense";
            }

            else if (intent === "ask_consultant") {
                questionTitle = "Tư vấn sản phẩm.";

                resultanswer += "<br />Chức năng tư vấn sản phẩm đang phát triển. Xin lỗi vì sự bất tiện này!"
                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";
                intent = "ask_consultant";
                sessions[sessionId].prev_intent = "ask_consultant";

                sessions[sessionId].product = null;
            }


            else if (intent === "ask_name") {
                questionTitle = "Hỏi tên";
                var rn = randomNumber(ask_name.length);
                resultanswer = ask_name[rn];

                intent = "ask_name";
                sessions[sessionId].prev_intent = "ask_name";
            }

            else if (intent === "felling_love") {
                questionTitle = "Cảm xúc";
                resultanswer = "Cảm ơn bạn. Rất hân hạnh được phục vụ bạn. !" + "<br />";

                intent = "felling_love";
                sessions[sessionId].prev_intent = "felling_love";
            }

            else if (intent === "felling_price") {
                questionTitle = "Cảm xúc giá";
                resultanswer = "Chất lượng sản phẩm ở Thế Giới Di Động được cam kết là chất lượng và chính hãng nha bạn. Giá cả rất hợp lý cho người mua ạ. " + "<br />";

                //suggest kh
                intent = "felling_price";
                sessions[sessionId].prev_intent = "felling_price";
            }
            else if (intent === "ask_delivery") {
                questionTitle = "Giao hàng";
                resultanswer = "Chức năng giao hàng đang được phát triển... Xin lỗi bạn vì sự bất tiện này!";
                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";

                //suggest kh
                intent = "ask_delivery";
                sessions[sessionId].prev_intent = "ask_delivery";
            }
            else if (intent === "ask_compare") {
                questionTitle = "So sánh";
                resultanswer = "Muốn so sánh lựa chọn, vui lòng truy cập https://www.thegioididong.com/hoi-dap để được trả lời cụ thể hơn nha bạn!";

                resultanswer += "Bạn có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho bạn tốt hơn. ";

                //suggest kh
                intent = "ask_compare";
                sessions[sessionId].prev_intent = "ask_compare";
            }
            else if (intent == "ask_helper") {

                resultanswer = "Danh sách tổng đài hỗ trợ của TGDD: <br />";
                resultanswer += "<ul><li> Gọi mua hàng 1800.1060 (7: 30 - 22: 00)</li> <li> Gọi khiếu nại 1800.1062 (8: 00 - 21: 30)</li> <li> Gọi bảo hành 1800.1064 (8: 00 - 21: 00)</li> <li>Hỗ trợ kỹ thuật 1800.1763 (7: 30 - 22: 00) </li> </ul>";


            }
            else if (intent == "ans_tel") {
                resultanswer = "Cảm ơn bạn.Chúng tôi sẽ liên hệ bạn sớm nhất có thể. Bạn cần tư vấn hỗ trợ gì nữa không ạ?";
            }

            else {
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
    if (button_payload_state == "1") {
        questionTitle = "Hỏi thông tin sản phẩm"
        resultanswer = "Bạn muốn hỏi thông tin sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_stock";
    }
    else if (button_payload_state == "2") {
        questionTitle = "Hỏi giá sản phẩm"
        resultanswer = "Bạn muốn hỏi giá sản phẩm nào ạ?"
        sessions[sessionId].prev_intent = "ask_price";
    }
    else if (button_payload_state == "3") {
        questionTitle = "Hỏi khuyễn mãi sản phẩm"
        resultanswer = "Bạn muốn xem khuyễn mãi của sản phẩm nào ạ?"

        sessions[sessionId].prev_intent = "ask_promotion";
    }
    else if (button_payload_state == "4") {
        questionTitle = "Thông tin trả góp"
        resultanswer = "Xin lỗi. Chức năng THÔNG TIN TRẢ GÓP đang được phát triển. Vui lòng chọn dịch vụ khác. Xin lỗi vì sự bất tiện này. "
        sessions[sessionId].prev_intent = "ask_instalment";
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
const responsepostbackfinacilcompany = (sender, sessionId, button_payload_state, replyobject, siteid) => {

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


                getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);

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
                responsepostbackfinacilcompany(sender, sessionId, button_payload_state, replyobject, siteid);
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

