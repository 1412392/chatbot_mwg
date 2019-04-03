var questionTitle = "";
var resultanswer = "";
var SendMessage = require('../services/SendMessage');
var CommonHelper = require('../helpers/commonhelper');
var ProductAPI = require('../services/ProductAPI');
var InstallmentAPI = require('../services/InstallmentAPI');
var helpernumber = require('../helpers/helpernumber');
var logerror = require('../helpers/loghelper');
var Elastic = require('../services/Elastic');
var ConstConfig = require('../const/config');

const ERRORFILE_PATH = "/home/tgdd/error_logs_chatmodule/errorlogs.txt";

module.exports = {
    StockModule: function (sessions, sessionId, sender, siteid, replyobject, intent, unknowproduct, button_payload_state) {
        try {

            sessions[sessionId].prev_intent = "ask_stock";

            questionTitle = "Thông tin sản phẩm!";
            //ten san pham, gia ca, dia chi, mau sac

            if (sessions[sessionId].product) {

                var productName = sessions[sessionId].product;
                console.log("=====productname=====", productName);

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

                ProductAPI.APIGetProductSearch(ConstConfig.URLAPI_PRODUCT, argsSearchProduct, function getResult(result) {

                    //console.log(result);
                    if (result.SearchProductPhiResult != null) {

                        //console.log("================KẾT QUẢ SEARCH===============");
                        //console.log(result.SearchProductPhiResult);

                        //console.log("============================================");

                        var productID = result.SearchProductPhiResult.string[0];
                        sessions[sessionId].productID = productID;

                        var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                        var lstproduct = result;

                        ProductAPI.APIGetProductDetail(ConstConfig.URLAPI_PRODUCT, argsProductDetail, function getResult(result) {


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

                                ProductAPI.APIGetSeoURLProduct(ConstConfig.URLAPI_CATEGORY, argsProductDetailGetSeoURL, function callback(seoURL) {

                                    resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                    if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 1) || (result.GetProductResult.productErpPriceBOField.priceField.toString() === "0") ||
                                        (result.GetProductResult.productErpPriceBOField.priceField.toString() === "-1")) {
                                        resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại <span style='color:red'>ngừng kinh doanh</span>. Vui lòng chọn sản phẩm khác ạ!";


                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                    }
                                    else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField == 2) || ((result.GetProductResult.productErpPriceBOField.priceField).toString() === "0")) {
                                        resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  hỏi hiện tại đang tạm hết hàng. Vui lòng chọn sản phẩm khác ạ!";


                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                    }
                                    else {

                                        //nếu có tỉnh/tp mới, reset lại huyện

                                        if (province && !district) {//có province, không có district

                                            //lấy provinceID

                                            var index = "locationdata";
                                            var type = "province";
                                            Elastic.getElasticSearch(index, type, province, function callbackEL(err, result) {
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
                                                    if (CommonHelper.hasNumber(color)) {
                                                        argsProductStock = {
                                                            productID: parseInt(productID), productCode: color, provinceID: provinceID,
                                                            districtID: 0, pageSize: 30, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                        };
                                                    }
                                                    else {
                                                        argsProductStock = {
                                                            productID: parseInt(productID), productCode: null, provinceID: provinceID,
                                                            districtID: 0, pageSize: 30, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                        };
                                                    }

                                                    ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
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


                                                            SendMessage.SentToClientButton(sender, bodyjson, intent, replyobject)
                                                                .catch(console.error);


                                                            //===========================================================================================


                                                            //lấy danh sách huyện của tỉnh đó

                                                            var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };

                                                            SendMessage.SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);


                                                        }
                                                        else {//hết hàng
                                                            SendMessage.SentToClient(sender, "Rất tiếc. Sản phẩm " + productName + " đã <span style='color:red'>HẾT HÀNG HOẶC ĐANG NHẬP VỀ</span> tại khu vực " + provinceName + " của " + sessions[sessionId].gender + " ! Vui lòng chọn lại khu vực lân cận.", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                .catch(console.error);

                                                        }

                                                    });//end APIGetDistrictByProvince

                                                }
                                                else {

                                                    sessions[sessionId].province = null;
                                                    SendMessage.SentToClient(sender, "Không nhận diện được Tỉnh/Thành Phố " + sessions[sessionId].gender + "  đang ở. Vui lòng cung cấp tỉnh/Thành trước. (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
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
                                            Elastic.getElasticSearchDistrictAndProvince(index, type, district, sessions[sessionId].provinveID, function callbackEL(err, result) {
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
                                                        if (CommonHelper.hasNumber(color)) {
                                                            argsProductStock = {
                                                                productID: parseInt(productID), productCode: color, provinceID: parseInt(provinceID),
                                                                districtID: parseInt(districtID), pageSize: 20, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                            };
                                                        }
                                                        else {
                                                            argsProductStock = {
                                                                productID: parseInt(productID), productCode: null, provinceID: parseInt(provinceID),
                                                                districtID: parseInt(districtID), pageSize: 20, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                            };
                                                        }
                                                        ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
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



                                                                SendMessage.SentToClientButton(sender, bodyjson, intent, replyobject)
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
                                                                        SendMessage.SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                            .catch(console.error);
                                                                    }, 1500);

                                                                }
                                                                else {
                                                                    resultanswer += "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm để xem danh sách cửa hàng còn hàng!";
                                                                    SendMessage.SendToUserListColor(sessions, sessionId, sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);
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

                                                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, 0, "option_whenoutcolorstock", replyobject, siteid)
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

                                                                    SendMessage.SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);

                                                                    //=======================================================================


                                                                }

                                                            }

                                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
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
                                                        SendMessage.SentToClientButton(sender, bodyjson, intent, replyobject)
                                                            .catch(console.error);
                                                    }

                                                }
                                                else {//trường hợp này có thể là tỉnh/thành phố một đằng (ID) mà huyện/quận lại một nẻo

                                                    //Dùng elastic, search theo đơn vị nhỏ nhất là quận/huyện (không theo province ID), Suggest ra tầm 3 kết quả 

                                                    var index1 = "locationdata";
                                                    var type1 = "district";
                                                    Elastic.getElasticSearch(index1, type1, province, function callbackEL(err, result) {
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
                                                            SendMessage.SentToClientButton(sender, bodyjson, intent, replyobject)
                                                                .catch(console.error);
                                                        }

                                                        else {

                                                            SendMessage.SentToClient(sender, "" + sessions[sessionId].gender + "  đang ở Tỉnh/Thành phố nào ạ? (VIẾT HOA CHỮ ĐẦU). Ví dụ: Phú Yên, Hồ Chí Minh, Hà Nội...", questionTitle, button_payload_state, intent, replyobject, siteid)
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
                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                    }

                                });
                            }

                            else {
                                resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG KINH DOANH</span> tại Thế giới di động. Vui lòng hỏi sản phẩm khác.";
                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
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

                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                            .catch(console.error);

                    }

                });


            }//end if (sessions[sessionId].product)

            else {
                var rn = CommonHelper.randomNumber(unknowproduct.length);
                resultanswer = unknowproduct[rn];
            }
        }
        catch (err) {
            logerror.WriteLogToFile(ConstConfig.ERRORFILE_PATH, "Error at stockmodule 686: " + err);
        }
    }
}