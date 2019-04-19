var tracechat = require('../helpers/index');
var logerror = require('../helpers/loghelper');
var helpernumber = require('../helpers/helpernumber');
var fetch = require('node-fetch');
var request = require("request")
var path = require('path');
var elasticsearch = require('elasticsearch');
var soap = require('soap');
var fs = require('fs');
const line = require('@line/bot-sdk');
const https = require('https');
var fetchTimeout = require('fetch-timeout');
var helpersentence = require('../helpers/helpersentence');
var CommonHelper = require('../helpers/commonhelper');

var SendMessage = require('../services/SendMessage');
var InstallmentModule = require('../modules/installment');
var StockModule = require('../modules/stock');

var ProductAPI = require('../services/ProductAPI');
var ConstConfig = require('../const/config');


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


var isGetExampleAnswer = false;

function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
        end = new Date().getTime();
    }
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

const getExactlyUrl = (currenturl) => {
    if (currenturl) {
        var finalUrl = "";
        var temptUrl = currenturl.split("thegioididong").length > 1 ? currenturl.split("thegioididong")[1].split('/') : [];
        if (temptUrl.length > 2) {
            finalUrl = temptUrl[temptUrl.length - 2] + "/" + temptUrl[temptUrl.length - 1];
        }
        if (finalUrl.includes("?")) {
            finalUrl = finalUrl.split('?')[0];
        }
        return finalUrl;

    }
    else {
        return null;
    }
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
        try {
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
                ishaveMoneyPrepaidInstalment = false, isAsk0PTInstalment = false, isHaveDistrict = false, isHaveProvince = false;


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

                                    //th đang hỏi percent gói thường thì nhảy vào gói 0đ
                                    sessions[sessionId].isLatestAskPercentInstalment = false;

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
                                intent = ASK_INSTALMENT_PACKAGE0D;
                                sessions[sessionId].prev_intent = intent;
                                //th đang hỏi percent gói thường thì nhảy vào gói 0đ
                                sessions[sessionId].isLatestAskPercentInstalment = false;
                            }
                            catch (errr) {
                                console.log("err when parse Month_instalment => isLatestAskMonth0dInstalment", err);

                            }
                        }
                    }
                }
                else {
                    // console.log("++++++++++++DCM DA VAO DAY+++++++++");
                    intent = ASK_INSTALMENT_PACKAGE0D;
                    // intent = sessions[sessionId].prev_intent;
                    sessions[sessionId].prev_intent = intent;
                    try {
                        var month = parseInt(button_payload_state.split('|')[0]);
                        sessions[sessionId].month_instalment = month;
                        console.log("=====isLatestAskMonthInstalment====", month);
                        console.log("=====intent====", intent);
                        console.log("=====prev_intent====", sessions[sessionId].prev_intent);

                        //th đang hỏi percent gói thường thì nhảy vào gói 0đ
                        sessions[sessionId].isLatestAskPercentInstalment = false;
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

                                    //bỏ đi
                                    sessions[sessionId].isLatestAskMonthInstalment = false;
                                    SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
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
                    if (intent === ASK_INSTALMENT_PACKAGE0D) {
                        sessions[sessionId].isLatestAskMonth0dInstalment = true;
                    }
                    else {
                        sessions[sessionId].isLatestAskMonthInstalment = true;
                    }

                }

                else if (button_payload_state === "INSTALMENT_PACKAGE0D") {
                    intent = ASK_INSTALMENT_PACKAGE0D;
                    sessions[sessionId].isLatestAskPercentInstalment = false;

                }
                else if (button_payload_state === "INSTALMENT_0PTLS") {
                    intent = ASK_INSTALMENT_INFORMATION;
                    isAsk0PTInstalment = true;

                }

                else {

                    //chỉ resset lại color (vì color sẽ khác với sp khác)
                    if (CommonHelper.hasNumber(sessions[sessionId].colorProductCode))//nó là productcode
                    {
                        //console.log("==============MÃ MÀU PRODUCTCODE " + sessions[sessionId].color + " =================================");
                        sessions[sessionId].colorProductCode = null;
                    }
                    // sessions[sessionId].price=null;
                    // sessions[sessionId].province=null;
                    // sessions[sessionId].district=null;

                    if (button_payload_state.toString().trim().length >= 2 &&
                        button_payload_state.toString().length < 10 && CommonHelper.hasNumber(button_payload_state))//là districtID
                    {

                        if (parseInt(button_payload_state) >= 16) {
                            sessions[sessionId].districtID = button_payload_state;
                            sessions[sessionId].IsLatestRequireChooseDistrict = true;
                        }

                    }
                    else if (button_payload_state.length >= 10)//la productCode color
                    {
                        sessions[sessionId].isPreAskColor = true;
                        sessions[sessionId].colorProductCode = button_payload_state;
                    }

                    else if (button_payload_state === 6)//gợi ý lại danh sách màu (trường hợp này đã có product)
                    {
                        questionTitle = "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm";

                        //console.log(sessions[sessionId].productID);
                        SendMessage.SendToUserListColor(sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);

                        return;
                    }
                    else if (button_payload_state === 7)//gợi ý lại danh sách quận huyện (đã có product, province)
                    {
                        questionTitle = "Chọn quận/huyện nơi " + sessions[sessionId].gender + "  ở";
                        SendMessage.SendToUserListDistrict(sessions[sessionId].productID, sessions[sessionId].provinveID, sender, siteid, replyobject, questionTitle, intent);
                        return;
                    }
                    else if (button_payload_state === 8 || button_payload_state === 9)//cong ty tai chinh
                    {
                        sessions[sessionId].financialCompany = button_payload_state;
                        intent = ASK_INSTALMENT_INFORMATION;
                    }

                    else if (button_payload_state === "NORMAL" || button_payload_state === "BAD" || button_payload_state === "GOOD") {
                        SendMessage.SentToClient(sender, "Cảm ơn " + sessions[sessionId].gender + "  đã đánh giá. Rất vui được phục vụ " + sessions[sessionId].gender + " .", questionTitle, button_payload_state, "", replyobject, siteid)
                            .catch(console.error);
                        return;
                    }
                }


            }
            else {

                // if (CommonHelper.hasNumber(sessions[sessionId].colorProductCode))//nó là productcode
                // {
                //     //console.log(CommonHelper.hasNumber(sessions[sessionId].color));
                //     sessions[sessionId].colorProductCode = null;
                // }


                var productIndex = 0;
                for (var i = 0; i < entities.length; i++) {

                    sessions[sessionId].currentvalue = entities[i].value.replace('_', ' ');
                    if (entities[i].entity === "product") {
                        productIndex++;

                        if (entities[i].value.includes("cường lực")) {
                            entities[i].value = entities[i].value.replace("cường lực", "màn hình").replace('_', ' ');
                        }
                        //phụ kiện 
                        if (productIndex > 1 && (CommonHelper.isIncludeAccessoryKeyword(sessions[sessionId].product)
                            || CommonHelper.isIncludeAccessoryKeyword(entities[i].value.toLowerCase().replace('_', ' ')))) {
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
                        sessions[sessionId].colorProductCode=null;
                        sessions[sessionId].colorname = entities[i].value.replace('_', ' ');
                    }
                    if (entities[i].entity === "price") {
                        sessions[sessionId].price = entities[i].value.replace('_', ' ');
                    }
                    if (entities[i].entity === "province") {

                        //nếu có tỉnh mới, reset lại huyện
                        isHaveProvince = true;
                        if (sessions[sessionId].province && !isHaveDistrict) {
                            sessions[sessionId].district = null;
                            sessions[sessionId].districtID = null;
                        }
                        sessions[sessionId].province = entities[i].value.replace('_', ' ');

                    }
                    if (entities[i].entity === "district") {
                        sessions[sessionId].district = entities[i].value.replace('_', ' ');
                        sessions[sessionId].districtID = null;
                        isHaveDistrict = true;
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
                            if (entities[i].value === "o%")//bị lỗi trong mẫu câu
                            {
                                entities[i].value = "0%";
                            }
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

            //xu ly askstock_tinh thanh
            if (sessions[sessionId].IsLatestRequireLocation_Province ||
                sessions[sessionId].IsLatestRequireChooseDistrict || sessions[sessionId].isLatestUnknowProduct_AskStock) {
                intent = sessions[sessionId].prev_intent;

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



            }
            //trường hợp sản phẩm chung chung thì xem như chưa xác định
            if (sessions[sessionId].product && CommonHelper.isGeneralProduct(sessions[sessionId].product)) {
                sessions[sessionId].product = null;
            }

            console.log("===productNameBefore==", sessions[sessionId].product);


            //lấy thông tin sản phẩm từ currenturl khách hàng. Để dùng trong TH: nếu không nhận diện được sản phẩm 
            //thì dùng đến thằng này
            var currenturl = replyobject.currenturl;
            //tách url chính xác
            var finalUrl = getExactlyUrl(currenturl);

            console.log("========finalURL========", finalUrl);

            // currenturl = "dtdd/oppo-f7";
            ProductAPI.GetProductInfoByURL(sessions, ConstConfig.URLAPI_PRODUCT, finalUrl, sessionId, ishaveProductEntity).then((value) => {
                if (value) {//nếu có sản phẩm từ URL
                    sessions[sessionId].product = value.replace("+", " plus ");

                }

                console.log("===productNameAfter==", sessions[sessionId].product);
                console.log("=======intent=====", intent);
                console.log("=======pre intent=====", sessions[sessionId].prev_intent);

                if (!intent && ((!sessions[sessionId].product) && (!sessions[sessionId].province) && (!sessions[sessionId].district))) {
                    //nếu đã có trong session

                    questionTitle = "Xin chào!";
                    resultanswer = "Mình là BOT. Mình chưa rõ câu hỏi của " + sessions[sessionId].gender + "  lắm. Vui lòng chọn thông tin cần quan tâm!";
                    intent = "null";


                }
                else {

                    //câu chào HI
                    // if (customer_question.trim().toLowerCase() === "hi") {
                    //     var rn = CommonHelper.randomNumber(greet.length);
                    //     resultanswer = greet[rn];

                    //     SendMessage.SentToClient(sender, resultanswer, "Xin chào!", button_payload_state, "greet", replyobject, siteid)
                    //         .catch(console.error);
                    //     return;
                    // }

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
                    if (intent.includes("ask_instalment") || sessions[sessionId].prev_intent.includes("ask_instalment")) {

                        InstallmentModule.InstallmentModule(sessions, intent, ishaveMonthInstalment, ishavePercentInstalment, ishaveProductEntity, isAsk0PTInstalment,
                            ishaveMoneyPrepaidInstalment, sessionId, sender, button_payload_state, replyobject, siteid, productnotfound);
                    }
                    else if (intent === "ask_stock") {
                        sessions[sessionId].isLatestAskNormalInstallment = false;

                        StockModule.StockModule(sessions, sessionId, sender, siteid, replyobject, intent, unknowproduct, button_payload_state,productnotfound);

                    }


                    else {
                        sessions[sessionId].isLatestAskNormalInstallment = false;
                        resultanswer = "Em chưa rõ câu hỏi của " + sessions[sessionId].gender + "  lắm. " + sessions[sessionId].gender + "  vui lòng cung cấp rõ thông tin cần hỏi như: tên sản phẩm, giá cả, địa chỉ...Cảm ơn " + sessions[sessionId].gender + " ";
                    }


                }

                //SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                //.catch(console.error);
                //console.log(resultanswer);

            }).catch((error) => {
                console.log("======error when GetProductInfoByURL=======ENDED", error);
                logerror.WriteLogToFile(ConstConfig.ERRORFILE_PATH, "error when GetProductInfoByURL at 4883: " + error);
            });
        }
        catch (err) {
            logerror.WriteLogToFile(ConstConfig.ERRORFILE_PATH, "Error at 4887: " + err);

        }
    });

};

