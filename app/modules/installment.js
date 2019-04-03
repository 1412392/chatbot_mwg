
var questionTitle = "";
var resultanswer = "";
var SendMessage = require('../services/SendMessage');
var CommonHelper = require('../helpers/commonhelper');
var ProductAPI = require('../services/ProductAPI');
var InstallmentAPI = require('../services/InstallmentAPI');
var helpernumber = require('../helpers/helpernumber');
var logerror = require('../helpers/loghelper');

var urlApiProduct = "http://api.thegioididong.com/ProductSvc.svc?singleWsdl";
var urlApiCategory = "http://api.thegioididong.com/CategorySvc.svc?singleWsdl";
var urlwcfProduct = "http://webservice.thegioididong.com/ProductSvc.asmx?wsdl";
const ERRORFILE_PATH = "/home/tgdd/error_logs_chatmodule/errorlogs.txt";

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
                                title: "Xem chi tiết hồ sơ yêu cầu",
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
const Check1PTInstalment = (packageInfo) => {
    for (var i = 0; i < packageInfo.length; i++) {
        if (parseInt(packageInfo[i].GetFeatureInstallment2018Result.PercentInstallment) === 1) {
            return true;
        }
    }
    return false;
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
    //console.log("====lstPromotion====", lstPromotion);

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
            title: "Xem trả góp 0% & 1% lãi suất (Không áp dụng giảm giá)",
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
const format_currency = (price) => {

    return price.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

}
module.exports = {
    InstallmentModule: function (sessions, intent, ishaveMonthInstalment, ishavePercentInstalment, ishaveProductEntity, isAsk0PTInstalment,
        ishaveMoneyPrepaidInstalment, sessionId, sender, button_payload_state, replyobject, siteid, productnotfound) {
        try {
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
                    //nếu pre_intent  mà how hoặc brierfsupport thì bỏ qua luôn
                    if (sessions[sessionId].prev_intent.includes("how") || sessions[sessionId].prev_intent.includes("briefsupport")) {
                        sessions[sessionId].prev_intent = intent;
                        return;
                    }
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
        2. Giấy tờ CMND bản gốc không quá 15 năm, rõ hình, chữ (có thể thay thế bằng thẻ căn cước)</br>\
        <span style='color:red;'>Tùy theo gói trả góp sẽ có thêm yêu cầu giấy tờ:</span>  </br>\
        3. Bằng lái xe (xe máy, ô tô, xe tải...) (còn thời hạn)</br>\
        4. Sổ hộ khẩu (phải có tên người trả góp), chấp nhận bản photo có công chứng không quá 3 tháng (photo nguyên cuốn) (trả góp 0đ và vay trên 10 triệu mới cần sổ hộ khẩu)</br>\
        5. Hóa đơn điện(cáp/nước/internet- không bắt buộc) có địa chỉ trùng với địa chỉ trên CMND để được hưởng lãi suất tốt nhất "+ sessions[sessionId].gender + " nhé</br>\
        <span style='color:red;font-style:italic'>LƯU Ý: THỜI GIAN DUYỆT HỒ SƠ TỪ 4-14 TIẾNG Ạ.</span></p>";
                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "how") {
                resultanswer = "<p>Dạ, về thủ tục mua trả góp online: " + sessions[sessionId].gender + " chọn sản phẩm và gói trả góp phù hợp\
        ,sau đó đặt trên web, điền thông tin đầy đủ và chờ công ty tài chính sẽ gọi là cho "+ sessions[sessionId].gender + " để xác nhận ạ. Hồ sơ sẽ được thông báo kết quả trong vòng 4h-14h ạ. Sau khi duyệt xong, " + sessions[sessionId].gender + " mang đầy đủ giấy tờ và tiền trả trước ra siêu thị đối chứng và làm hợp đồng nhận máy ạ.</br>\
        Hoặc cách khác là "+ sessions[sessionId].gender + " có thể ra trực tiếp siêu thị TGDD để làm thủ tục trả góp luôn ạ. Lưu ý: cần mang đầy đủ giấy tờ và tiền trả trước ra siêu thị để được duyệt hồ sơ và nhận máy nhanh nhất</p>";

                //send button briefsupport
                var jsonbuttonBrief = getButtonBriefSupport(sender, siteid, replyobject, resultanswer);
                setTimeout(() => {
                    SendMessage.SentToClientButton(sender, jsonbuttonBrief, "ask_instalment+how", replyobject)
                        .catch(console.error);

                }, 100);

                return;
            }
            else if (subIntent === "information") {

                if (!sessions[sessionId].product) {

                    resultanswer += "" + sessions[sessionId].gender + "  muốn hỏi thông tin trả góp cho sản phẩm nào ạ?";
                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                        .catch(console.error);
                    return;
                }
                else {
                    //check sản phẩm có hỗ trợ trả góp hay không
                    var productID = sessions[sessionId].productID_currentUrl;
                    var productName = sessions[sessionId].product;
                    console.log("===ProductName: " + productName + ",===ProductID:", productID);

                    var keyword = productName;
                    var argsSearchProduct = "";

                    if (CommonHelper.isIncludeAccessoryKeyword(keyword))//search phụ kiện
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
                    ProductAPI.APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                        if (result.SearchProductPhiResult != null) {

                            var productID = result.SearchProductPhiResult.string[0];
                            console.log("=====ProductID from APIGetProductSearch=====", productID);


                            sessions[sessionId].productID = productID;

                            var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                            var lstproduct = result;

                            ProductAPI.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
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

                                    var productCapacity = "";
                                    if (productDetail.capacityField.toLowerCase().includes("gb")) {
                                        productCapacity = productDetail.capacityField;
                                    }
                                    //console.log(result);
                                    var categoryID = parseInt(result.GetProductResult.categoryIDField);
                                    var discountShockPrice = result.shockPriceByProductID;


                                    productName = result.GetProductResult.productNameField + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "");
                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "") + "<br />";
                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/></br>";

                                    resultanswer += (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>*Không xác định được giá</span>") :
                                        ("*Giá gốc: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));

                                    if (result.shockPriceByProductID > 0) {
                                        resultanswer += "</br><span style='color:#ec750f'>*Giá sốc Online (không áp dụng kèm Khuyến mãi khác và trả góp 0%-1.29%)</span>: " + "<span style='font-weight:bold'>" + (parseFloat(result.GetProductResult.productErpPriceBOField.priceField) - parseFloat(result.shockPriceByProductID)).toLocaleString() + " đ" + "</span>";

                                    }


                                    //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                    //  console.log(resultanswer);

                                    ProductAPI.APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";
                                        if (CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện tại đang trong quá trình đặt trước và chưa có sẵn hàng</p>";
                                        }
                                        //console.log(result.GetProductResult.productErpPriceBOField.webStatusIdField);
                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>ngừng kinh doanh</span>. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if ((parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || (result.GetProductResult.productErpPriceBOField.priceField).toString() === "0") && !CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại  <span style='color:red'>không có hàng</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                InstallmentAPI.APICheckZeroInstalment(urlwcfProduct, argCheckZeroInstalment, function callback(result) {

                                                    //console.log("=====CHECK=======", result);
                                                    // sessions[sessionId].isHasZeroInstallment = result;
                                                    if (isAsk0PTInstalment || ((sessions[sessionId].percent_instalment === 0 || sessions[sessionId].percent_instalment === 1) && !sessions[sessionId].isLatestAskNormalInstallment && !sessions[sessionId].isLatestAskCompanyForNormalInstalment
                                                        && !sessions[sessionId].isLatestAskBrief && !sessions[sessionId].isLatestAskMonthInstalment && !sessions[sessionId].isLatestAskPercentInstalment) ||
                                                        (!ishavePercentInstalment && !ishaveMonthInstalment && !ishaveMoneyPrepaidInstalment && !sessions[sessionId].isLatestAskBrief &&
                                                            !sessions[sessionId].isLatestAskMonthInstalment && !sessions[sessionId].isLatestAskPercentInstalment
                                                            && !sessions[sessionId].isLatestAskNormalInstallment && !sessions[sessionId].isLatestAskCompanyForNormalInstalment)) {//đéo có concat gi het thi ném gói 0% ra chứ làm me gì
                                                        console.log("======result==========", result);
                                                        if (result) {


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


                                                            InstallmentAPI.APIGetInfoZeroInstalmentPackage(urlwcfProduct, argGetZeroPackage, function (packageInfo) {
                                                                // console.log(packageInfo.GetFeatureInstallment2018Result);

                                                                if (packageInfo && packageInfo.length > 0) {
                                                                    console.log("=======packageInfo length======", packageInfo.length);

                                                                    var resultCheck1PT = Check1PTInstalment(packageInfo);
                                                                    console.log("=======resultCheck1PT======", resultCheck1PT);
                                                                    if (resultCheck1PT) {
                                                                        resultanswer += "<br />Sản phẩm " + productName + " hiện đang có gói trả góp đặc biệt (<span style='color:green'>0%</span> và <span style='color:red'>1%</span> lãi suất).</br>\
                                                                (<span style='color:green'>0% lãi suất: </span> Gói trả góp đặc biệt, không phải chịu bất kỳ lãi suất nào từ công ty cho vay). </br>\
                                                                (<span style='color:red'>1% lãi suất: </span> Gói trả góp đặc biệt, trả trước 0đ và chỉ chịu <span style='color:red'>1%</span> lãi suất). </br>\
                                                                 Lưu ý: <span style='color:purple'>Mã giảm giá không sử dụng cho gói trả góp 0%, 1%</span></br>";
                                                                        //send ds ctytc

                                                                    }
                                                                    else {
                                                                        resultanswer += "<br />Sản phẩm " + productName + " hiện đang có gói trả góp đặc biệt (<span style='color:green'>0%</span> lãi suất).</br>\
                                                                (<span style='color:green'>0% lãi suất: </span> Gói trả góp đặc biệt, không phải chịu bất kỳ lãi suất nào từ công ty cho vay). </br>\
                                                                 Lưu ý: <span style='color:purple'>Mã giảm giá không sử dụng cho gói trả góp 0%</span></br>";
                                                                        //send ds ctytc

                                                                    }
                                                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                        .catch(console.error);

                                                                    packageInfo.forEach(function (packageDetail) {
                                                                        if (!packageDetail || !packageDetail.GetFeatureInstallment2018Result) return;
                                                                        //console.log("======packageDetail======",packageDetail);
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
                                                                        //console.log("=======THAM SO 0%==========",argsInstalmentResult);

                                                                        InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                            //console.log("===============InstallmentResult==================",InstallmentResult);

                                                                            if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                // console.log("=======packageDetail======", packageDetail.GetFeatureInstallment2018Result);
                                                                                //=====================================================
                                                                                console.log("=======InstallmentResult.GetInstallmentResult2018Result===========", InstallmentResult.GetInstallmentResult2018Result);

                                                                                resultanswer = "Thông tin gói trả góp " + (parseInt(packageDetail.GetFeatureInstallment2018Result.PercentInstallment) === 0 ? "<span style='color:purple'>0%</span> " : "<span style='color:purple'>1%</span> ") +
                                                                                    (parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 1 ? "<span style='color:red;font-weight:bold'> Home Credit</span>" : parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 3 ? "<span style='color:green;font-weight:bold'>FE Credit</span>" : "") + "</br>";
                                                                                var moneyPrepaid = (packageDetail.GetFeatureInstallment2018Result.PaymentPercentFrom / 100) * (parseFloat(productPrice) - desPrice);
                                                                                resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency((productPrice - desPrice).toString()) + "đ</span></br>";
                                                                                if (desPrice > 0) {
                                                                                    resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(desPrice.toString()) + "đ</span>" + "</br>";

                                                                                }
                                                                                resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + newPercent + "%)</br>";

                                                                                //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht


                                                                                var m1 = parseFloat(productPrice) - parseFloat(desPrice) - moneyPrepaid;
                                                                                //var m2 = m1 / packageDetail.GetFeatureInstallment2018Result.PaymentMonth;
                                                                                var m2 = parseFloat(InstallmentResult.GetInstallmentResult2018Result.MoneyPayPerMonth);
                                                                                var CollectionFee = packageDetail.GetFeatureInstallment2018Result.CompanyID === 1 ? 11000 : 12000;
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

                                                                                //resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                //resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                // setTimeout(() => {
                                                                                //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                //         .catch(console.error);
                                                                                // }, 800);

                                                                                questionTitle = "Lựa chọn khác";
                                                                                var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, resultanswer, productPrice);

                                                                                setTimeout(() => {
                                                                                    SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment", replyobject)
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
                                                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 500);

                                                                    questionTitle = "Lựa chọn khác";
                                                                    var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, questionTitle);

                                                                    setTimeout(() => {
                                                                        SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment", replyobject)
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
                                                                SendMessage.SentToClientButton(sender, jsonbuttonBrief, intent, replyobject)
                                                                    .catch(console.error);
                                                            }, 600)


                                                            return;

                                                        }
                                                        else if ((sessions[sessionId].percent_instalment === null || isNaN(sessions[sessionId].percent_instalment) || typeof sessions[sessionId].percent_instalment === "undefined") || sessions[sessionId].isLatestAskPercentInstalment) {

                                                            resultanswer = "<br/><span style='font-style:italic;'>" + sessions[sessionId].gender + "  muốn trả trước bao nhiêu %? </span></br>";
                                                            sessions[sessionId].isLatestAskPercentInstalment = true;
                                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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



                                                                SendMessage.SentToClient(sender, "<span style='color:red'>Rất tiếc. Giấy tờ " + sessions[sessionId].gender + "  cung cấp không đủ điều kiện để trả góp. Xin lỗi vì sự bất tiện này.</span>", questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                InstallmentAPI.APIGetNormalInstallment(urlwcfProduct, argsGetListMonth, function (allpackages) {
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
                                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                            SendMessage.SentToClientButton(sender, jsonbuttonMI, "ask_instalment", replyobject)
                                                                                .catch(console.error);
                                                                        }, 600)

                                                                        return;


                                                                    }
                                                                    else {//không có số tháng phù hợp cho % này
                                                                        resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp cho trả trước " + sessions[sessionId].percent_instalment + "%. Mời chọn lại.</span></br>";

                                                                        setTimeout(() => {
                                                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                finalCTTC = 1;//ưu tiên home trước,
                                                                //}
                                                                // else {
                                                                //     finalCTTC = -1;
                                                                // }

                                                            }

                                                            //check xem có trùng gói 0% hay không
                                                            var argGetZeroPackage = {
                                                                CompanyId: -1,
                                                                CategoryId: -1,
                                                                ProductId: parseInt(productID),
                                                                Percent: parseInt(sessions[sessionId].percent_instalment),
                                                                Month: parseInt(sessions[sessionId].month_instalment),
                                                                MoneyLoan: -1,
                                                                FeatureType: 1,
                                                                IsDefaultPackage: -1,
                                                                SiteId: 1,
                                                                InventStatusId: 1
                                                            };
                                                            InstallmentAPI.APIGetInfoZeroInstalmentPackage(urlwcfProduct, argGetZeroPackage, function (packageInfo) {
                                                                // console.log(packageInfo.GetFeatureInstallment2018Result);
                                                                if (packageInfo && packageInfo.length > 0) {//có gói trả góp 0% trùng
                                                                    //show gói 0%
                                                                    packageInfo.forEach(function (packageDetail) {
                                                                        if (!packageDetail || !packageDetail.GetFeatureInstallment2018Result) return;
                                                                        //console.log("======packageDetail======",packageDetail);
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
                                                                        // console.log("=======THAM SO 0%==========",argsInstalmentResult);

                                                                        InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                            //console.log(InstallmentResult);
                                                                            if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                //console.log("=======packageDetail======", packageDetail.GetFeatureInstallment2018Result);
                                                                                //=====================================================
                                                                                console.log("=======InstallmentResult.GetInstallmentResult2018Result===========", InstallmentResult.GetInstallmentResult2018Result);

                                                                                resultanswer = "Thông tin gói trả góp " + (parseInt(packageDetail.GetFeatureInstallment2018Result.PercentInstallment) === 0 ? "<span style='color:purple'>0%</span> " : "<span style='color:purple'>1%</span> ") +
                                                                                    (parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 1 ? "<span style='color:red;font-weight:bold'> Home Credit</span>" : parseInt(packageDetail.GetFeatureInstallment2018Result.CompanyID) === 3 ? "<span style='color:green;font-weight:bold'>FE Credit</span>" : "") + "</br>";
                                                                                var moneyPrepaid = (packageDetail.GetFeatureInstallment2018Result.PaymentPercentFrom / 100) * (parseFloat(productPrice) - desPrice);
                                                                                resultanswer += "*Giá trả góp (sau khi trừ KM nếu có): <span style='font-weight:bold;color:red'>" + format_currency((productPrice - desPrice).toString()) + "đ</span></br>";
                                                                                if (desPrice > 0) {
                                                                                    resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(desPrice.toString()) + "đ</span>" + "</br>";

                                                                                }
                                                                                resultanswer += "*Số tiền trả trước: <span style='font-weight:bold'>" + format_currency(moneyPrepaid.toString()) + "đ</span>" + " (" + newPercent + "%)</br>";

                                                                                //tinh so tien tra gop hàng tháng=(giá-sttt)/sothangtragop+tienphiht


                                                                                var m1 = parseFloat(productPrice) - parseFloat(desPrice) - moneyPrepaid;
                                                                                //var m2 = m1 / packageDetail.GetFeatureInstallment2018Result.PaymentMonth;
                                                                                var m2 = parseFloat(InstallmentResult.GetInstallmentResult2018Result.MoneyPayPerMonth);
                                                                                var CollectionFee = packageDetail.GetFeatureInstallment2018Result.CompanyID === 1 ? 11000 : 12000;
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

                                                                                //resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                // resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                // setTimeout(() => {
                                                                                //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                //         .catch(console.error);
                                                                                // }, 800);

                                                                                questionTitle = "Lựa chọn khác";
                                                                                var anotheroptionbutton = AnotherOptionInstalment(sender, siteid, replyobject, resultanswer, productPrice);

                                                                                setTimeout(() => {
                                                                                    SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment", replyobject)
                                                                                        .catch(console.error);

                                                                                }, 100);
                                                                            }


                                                                        });
                                                                    });


                                                                }
                                                                else {
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
                                                                    InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
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
                                                                            if (discountShockPrice === 0 && bIsNotApplyPromoHC)
                                                                                productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi

                                                                            //nếu sản phẩm có giá sốc=> ưu tiên trả góp giá sốc online (giá sốc sẽ không lấy bất kỳ km nào khác cả)
                                                                            if (discountShockPrice > 0) {
                                                                                productPrice = productPrice + discountPrice;//trả về km cho gói không phải gs (nếu có)
                                                                                productPrice = productPrice - discountShockPrice;//trừ giá sốc

                                                                            }


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
                                                                            InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                                                //console.log(InstallmentResult);

                                                                                if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                    resultanswer += "</br>Thông tin gói trả góp của " + (InstallmentResult.GetInstallmentResult2018Result.CompanyID === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                                    var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                                    resultanswer += "*Giá trả góp (sau khi trừ KM nếu có, ưu tiên giá sốc nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                                    if (discountShockPrice === 0 && discountPrice > 0 && !bIsNotApplyPromoHC) {
                                                                                        resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                                    }
                                                                                    if (discountShockPrice > 0) {
                                                                                        resultanswer += "*Được hưởng giảm giá sốc: <span style='font-weight:bold'>" + format_currency(discountShockPrice.toString()) + "đ</span>" + "</br>";

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


                                                                                    var TotalPay = moneyPayInMonth * InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + moneyPrepaid;
                                                                                    var moneyDiff = (parseFloat(TotalPay) - parseFloat(productPrice)).toFixed(0);

                                                                                    resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                                    var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                                    var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                                    var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                                    var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                                    resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                                    // resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                    //resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                    resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                    setTimeout(() => {
                                                                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                            argsInstalmentResult.CompanyId = 3;
                                                                            finalCTTC = 3;
                                                                            InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                                                if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                    //====================ÁP DỤNG KHUYẾN MÃI====================
                                                                                    var discountPrice = parseFloat(GetSystemPromotionDisCountValue(productDetail, parseFloat(productPrice), false));
                                                                                    console.log("======GIA GIAM==========", discountPrice);
                                                                                    productPrice = productPrice - discountPrice;
                                                                                    var bIsNotApplyPromoHC = false;
                                                                                    bIsNotApplyPromoHC = IsSystemPromoNotApplyForCompany(productDetail, InstallmentResult.GetInstallmentResult2018Result.ErpInstallmentId);
                                                                                    if (discountShockPrice === 0 && bIsNotApplyPromoHC)
                                                                                        productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi

                                                                                    //nếu sản phẩm có giá sốc=> ưu tiên trả góp giá sốc online (giá sốc sẽ không lấy bất kỳ km nào khác cả)
                                                                                    if (discountShockPrice > 0) {
                                                                                        productPrice = productPrice + discountPrice;//trả về km cho gói không phải gs (nếu có)
                                                                                        productPrice = productPrice - discountShockPrice;//trừ giá sốc

                                                                                    }
                                                                                    // console.log("=====================productPrice=============",productPrice);
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
                                                                                    InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                                                        //console.log(InstallmentResult);

                                                                                        if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                                                            resultanswer += "</br>Thông tin gói trả góp của " + (InstallmentResult.GetInstallmentResult2018Result.CompanyID === 1 ? "<span style='color:red;font-weight:bold'>Home Credit</span>" : "<span style='color:green;font-weight:bold'>FE Credit</span>") + "</br>";
                                                                                            var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                                            resultanswer += "*Giá trả góp (sau khi trừ KM nếu có, ưu tiên giá sốc online nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                                            if (discountShockPrice === 0 && discountPrice > 0 && !bIsNotApplyPromoHC) {
                                                                                                resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                                            }
                                                                                            if (discountShockPrice > 0) {
                                                                                                resultanswer += "*Được hưởng giảm giá sốc: <span style='font-weight:bold'>" + format_currency(discountShockPrice.toString()) + "đ</span>" + "</br>";

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
                                                                                            // console.log("=======totalpay==============",parseFloat(InstallmentResult.GetInstallmentResult2018Result.TotalPay))

                                                                                            var TotalPay = moneyPayInMonth * InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + moneyPrepaid;
                                                                                            var moneyDiff = (parseFloat(TotalPay) - parseFloat(productPrice)).toFixed(0);
                                                                                            resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                                            var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                                            var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                                            var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                                            var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                                            resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                                            // resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                                            //resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                                            resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                                            setTimeout(() => {
                                                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                                                            SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment", replyobject)
                                                                                                .catch(console.error);

                                                                                        }, 400);
                                                                                    }
                                                                                    else {
                                                                                        setTimeout(() => {
                                                                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                                                                .catch(console.error);
                                                                                        }, 400);
                                                                                    }
                                                                                    return;
                                                                                }
                                                                            });
                                                                        }
                                                                    });
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
                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                                // resultanswer += "<br />"+sessions[sessionId].gender+"  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho "+sessions[sessionId].gender+"  tốt hơn. ";

                                            }
                                        }

                                    });
                                }

                                else {
                                    resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>không có hàng</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                        .catch(console.error);
                                }
                            });
                        }

                        else {
                            // var rn = randomNumber(productnotfound.length);

                            // resultanswer = productnotfound[rn];
                            resultanswer = "Dạ không tìm thấy sản phẩm <span style='color:red'>" + productName + "</span>. " + sessions[sessionId].gender + " có thể nõi rõ và đúng tên sản phẩm để phục vụ tốt hơn ạ. Em cảm ơn " + sessions[sessionId].gender + "</br>";


                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
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

                    if (CommonHelper.isIncludeAccessoryKeyword(keyword))//search phụ kiện
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
                    ProductAPI.APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                        if (result.SearchProductPhiResult != null) {
                            var productID = result.SearchProductPhiResult.string[0];
                            sessions[sessionId].productID = productID;

                            var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                            ProductAPI.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                var productDetail = result.GetProductResult;
                                console.log("============capacityField==================", productDetail.capacityField);
                                var productCapacity = "";
                                if (productDetail.capacityField.toLowerCase().includes("gb")) {
                                    productCapacity = productDetail.capacityField;
                                }
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

                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "") + "<br />";
                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/></br>";

                                    resultanswer += (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>*Không xác định được giá</span>") :
                                        ("*Giá gốc: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));

                                    if (result.shockPriceByProductID > 0) {
                                        resultanswer += "</br><span style='color:#ec750f'>*Giá sốc Online (không áp dụng kèm Khuyến mãi khác và trả góp 0%-1.29%)</span>: " + "<span style='font-weight:bold'>" + (parseFloat(result.GetProductResult.productErpPriceBOField.priceField) - parseFloat(result.shockPriceByProductID)).toLocaleString() + " đ" + "</span>";

                                    }

                                    ProductAPI.APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";
                                        //console.log(result.GetProductResult.productErpPriceBOField.webStatusIdField);
                                        if (CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện tại đang trong quá trình đặt trước và chưa có sẵn hàng</p>";
                                        }
                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>ngừng kinh doanh</span>. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if ((parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2
                                            || (result.GetProductResult.productErpPriceBOField.priceField).toString() === "0") && !CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại  <span style='color:red'>chưa có hàng</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else {
                                            var productPrice = result.GetProductResult.productErpPriceBOField.priceField === "0" ? 0 : parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                            if (productPrice >= 1200000) {
                                                var argCheckZeroInstalment = {
                                                    ProductId: productID,
                                                    SiteId: 1
                                                };
                                                InstallmentAPI.APICheckZeroInstalment(urlwcfProduct, argCheckZeroInstalment, function callback(result) {
                                                    resultanswer += "Hiện tại, <span style='color:green'>" + productName + (productCapacity ? "<span style='color:green'> (bản " + productCapacity + ")</span>" : "") + "</span> đang hỗ trợ các gói trả góp sau đây ạ";
                                                    var jsonbuttonInstalment = "";
                                                    if (result) {//co tra gop 0%                                                                                                               
                                                        jsonbuttonInstalment = getButtonInstalment(sender, siteid, replyobject, resultanswer, productPrice, true);

                                                    }
                                                    else {
                                                        jsonbuttonInstalment = getButtonInstalment(sender, siteid, replyobject, resultanswer, productPrice, false);

                                                    }
                                                    setTimeout(() => {
                                                        SendMessage.SentToClientButton(sender, jsonbuttonInstalment, "ask_instalment+issupportinstalment", replyobject)
                                                            .catch(console.error);

                                                    }, 100);
                                                });
                                            }
                                            else {
                                                resultanswer += "<br />Sản phẩm này hiện tại không hỗ trợ bất kỳ hình thức trả góp nào. " + sessions[sessionId].gender + "  có thể hỏi sản phẩm khác hoặc " + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";
                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                        }
                                    });
                                }
                                else {
                                    resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>không có hàng</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                        .catch(console.error);
                                }
                            });
                        }
                        else {
                            resultanswer = "Dạ không tìm thấy sản phẩm <span style='color:red'>" + productName + "</span>. " + sessions[sessionId].gender + " có thể nõi rõ và đúng tên sản phẩm để phục vụ tốt hơn ạ. Em cảm ơn " + sessions[sessionId].gender + "</br>";
                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                .catch(console.error);

                        }
                    });
                }

            }
            else if (subIntent === "package0d") {
                questionTitle = "Trả trước 0đ";
                if (!sessions[sessionId].product) {
                    resultanswer = "Dạ, mua trả trước 0đ (nghĩa là không có tiền vẫn mua máy được) cần <span style='color:red'>Hộ Khẩu + CMND</span> và các sản phẩm tầm giá từ 2 triệu - 25 triệu đều hỗ trợ trả trước 0đ qua công ty <span style='color:green'>FE Credit</span> nha " + sessions[sessionId].gender + ", nhưng lãi suất sẽ tương đối cao ạ. Không biết " + sessions[sessionId].gender + " quan tâm đến\
        trả trước 0đ cho sản phẩm nào ạ? Em sẽ tính giúp "+ sessions[sessionId].gender + " thông tin trả góp";
                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
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

                    if (CommonHelper.isIncludeAccessoryKeyword(keyword))//search phụ kiện
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
                    ProductAPI.APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                        if (result.SearchProductPhiResult != null) {

                            var productID = result.SearchProductPhiResult.string[0];
                            sessions[sessionId].productID = productID;

                            var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                            var lstproduct = result;

                            ProductAPI.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
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

                                    var productCapacity = "";
                                    if (productDetail.capacityField.toLowerCase().includes("gb")) {
                                        productCapacity = productDetail.capacityField;
                                    }
                                    //console.log(result);
                                    var categoryID = parseInt(result.GetProductResult.categoryIDField);
                                    var productPrice = parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                    var productNameField = result.GetProductResult.productNameField;
                                    var productOriginPrice = parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "") + "<br />";

                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/></br>";

                                    resultanswer += (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>*Không xác định được giá</span>") :
                                        ("*Giá gốc: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));

                                    if (result.shockPriceByProductID > 0) {
                                        resultanswer += "</br><span style='color:#ec750f'>*Giá sốc Online (không áp dụng kèm Khuyến mãi khác và trả góp 0%-1.29%)</span>: " + "<span style='font-weight:bold'>" + (parseFloat(result.GetProductResult.productErpPriceBOField.priceField) - parseFloat(result.shockPriceByProductID)).toLocaleString() + " đ" + "</span>";

                                    }
                                    var discountShockPrice = result.shockPriceByProductID;

                                    //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                    //  console.log(resultanswer);

                                    ProductAPI.APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";
                                        if (CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện tại đang trong quá trình đặt trước và chưa có sẵn hàng</p>";
                                        }
                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>ngừng kinh doanh</span>. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if ((parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || (result.GetProductResult.productErpPriceBOField.priceField).toString() === "0") && !CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>chưa có hàng</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else {
                                            if (productPrice <= 2000000 || productPrice > 25000000) {
                                                resultanswer += "<br /><span style='color:red'>Không hỗ trợ trả trước 0đ cho sản phẩm này</span>. </br> ";

                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
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
                                                    SendMessage.SentToClientButton(sender, jsonbuttonMI, "ask_instalment", replyobject)
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
                                                BriefId: 1,//có thêm 4 nữa
                                                ListDealId: -1,
                                                ProductId: -1,
                                                CollectionFee: 12000,
                                                SiteId: 1,
                                                InventStatusId: 1
                                            }
                                            InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, argsInstalmentResult, function (InstallmentResult) {
                                                //console.log(InstallmentResult);    
                                                if (InstallmentResult && InstallmentResult.GetInstallmentResult2018Result) {
                                                    //====================ÁP DỤNG KHUYẾN MÃI====================
                                                    var discountPrice = parseFloat(GetSystemPromotionDisCountValue(productDetail, parseFloat(productPrice), false));
                                                    console.log("======GIA GIAM==========", discountPrice);
                                                    productPrice = productPrice - discountPrice;
                                                    var bIsNotApplyPromoHC = false;
                                                    bIsNotApplyPromoHC = IsSystemPromoNotApplyForCompany(productDetail, InstallmentResult.GetInstallmentResult2018Result.ErpInstallmentId);
                                                    if (discountShockPrice === 0 && bIsNotApplyPromoHC)
                                                        productPrice = productPrice + discountPrice; //trả lại giá trị trước khuyến mãi
                                                    //nếu sản phẩm có giá sốc=> ưu tiên trả góp giá sốc online (giá sốc sẽ không lấy bất kỳ km nào khác cả)
                                                    if (discountShockPrice > 0) {
                                                        productPrice = productPrice + discountPrice;//trả về km cho gói không phải gs (nếu có)
                                                        productPrice = productPrice - discountShockPrice;//trừ giá sốc

                                                    }

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
                                                    InstallmentAPI.APIGetInstallmentResult(urlwcfProduct, newargsInstalmentResult, function (InstallmentResult) {
                                                        if (InstallmentResult) {

                                                            if (InstallmentResult.GetInstallmentResult2018Result) {
                                                                resultanswer = "Thông tin gói trả trước 0đ của <span style='color:green;font-weight:bold'>FE Credit</span></br>";
                                                                resultanswer += "Tên sản phẩm: <span style='font-weight:bold'>" + productNameField + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "") + "</span></br>";
                                                                resultanswer += "Giá gốc: <span style='font-weight:bold'>" + format_currency(productOriginPrice.toString()) + "đ</span></br>";

                                                                var moneyPrepaid = (InstallmentResult.GetInstallmentResult2018Result.PaymentPercentFrom / 100) * parseFloat(productPrice);
                                                                resultanswer += "*Giá trả góp (sau khi trừ KM nếu có, ưu tiên giá sốc nếu có): <span style='font-weight:bold;color:red'>" + format_currency(productPrice.toString()) + "đ</span></br>";
                                                                if (discountShockPrice === 0 && discountPrice > 0 && !bIsNotApplyPromoHC) {
                                                                    resultanswer += "*Được áp dụng khuyễn mãi giảm tiền: <span style='font-weight:bold'>" + format_currency(discountPrice.toString()) + "đ</span>" + "</br>";

                                                                }
                                                                if (discountShockPrice > 0) {
                                                                    resultanswer += "*Được hưởng giảm giá sốc: <span style='font-weight:bold'>" + format_currency(discountShockPrice.toString()) + "đ</span>" + "</br>";

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


                                                                var TotalPay = moneyPayInMonth * InstallmentResult.GetInstallmentResult2018Result.PaymentMonth + moneyPrepaid;
                                                                var moneyDiff = (parseFloat(TotalPay) - parseFloat(productPrice)).toFixed(0);

                                                                resultanswer += "*Số tiền chênh lệch so với trả thẳng: <span style='font-weight:bold'>" + format_currency(moneyDiff) + "đ</span>" + "</br>";


                                                                var FromDate = (InstallmentResult.GetInstallmentResult2018Result.FromDate.split('T')[0]).split('-');
                                                                var ToDate = (InstallmentResult.GetInstallmentResult2018Result.ToDate.split('T')[0]).split('-');
                                                                var newFromDate = FromDate[2] + "/" + FromDate[1] + "/" + FromDate[0];
                                                                var newToDate = ToDate[2] + "/" + ToDate[1] + "/" + ToDate[0];
                                                                resultanswer += "*Yêu cầu giấy tờ: <span style='font-weight:bold'>" + listBriefID[InstallmentResult.GetInstallmentResult2018Result.BriefId - 1] + "</span>" + "</br>";

                                                                //resultanswer += "*Thời gian áp dụng: <span style='font-weight:bold'> Từ " + newFromDate + " Đến " + newToDate + "</br>";
                                                                // resultanswer += "*Lưu ý: NỘP TRỄ</br>" + "<span style='font-style:italic;color:#09892d'" + "Phí phạt góp trễ:</br>#1 - 4 ngày: Không phạt.</br>#5 - 29 ngày: 150.000đ.</br>#Phí thanh lý sớm hợp đồng: 15% tính trên số tiền gốc còn lại.</br>#Số tiền góp mỗi tháng đã bao gồm phí giao dịch ngân hàng 13.000đ và phí bảo hiểm khoản vay" + "</span>" + "</br>";

                                                                resultanswer += "<span style='color:red;font-style:italic;font-size:12px;'>Lưu ý: Số tiền thực tế có thể chênh lệch đến 10.000đ.</span>";


                                                                // setTimeout(() => {
                                                                //     SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                                //         .catch(console.error);
                                                                // }, 800);

                                                                questionTitle = "Lựa chọn khác";
                                                                var anotheroptionbutton = AnotherOptionNormalInstalment0d(sender, siteid, replyobject, resultanswer);

                                                                setTimeout(() => {
                                                                    SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d", replyobject)
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
                                                                    SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d", replyobject)
                                                                        .catch(console.error);

                                                                }, 500);

                                                            }
                                                        }
                                                        else {
                                                            resultanswer += "<br /><span style='font-style:italic;'>Rất tiếc không tìm thấy gói trả góp phù hợp.</span></br>";

                                                            setTimeout(() => {
                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                                                    .catch(console.error);
                                                            }, 400);

                                                            questionTitle = "Lựa chọn khác";
                                                            var anotheroptionbutton = AnotherOptionNormalInstalment0d(sender, siteid, replyobject, questionTitle);

                                                            setTimeout(() => {
                                                                SendMessage.SentToClientButton(sender, anotheroptionbutton, "ask_instalment+package0d", replyobject)
                                                                    .catch(console.error);

                                                            }, 800);

                                                        }
                                                    });
                                                }

                                            });
                                        }
                                        //endregion
                                    });
                                }
                                else {
                                    resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>không có hàng</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+package0d", replyobject, siteid)
                                        .catch(console.error);
                                    return;
                                }
                            });
                        }
                        else {
                            var rn = CommonHelper.randomNumber(productnotfound.length);
                            resultanswer = productnotfound[rn];

                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                .catch(console.error);

                        }
                    });
                }

            }
            else if (subIntent === "needdobrief_again") {
                questionTitle = "Làm lại hồ sơ";
                resultanswer = "Dạ, trong trường hợp " + sessions[sessionId].gender + " đã mua trả góp rồi và giờ muốn mua trả góp nữa thì bắt buộc phải làm lại hồ sơ , không sử dụng được hồ sơ cũ ạ. Xin thông tin đến " + sessions[sessionId].gender + ".";

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+needdobrief_again", replyobject, siteid)
                    .catch(console.error);

                return;
            }
            else if (subIntent === "canbuymultiproduct") {
                questionTitle = "Mua trả góp nhiều sản phẩm cùng lúc";
                resultanswer = "Dạ, hiện tại chỉ có công ty tài chính <span style='color:red'>Home Credit</span> hỗ trợ mua trả góp nhiều sản phẩm cùng lúc thôi ạ. ";

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+canbuymultiproduct", replyobject, siteid)
                    .catch(console.error);

                return;
            }
            else if (subIntent === "briefphoto") {
                questionTitle = "Giấy tờ photo công chứng";
                resultanswer = "Dạ theo quy định trả góp thì: </br>\
        1. CMND bắt buộc phải là bản gốc, <span style='color:red'>không chấp nhận bản photo công chứng</span></br>\
        2. Sổ hộ khẩu, nếu không có bản gốc thì chấp nhận bản photo có công chứng không quá 3 tháng và phải đủ 16 trang (nguyên cuốn) ạ</br>";


                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+briefphoto", replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "cancontinuepayinstalment") {
                questionTitle = "Có thể mua góp tiếp?";
                resultanswer = "Dạ, có 2 trường hợp thế này: </br>\
        1. Nếu "+ sessions[sessionId].gender + " đã trả góp xong rồi thì " + sessions[sessionId].gender + " có thể mua trả góp tiếp tục ạ. Lúc này " + sessions[sessionId].gender + " cần phải làm lại hồ sơ ạ. </br>\
        2. Nếu "+ sessions[sessionId].gender + " vẫn đang trong quá trình trả góp thì " + sessions[sessionId].gender + " vẫn có thể làm hồ sơ trả góp tiếp. \
        Lưu ý: " + sessions[sessionId].gender + " nên chọn công ty tài chính khác để tỷ lệ duyệt hồ sơ thành công cao hơn ạ.</br>";


                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+cancontinuepayinstalment", replyobject, siteid)
                    .catch(console.error);
                return;

            }
            else if (subIntent === "information_oldproduct") {

                return;
            }
            else if (subIntent === "agecondition") {

                questionTitle = "Tuổi trả góp";
                resultanswer = "Dạ, để tham gia trả góp thì bắt buộc tuổi phải từ <span style='color:red'>20 - 60</span> ạ (tính theo ngày sinh nhật). Nếu " + sessions[sessionId].gender + " nhỏ hơn 20 tuổi thì không thể tham gia trả góp được rồi ạ. </br>\
        Do vậy, "+ sessions[sessionId].gender + " có thể nhờ người thân hoặc bạn bè đủ từ 20 đến 60 tuổi đứng tên làm hồ sơ giúp " + sessions[sessionId].gender + " ạ";
                var jsonbuttonBrief = getButtonBriefSupport(sender, siteid, replyobject, resultanswer);
                setTimeout(() => {
                    SendMessage.SentToClientButton(sender, jsonbuttonBrief, "ask_instalment+agecondition", replyobject)
                        .catch(console.error);

                }, 100);

                return;

            }
            else if (subIntent === "cancontinuepayinstalment_whenloan") {
                questionTitle = "Vay có thể góp";
                resultanswer = "Dạ, hiện tại có 2 công ty tài chính hỗ trợ trả góp online là <span style='color:green'>FECredit</span> và <span style='color:red'>HomeCredit</span>.\
         Nếu "+ sessions[sessionId].gender + " đang vay tiền bên ngân hàng này thì có thể tham gia trả góp ngân hàng kia để được duyệt hồ sơ ạ. </br>\
         Ví dụ, nếu "+ sessions[sessionId].gender + " đang vay tiền tại <span style='color:green'>FECredit</span> thì có thể làm hồ sơ mua trả góp tại công ty <span style='color:red'>HomeCredit</span> ạ</br>";
                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+cancontinuepayinstalment_whenloan", replyobject, siteid)
                    .catch(console.error);
                return;

            }
            else if (subIntent === "timeapprove") {
                questionTitle = "Thời gian duyệt hồ sơ";
                resultanswer = "Dạ, thời gian duyệt hồ sơ online là trong vòng 24h ạ. Nếu làm trực tiếp tại siêu thị thì thời gian duyệt hồ sơ tối đa 4 tiếng ạ.\
                Nếu trường hợp "+ sessions[sessionId].gender + " làm hồ sơ online thì sau khi duyệt xong, " + sessions[sessionId].gender + " mang đầy đủ giấy tờ yêu cầu và tiền trả trước ra siêu thị đối chứng lần 2, sau đó thanh toán và nhận máy ạ.</br>";
                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+timeapprove", replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "general_infomation") {
                questionTitle = "Thông tin chung";
                resultanswer = "Dạ, mời " + sessions[sessionId].gender + " tham khảo một số thông tin sau ạ: </br>\
                1. Đóng tiền trả góp hàng tháng: "+ sessions[sessionId].gender + " có thể đóng tiền tại bất kỳ siêu thị thế giới di động, điện máy xanh nào gần nhà nhất. Khi đi, nhớ mang theo số hợp đồng trả góp. Ngoài ra " + sessions[sessionId].gender + " có \
                thể thanh toán qua MoMo, ViettelPay, tại ngân hàng...Xem thêm <a href='https://www.thegioididong.com/tien-ich/thanh-toan-tra-gop' target='_blank'>tại đây</a></br>\
                2. Trong quá trình trả góp, "+ sessions[sessionId].gender + " có thể thanh toán trước hợp đồng (tức là thanh toán hết hợp đồng 1 lần). Lúc này sẽ chịu thêm phí thanh lý hợp đồng từ công ty tài chính. <span style='font-weight:bold'>Chi tiết hơn về phí và thủ tục thanh lý hợp đồng, " + sessions[sessionId].gender + " vui lòng đến siêu thị \
                để được tư vấn</span></br>\
                3. Lưu ý về việc đóng trễ và phạt: <span style='color:green'>Trễ 1 - 4 ngày: Không phạt. Trễ 5 - 29 ngày: phạt 150.000đ</span></br>\
                4. Thời gian làm việc của công ty trả góp (Home và FE Credit): Làm việc từ 9h - 21h (<span style='font-weight:bold'>kể cả ngày lễ và chủ nhật</span>)</br>\
                5. Chú ý: Khi LÀM HỢP ĐỒNG TRẢ GÓP, phải dùng giấy tờ chính chủ (CMND, BLX chính chủ và SHK phải có tên mình trên đó). Trường hợp dùng giấy tờ của người khác để tham gia trả góp, bắt buộc phải có \
                người đó có mặt, nếu không sẽ không thể làm thủ tục được.</br>"

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+general_infomation", replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "needphonefamily") {
                questionTitle = "Số điện thoại người thân";
                resultanswer = "Dạ, khi tham gia trả góp, công ty tài chính sẽ yêu cầu cung cấp 2 hoặc 3 số điện thoại của người thân để họ gọi xác nhận ạ. <span style='font-style:italic'>Có thể thay thế bằng số điện thoại của anh chị em họ, bạn bè...</span> nhưng tốt nhất là nên \
                cung cấp số điện thoại người thân để tỷ lệ duyệt hồ sơ được cao nhất ạ.</br>";

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+needphonefamily", replyobject, siteid)
                    .catch(console.error);
                return;

            }
            else if (subIntent === "listcompanyinstalment") {
                questionTitle = "Danh sách công ty trả góp ở thegioididong.com";
                resultanswer = "Hiện tại, ở Thế Giới Di Động có 2 công ty hỗ trợ trả góp online là <span style='color:red;font-weight:bold'> Home Credit</span> và <span style='color:green;font-weight:bold'> FE Credit</span>.\
                Về công ty <span style='color:#8529ad;font-weight:bold'>ACS</span> chỉ có ở Điện Máy Xanh, công ty <span style='color:blue;font-weight:bold'>HD Sai Gon</span> chỉ hỗ trợ tại một số siêu thị của Thế giới di động ạ. Xin thông tin đến "+ sessions[sessionId].gender + "</br>";
                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+listcompanyinstalment", replyobject, siteid)
                    .catch(console.error);
                return;

            }
            else if (subIntent === "minpayinstalment") {
                questionTitle = "Mức trả góp";
                resultanswer = "1. Đối với gói trả góp thường: Mức trả trước từ 10% đến 80%, và trả trong vòng 6, 9 hoặc 12 tháng (một số sản phẩm có hỗ trợ 4 tháng, 8 tháng)</br>\
                2. Đối với gói lãi suất đặc biệt 0% và 1%: Thì mức trả trước và số tháng trả góp phải theo quy định của công ty đặt ra cho từng sản phẩm ạ. </br>";

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+minpayinstalment", replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "additionalbil_instalment") {
                questionTitle = "Bổ sung hóa đơn điện nước";
                resultanswer = "Nếu " + sessions[sessionId].gender + " có hóa đơn điện/nước/internet (trong vòng 3 tháng gần nhất), sẽ được hưởng lãi suất tốt hơn ạ.</br> Ví dụ: \
                Nếu sản phẩm có lãi suất là 3%, thì khi có hóa đơn điện/nước/internet, "+ sessions[sessionId].gender + " sẽ được giảm lãi suất còn 2% chẳng hạn (đây chỉ là ví dụ). Xin thông tin đến " + sessions[sessionId].gender + " ạ.</br>";

                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+additionalbil_instalment", replyobject, siteid)
                    .catch(console.error);
                return;
            }
            else if (subIntent === "promotion") {
                questionTitle = "Khuyễn mãi khi trả góp";
                resultanswer = "";
                if (sessions[sessionId].product) {
                    var productName = sessions[sessionId].product;
                    console.log(productName);
                    var keyword = productName;
                    var argsSearchProduct = "";

                    if (CommonHelper.isIncludeAccessoryKeyword(keyword))//search phụ kiện
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
                    ProductAPI.APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                        if (result.SearchProductPhiResult != null) {
                            var productID = result.SearchProductPhiResult.string[0];
                            sessions[sessionId].productID = productID;

                            var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                            ProductAPI.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                var productDetail = result.GetProductResult;
                                console.log("============capacityField==================", productDetail.capacityField);
                                var productCapacity = "";
                                if (productDetail.capacityField.toLowerCase().includes("gb")) {
                                    productCapacity = productDetail.capacityField;
                                }
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

                                    resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + (productCapacity ? "<span style='color:red'> bản " + productCapacity + "</span>" : "") + "<br />";
                                    resultanswer += "<img width='120' height='120'  src='" + result.GetProductResult.mimageUrlField + "'" + "/></br>";

                                    resultanswer += (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("<span style='font-weight:bold'>*Không xác định được giá</span>") :
                                        ("*Giá gốc: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));

                                    if (result.shockPriceByProductID > 0) {
                                        resultanswer += "</br><span style='color:#ec750f'>*Giá sốc Online (không áp dụng kèm Khuyến mãi khác và trả góp 0%-1.29%)</span>: " + "<span style='font-weight:bold'>" + (parseFloat(result.GetProductResult.productErpPriceBOField.priceField) - parseFloat(result.shockPriceByProductID)).toLocaleString() + " đ" + "</span>";

                                    }

                                    ProductAPI.APIGetSeoURLProduct(urlApiCategory, argsProductDetailGetSeoURL, function callback(seoURL) {
                                        resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                        if (CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện tại đang trong quá trình đặt trước và chưa có sẵn hàng</p>";
                                        }
                                        if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 1 || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0")) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>ngừng kinh doanh</span>. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else if ((parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 2 || (result.GetProductResult.productErpPriceBOField.priceField).toString() === "0") && !CommonHelper.IsPreoder(result.GetProductResult)) {
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại  <span style='color:red'>chưa có hàng</span> tại TGDD. Vui lòng chọn sản phẩm khác ạ!";

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment", replyobject, siteid)
                                                .catch(console.error);
                                        }
                                        else {
                                            var productPrice = result.GetProductResult.productErpPriceBOField.priceField === "0" ? 0 : parseFloat(result.GetProductResult.productErpPriceBOField.priceField);
                                            if (productPrice >= 1200000) {
                                                console.log("======Danh sách khuyễn mãi=============");
                                                if (productDetail.promotionField && productDetail.promotionField.Promotion.length > 0) {
                                                    resultanswer += "<br /><p>Thông tin khuyến mãi khi mua trả góp:</p> ";
                                                    var km_count = 0;
                                                    var lstGroupNamePromotion = [];
                                                    for (var i = 0; i < productDetail.promotionField.Promotion.length; i++) {

                                                        var currentPromotion = productDetail.promotionField.Promotion[i];


                                                        console.log("======================" + (i + 1) + "=========================");
                                                        console.log(currentPromotion);
                                                        console.log("===============================================");
                                                        // if (!currentPromotion.homePageDescriptionField || currentPromotion.homePageDescriptionField === "undefined") {

                                                        // }
                                                        if (currentPromotion.promotionListGroupNameField && !lstGroupNamePromotion.includes(currentPromotion.promotionListGroupNameField.toLowerCase())) {

                                                            // resultanswer += "<p style='color:red'>" + currentPromotion.homePageDescriptionField + "</p>";
                                                            var fromDate = currentPromotion.beginDateField.split('T')[0];
                                                            var endDate = currentPromotion.endDateField.split('T')[0];
                                                            var fromDateSplit = fromDate.split("-");
                                                            var toDateSplit = endDate.split("-");

                                                            if (currentPromotion.groupIDField.toLowerCase() !== "bankem") {

                                                                resultanswer += (++km_count) + ". <span style='font-style:italic'>" + currentPromotion.promotionListGroupNameField + " ( <span style='color:green'> Từ " + fromDateSplit[2] + "/" + fromDateSplit[1] + " - " + toDateSplit[2] + "/" + toDateSplit[1] + "</span> )" + "</span></br>";
                                                            }

                                                        }

                                                        lstGroupNamePromotion.push(currentPromotion.promotionListGroupNameField.toLowerCase());


                                                    }
                                                    resultanswer += "<span style='color:red;font-style:italic'>*Lưu ý: Không áp dụng mã giảm giá, copule, phiếu mua hàng vào hình thức trả góp 0% và 1%</span></br<";
                                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+promotion", replyobject, siteid)
                                                        .catch(console.error);
                                                }
                                                else {
                                                    resultanswer += "<p style='color:red'>Hiện tại không có chương trình khuyến mãi nào dành cho sản phẩm này!</p>";
                                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+promotion", replyobject, siteid)
                                                        .catch(console.error);
                                                }

                                            }
                                            else {
                                                resultanswer += "<br />Sản phẩm này hiện tại không hỗ trợ bất kỳ hình thức trả góp nào. " + sessions[sessionId].gender + "  có thể hỏi sản phẩm khác hoặc " + sessions[sessionId].gender + "  có thể cung cấp cho mình số điện thoại để bên mình có thể liên lạc tư vấn cho " + sessions[sessionId].gender + "  tốt hơn. ";
                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+promotion", replyobject, siteid)
                                                    .catch(console.error);
                                            }
                                        }
                                    });
                                }
                                else {
                                    resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>không có hàng</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, "ask_instalment+promotion", replyobject, siteid)
                                        .catch(console.error);
                                }
                            });
                        }
                        else {
                            resultanswer = "Dạ không tìm thấy sản phẩm <span style='color:red'>" + productName + "</span>. " + sessions[sessionId].gender + " có thể nõi rõ và đúng tên sản phẩm để phục vụ tốt hơn ạ. Em cảm ơn " + sessions[sessionId].gender + "</br>";
                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                .catch(console.error);

                        }
                    });
                }

                return;
            }


        }
        catch (err) {
            logerror.WriteLogToFile(ERRORFILE_PATH, "Error at 2377: " + err);
        }
    }
}