const responsepostbackgreet = (sender, sessionId, button_payload_state, replyobject, siteid) => {

    var resultanswer = ""
    var questionTitle = "";
    if (button_payload_state === "1") {
        questionTitle = "Hỏi thông tin sản phẩm"
        if (sessions[sessionId].product && sessions[sessionId].prev_intent != "ask_instalment") {
            var sever = ConstConfig.SERVER_RASAQUERY;
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
            var sever = ConstConfig.SERVER_RASAQUERY;
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
            var sever = ConstConfig.SERVER_RASAQUERY;
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
        var sever = ConstConfig.SERVER_RASAQUERY;
        var url = encodeURI(sever);

        getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);
        return;

    }
    SendMessage.SentToClient(sender, resultanswer, questionTitle, parseInt(button_payload_state), "", replyobject, siteid)
        .catch(console.error);


};


const responsepostbackothers = (sender, sessionId, othersID, replyobject, siteid) => {

    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);

    var button_payload_state = othersID;


    getJsonAndAnalyze(url, sender, sessionId, parseInt(button_payload_state), replyobject, siteid);


};

const responsepostbackcolor = (sender, sessionId, productCode, colorname, replyobject, siteid) => {

    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);

    var button_payload_state = productCode;

    sessions[sessionId].colorname = colorname;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
};
const responsepostbackFeedback = (sender, sessionId, feedback, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);

    var button_payload_state = feedback;


    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);

};
const responsepostbackfinancialcompany = (sender, sessionId, company, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
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

        SendMessage.SentToClientButton(sender, jsonbuttonFinancialCompany, "ask_instalment", replyobject)
            .catch(console.error);
    }
    else {
        var rn = CommonHelper.randomNumber(unknowproduct.length);
        var resultanswer = unknowproduct[rn];
        if (!resultanswer) {//trường hợp chưa load xong file từ data
            resultanswer = "Không hiểu sản phẩm " + sessions[sessionId].gender + "  đang muốn hỏi là gì?";
        }

        SendMessage.SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment", replyobject, siteid)
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

        SendMessage.SentToClientButton(sender, jsonbuttonFinancialCompany, "ask_instalment", replyobject)
            .catch(console.error);
    }
    else {
        var rn = CommonHelper.randomNumber(unknowproduct.length);
        var resultanswer = unknowproduct[rn];
        if (!resultanswer) {//trường hợp chưa load xong file từ data
            resultanswer = "Không hiểu sản phẩm " + sessions[sessionId].gender + "  đang muốn hỏi là gì?";
        }

        SendMessage.SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment", replyobject, siteid)
            .catch(console.error);

    }
}
const responsePackage0d = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);

    var button_payload_state = button_payload_state;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}
const responsePackage0PTLS = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);

    var button_payload_state = button_payload_state;
    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}



const getPercentInstalment = (sender, sessionId, messagecontent, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
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
                messagecontent.toLocaleLowerCase().includes(" 0%") ||
                messagecontent.toLocaleLowerCase().includes(" 0 %")) {//ý là trả góp 0đ
                console.log("====tra gop 0đ: =====", percent);
                getJsonAndAnalyze(url, sender, sessionId, "0", replyobject, siteid);

            }
            else {
                request({
                    url: encodeURI(ConstConfig.SERVER_RASAQUERY + messagecontent),
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
                                        SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
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
                        SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
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
        SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}
const getMonthInstalmentByInputDirect = (sender, sessionId, messagecontent, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
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
        SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}

const getMonthInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
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
        SendMessage.SentToClient(sender, resultanswer, "", -1, "", replyobject, siteid)
            .catch(console.error);

        return;

    }
}
const sendBriefSupport = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var resultanswer = "<p>Dạ, điều kiện giấy tờ trả góp của công ty tài chính là:</br>\
                    1. Đủ 20-60 tuổi</br>\
                    2. Giấy tờ CMND bản gốc không quá 15 năm, rõ hình, chữ (có thể thay thế bằng thẻ căn cước)</br>\
                    <span style='color:red;'>Tùy theo gói trả góp sẽ có thêm yêu cầu giấy tờ:</span>  </br>\
                    3. Bằng lái xe (xe máy, ô tô, xe tải...) (còn thời hạn)</br>\
                    4. Sổ hộ khẩu (phải có tên người trả góp), chấp nhận bản photo có công chứng không quá 3 tháng (photo nguyên cuốn) (trả góp 0đ và vay trên 10 triệu mới cần sổ hộ khẩu)</br>\
                    5. Hóa đơn điện(cáp/nước/internet- không bắt buộc) có địa chỉ trùng với địa chỉ trên CMND để được hưởng lãi suất tốt nhất "+ sessions[sessionId].gender + " nhé</br>\
                    <span style='color:red;font-style:italic'>LƯU Ý: THỜI GIAN DUYỆT HỒ SƠ TỪ 4-14 TIẾNG Ạ.</span></p>";

    SendMessage.SentToClient(sender, resultanswer, "", button_payload_state, "ask_instalment+briefsupport", replyobject, siteid)
        .catch(console.error);
    return;
}

const getGIDInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getBLXInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getSHKInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const getHDDNInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}

const getBriefIDInstalment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";

    getJsonAndAnalyze(url, sender, sessionId, button_payload_state, replyobject, siteid);
}

const askPercentMonthAgain = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
    var url = encodeURI(sever);
    var resultanswer = "";
    var option = parseInt(button_payload_state);

    getJsonAndAnalyze(url, sender, sessionId, option, replyobject, siteid);
}
const processNormalInstallment = (sender, sessionId, button_payload_state, replyobject, siteid) => {
    var sever = ConstConfig.SERVER_RASAQUERY;
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
        //if (hours < 8 || hours > 17) return;


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
                SendMessage.SentToClient(sender, '"+sessions[sessionId].gender+"  đáng yêu quá trời. ', "", "", "", replyobject, siteid)
                    .catch(console.error);
            } else {

                //tách module tiền xử lý dữ liệu : ký tự đặc biệt và chuẩn hóa từ viết sai

                messagecontent = helpersentence.ReplaceNonsenWord(messagecontent);
                console.log("===Customer question===", messagecontent);

                var button_payload_state = 0;//không có gì, 1: hoi sp, 2: hỏi giá, 3: hỏi km



                var sever = ConstConfig.SERVER_RASAQUERY + messagecontent;
                var url = encodeURI(sever);
                console.log("====url==========", url);


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

