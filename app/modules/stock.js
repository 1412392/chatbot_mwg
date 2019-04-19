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
var locationindex = "locationdata";
var provincetype = "province";
var districttype = "district";

module.exports = {
    StockModule: function (sessions, sessionId, sender, siteid, replyobject, intent, unknowproduct, button_payload_state, productnotfound) {
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
                var districtID;
                var provinceID;
                var colorname;
                var productCode = null;
                if (sessions[sessionId].province) {

                    province = sessions[sessionId].province;

                }
                //nếu có quận.huyện =>lấy nó
                if (sessions[sessionId].district) {

                    district = sessions[sessionId].district;

                }

                if (sessions[sessionId].colorname) {
                    colorname = sessions[sessionId].colorname;

                }
                if (sessions[sessionId].districtID) {
                    districtID = sessions[sessionId].districtID;

                }
                if (sessions[sessionId].provinveID) {
                    provinceID = sessions[sessionId].provinveID;

                }
                if (sessions[sessionId].colorProductCode) {
                    productCode = sessions[sessionId].colorProductCode;
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

                            productName = result.GetProductResult.productNameField;
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


                                //console.log(result.GetProductResult);
                                resultanswer = "Sản phẩm: " + "<span style='font-weight:bold'>" + result.GetProductResult.productNameField + "</span>" + (colorname ? ("<span style='font-style:italic;'> bản " + (CommonHelper.xoa_dau(colorname).includes("mau") ? colorname.toUpperCase() : "màu " + colorname.toUpperCase()) + "</span>") : "") + "<br />"
                                    + (result.GetProductResult.productErpPriceBOField.priceField == "0" ? ("") : ("Giá: " + "<span style='font-weight:bold'>" + parseFloat(result.GetProductResult.productErpPriceBOField.priceField).toLocaleString() + " đ" + "</span>"));
                                //  console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                resultanswer += "<br /><img width='120' height='120' src='" + result.GetProductResult.mimageUrlField + "'" + "/>";
                                //console.log("Giá: " + result.GetProductResult.productErpPriceBOField.priceField.toString());
                                // console.log(resultanswer);
                                var isPreorder = CommonHelper.IsPreoder(result.GetProductResult);
                                //console.log("+++++++++",result.GetProductResult.productErpPriceBOField.webStatusIdField);

                                ProductAPI.APIGetSeoURLProduct(ConstConfig.URLAPI_CATEGORY, argsProductDetailGetSeoURL, function callback(seoURL) {

                                    resultanswer += "<br />Thông tin chi tiết sản phẩm: " + "<a href='" + seoURL + "' target='_blank'>" + seoURL + "</a>" + "<br />";

                                    //============xu ly trang thai product
                                    if (isPreorder) {
                                        resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện tại đang trong quá trình đặt trước và trải nghiệm tại siêu thị. Mời " + sessions[sessionId].gender + " đến siêu thị gần nhất để trải nghiệm ạ.</p>";
                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }
                                    var createDateProduct = new Date(Date.parse(result.GetProductResult.createdDateField));
                                    var arrivalDateProduct = new Date(Date.parse(result.GetProductResult.productErpPriceBOField.arrivalDateField));

                                    const diffTime_createDateProduct = Math.abs(createDateProduct.getTime() - new Date().getTime());
                                    const diffDays_createDateProduct = Math.ceil(diffTime_createDateProduct / (1000 * 60 * 60 * 24));

                                    const diffTime_arrivalDateProduct = Math.abs(arrivalDateProduct.getTime() - new Date().getTime());
                                    const diffDays_arrivalDateProduct = Math.ceil(diffTime_arrivalDateProduct / (1000 * 60 * 60 * 24));




                                    if (parseInt(result.GetProductResult.webStatusIDField) === 1) {
                                        var obj = result.GetProductResult.productErpPriceBOField;
                                        if (obj != null && Date.parse(obj.arrivalDateField) > (new Date()).getTime()) {

                                            if (diffDays_arrivalDateProduct > 20) {
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "cuối tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                            }
                                            else if (diffDays_arrivalDateProduct > 10)
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "giữa tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                            else
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "đầu tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                        }
                                        else {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về. Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                        }

                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }
                                    if (parseInt(result.GetProductResult.webStatusIDField) === 2 ||
                                        (result.GetProductResult.productErpPriceBOField != null && parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) == 5)) {
                                        resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm hiện đang hết hàng tạm thời. Khi nào có hàng bên em sẽ thông báo sớm nhất ạ.</p>";
                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }

                                    if (result.GetProductResult.isHearSayField) {
                                        resultanswer += "<p style='color:red;font-style:italic'>Sản phẩm này hiện tại chỉ là tin đồn và chưa ra nắt chính thức ạ. </p>";
                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }
                                    if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) === 1) {


                                        if (diffDays_createDateProduct < 60)
                                            resultanswer += "<p style='color:red;font-style:italic'>Sản phẩm này mới ra mắt nên chưa có hàng tại TGDD. Khi nào có hàng sẽ thông báo sớm nhất ạ </p>";
                                        else {
                                            let status = result.GetProductResult.isNotSaleField ? "Không kinh doanh" : "Ngừng kinh doanh";
                                            resultanswer += "<br />" + "Sản phẩm " + sessions[sessionId].gender + "  quan tâm hiện tại <span style='color:red'>" + status + "</span>. Vui lòng chọn sản phẩm khác ạ!";

                                        }
                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }
                                    else if (parseInt(result.GetProductResult.productErpPriceBOField.webStatusIdField) === 2) {
                                        var obj = result.GetProductResult.productErpPriceBOField;
                                        if (obj != null && Date.parse(obj.arrivalDateField) > (new Date()).getTime()) {
                                            if (diffDays_arrivalDateProduct > 20) {
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "cuối tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                            }
                                            else if (diffDays_arrivalDateProduct > 10)
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "giữa tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                            else
                                                resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về, dự kiến về " + "đầu tháng " + ((new Date(Date.parse(obj.arrivalDateField))).getMonth() + 1) + "/" + (new Date(Date.parse(obj.arrivalDateField))).getFullYear() + ". Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                        }
                                        else {
                                            resultanswer += "<p style='color:#bc9816;font-style:italic'>Sản phẩm đang trong quá trình nhập hàng về. Vui lòng đăng ký nhận thông tin theo link ở trên ạ</p>";
                                        }

                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                            .catch(console.error);
                                        return;
                                    }

                                    //#### END xu ly trang thai product

                                    //==== START find productcode color
                                    ProductAPI.GetProductCodeColorByColorName(ConstConfig.URLAPI_PRODUCT, productID, colorname, function callbackGetProductCodeColorByColorName(result) {
                                        productCode = result.ProductCode;
                                        colorname = result.ColorName;
                                        sessions[sessionId].colorProductCode = productCode;
                                        sessions[sessionId].colorname = result.ColorName;

                                        if (sessions[sessionId].IsLatestRequireChooseDistrict) {

                                            sessions[sessionId].IsLatestRequireChooseDistrict = false;
                                            //có provinceID và districtID
                                            var argsProductStock = "";
                                            var total = 0;

                                            argsProductStock = {
                                                productID: parseInt(productID), productCode: productCode, provinceID: provinceID,
                                                districtID: districtID, pageSize: 300, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                            };

                                            ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
                                                //console.log(argsProductStock);
                                                // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                // console.log(total);
                                                //console.log(result);
                                                if (result.total) {//có hàng
                                                    resultanswer = "";

                                                    var type = "template";

                                                    questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> tại " + "<span style='color:red'>" + province + "</span>";
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
                                                }
                                                else {//hết hàng
                                                    if (colorname) {
                                                        resultanswer = "Dạ xin lỗi. Sản phẩm " + productName + ", bản màu <span style='font-style:italic'>" + colorname + "</span> đã <span style='color:red'>HẾT HÀNG </span> tại khu vực " + province + " của " + sessions[sessionId].gender + ". " + sessions[sessionId].gender + " vui lòng chọn lại khu vực lân cận ạ";
                                                    }
                                                    else {
                                                        resultanswer = "Dạ xin lỗi. Sản phẩm " + productName + " đã <span style='color:red'>HẾT HÀNG </span> tại khu vực " + province + " của " + sessions[sessionId].gender + ". " + sessions[sessionId].gender + " vui lòng chọn lại khu vực lân cận ạ";
                                                    }
                                                    SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                        .catch(console.error);

                                                }


                                            });//end APIGetDistrictByProvince
                                            return;
                                        }

                                        if (!province && !district) {
                                            resultanswer += "<br />" + sessions[sessionId].gender + "  đang ở Tỉnh/Thành phố nào ạ? Cho em biết tỉnh/thành phố để xem siêu thị còn hàng, ví dụ: Hồ Chí Minh, Phú Yên...";

                                            sessions[sessionId].IsLatestRequireLocation_Province = true;
                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);
                                            return;
                                        }
                                        else {

                                            SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                .catch(console.error);

                                            if (province && !district) {//có province, không có district

                                                //lấy provinceID                             
                                                Elastic.getElasticSearch(locationindex, provincetype, province, function callbackEL(err, result) {
                                                    if (err) return err;
                                                    //console.log(result);
                                                    if (result.length > 0) {//province được tìm thấy
                                                        var provinceID = result[0]._source.provinceID;
                                                        var provinceName = result[0]._source.provinceName;
                                                        sessions[sessionId].province = provinceName;
                                                        sessions[sessionId].provinveID = provinceID;

                                                        //console.log(provinceID);

                                                        //lấy danh sách siêu thị còn hàng
                                                        var total = 0;
                                                        var argsProductStock = "";
                                                        argsProductStock = {
                                                            productID: parseInt(productID), productCode: productCode, provinceID: provinceID,
                                                            districtID: 0, pageSize: 300, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                        };


                                                        ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
                                                            //console.log(argsProductStock);
                                                            // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                            // console.log(total);
                                                            //console.log(result);
                                                            if (result.total) {//có hàng
                                                                resultanswer = "";

                                                                var type = "template";

                                                                questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> tại " + "<span style='color:red'>" + provinceName + "</span>";
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


                                                                //lấy danh sách huyện của tỉnh đó (còn hang)

                                                                var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };

                                                                SendMessage.SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);


                                                            }
                                                            else {//hết hàng

                                                                if (colorname) {
                                                                    resultanswer = "Dạ xin lỗi. Sản phẩm " + productName + ", bản màu <span style='font-style:italic'>" + colorname + "</span> đã <span style='color:red'>HẾT HÀNG </span> tại khu vực " + province + " của " + sessions[sessionId].gender + ". " + sessions[sessionId].gender + " vui lòng chọn lại khu vực lân cận ạ";
                                                                }
                                                                else {
                                                                    resultanswer = "Dạ xin lỗi. Sản phẩm " + productName + " đã <span style='color:red'>HẾT HÀNG </span> tại khu vực " + province + " của " + sessions[sessionId].gender + ". " + sessions[sessionId].gender + " vui lòng chọn lại khu vực lân cận ạ";
                                                                }
                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                    .catch(console.error);

                                                            }

                                                        });//end APIGetDistrictByProvince

                                                    }
                                                    else {

                                                        sessions[sessionId].province = null;
                                                        sessions[sessionId].IsLatestRequireLocation_Province = true;

                                                        SendMessage.SentToClient(sender, "Dạ " + sessions[sessionId].gender + " có thể cung cấp rõ hơn tỉnh/thành, quận/huyện đang ở không ạ?  Ví dụ: hồ chí minh, quận 10 hồ chí minh...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                            .catch(console.error);

                                                    }

                                                });//end elastic



                                            }
                                            else if (province && district) {

                                                console.log('+++' + province + "-" + district);
                                                //lấy danh sách cửa hàng còn hàng ở tỉnh, huyện  đó không theo màu

                                                //xác định provinceID
                                                //lấy provinceID                             
                                                Elastic.getElasticSearch(locationindex, provincetype, province, function callbackEL(err, result) {
                                                    if (err) return err;
                                                    //console.log(result);
                                                    if (result.length != 0) {//province được tìm thấy
                                                        var provinceID = result[0]._source.provinceID;
                                                        var provinceName = result[0]._source.provinceName;
                                                        sessions[sessionId].province = provinceName;
                                                        sessions[sessionId].provinveID = provinceID;
                                                        //tìm huyện theo tỉnh trước
                                                        Elastic.getElasticSearchDistrictAndProvince(locationindex, districttype, district, sessions[sessionId].provinveID, function callbackEL(err, result) {
                                                            if (err) return err;
                                                            if (result.length > 0) {
                                                                console.log(result);
                                                                if (result.length == 1)//đã xác định đúng chính xác huyện và tỉnh đó
                                                                {
                                                                    var provinceID = result[0]._source.provinceID;
                                                                    var districtID = result[0]._source.districtID;

                                                                    var districtName = result[0]._source.districtName;
                                                                    var provinceName = sessions[sessionId].province;

                                                                    sessions[sessionId].districtID = districtID;

                                                                    //console.log(provinceID);

                                                                    //lấy danh sách siêu thị còn hàng
                                                                    var total = 0;
                                                                    var argsProductStock = "";

                                                                    argsProductStock = {
                                                                        productID: parseInt(productID), productCode: productCode, provinceID: parseInt(provinceID),
                                                                        districtID: parseInt(districtID), pageSize: 20, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                                    };

                                                                    ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
                                                                        //console.log(argsProductStock);
                                                                        //console.log("Tham số truyền vào Check Stock:<br />" + JSON.parse(argsProductStock));

                                                                        // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                                        console.log(result);
                                                                        if (result.total > 0 && result.GetStoreInStock2016Result.StoreBO.length > 0 && result.GetStoreInStock2016Result.StoreBO[0].webAddressField != "undefined") {//có hàng

                                                                            // console.log(total);
                                                                            resultanswer = "";

                                                                            if (colorname) {
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

                                                                            // if (sessions[sessionId].isPreAskColor) {//nếu câu trước đã answer color rồi thì không đưa lại ds color nữa
                                                                            //     resultanswer = "";
                                                                            //     setTimeout(() => {
                                                                            //         SendMessage.SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                            //             .catch(console.error);
                                                                            //     }, 1500);

                                                                            // }
                                                                            // else {
                                                                            //     resultanswer += "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm để xem danh sách cửa hàng còn hàng!";
                                                                            //     SendMessage.SendToUserListColor(sessions, sessionId, sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);
                                                                            //     return;
                                                                            // }

                                                                        }//end if(result)
                                                                        else {
                                                                            //sessions[sessionId].province = null;
                                                                            //sessions[sessionId].district = null;

                                                                            // if (colorname) {
                                                                            //     resultanswer = "Rất tiếc. Sản phẩm này, bản màu " + color.toUpperCase() + " đã <span style='color:red'>HẾT HÀNG</span> tại khu vực của " + sessions[sessionId].gender + " !"
                                                                            //     //đưa ra ôption
                                                                            //     SendMessage.SentToClient(sender, resultanswer, questionTitle, 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                            //         .catch(console.error);

                                                                            //     resultanswer = "";
                                                                            // }
                                                                            // else {
                                                                            resultanswer = "Rất tiếc. Sản phẩm đã <span style='color:red;font-weight:bold'>HẾT HÀNG</span> tại khu vực " + districtName + " của " + sessions[sessionId].gender + " ! Vui lòng chọn lại khu vực lân cận.";

                                                                            //suggest khu vực
                                                                            var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
                                                                            //=======================================================================
                                                                            SendMessage.SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);
                                                                            //=======================================================================
                                                                            // }

                                                                        }

                                                                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                            .catch(console.error);

                                                                    });//end APICheckInStock
                                                                }
                                                                else {//nếu ra quá nhiều thì suggest ra quận huyện nào thành phố đó (6 kết quả tối đa)

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
                                                            else {
                                                                sessions[sessionId].province = null;
                                                                sessions[sessionId].district = null;

                                                                sessions[sessionId].IsLatestRequireLocation_Province = true;

                                                                SendMessage.SentToClient(sender, "Dạ " + sessions[sessionId].gender + " có thể cung cấp rõ hơn tỉnh/thành, quận/huyện đang ở không ạ?  Ví dụ: hồ chí minh, quận 10 hồ chí minh...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                    .catch(console.error);
                                                            }

                                                        });//end getElasticSearchDistrictAndProvince

                                                    }
                                                    else {//khong tim thấy province

                                                        sessions[sessionId].province = null;
                                                        sessions[sessionId].district = null;


                                                        sessions[sessionId].IsLatestRequireLocation_Province = true;

                                                        SendMessage.SentToClient(sender, "Dạ " + sessions[sessionId].gender + " có thể cung cấp rõ hơn tỉnh/thành, quận/huyện đang ở không ạ?  Ví dụ: hồ chí minh, quận 10 hồ chí minh...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                            .catch(console.error);
                                                    }
                                                });

                                            }//end if(product && province)
                                            else if (!province && district)//khong có tỉnh, chỉ có huyện/quận
                                            {

                                                //search theo district
                                                Elastic.getElasticSearch(locationindex, districttype, district, function callbackEL(err, result) {
                                                    if (err) return err;
                                                    if (result.length > 0) {
                                                        if (result.length == 1)//đã xác định đúng chính xác huyện đó
                                                        {
                                                            var provinceID = result[0]._source.provinceID;
                                                            var districtID = result[0]._source.districtID;

                                                            var districtName = result[0]._source.districtName;
                                                            var provinceName = sessions[sessionId].province;

                                                            sessions[sessionId].districtID = districtID;

                                                            //console.log(provinceID);

                                                            //lấy danh sách siêu thị còn hàng
                                                            var total = 0;
                                                            var argsProductStock = "";

                                                            argsProductStock = {
                                                                productID: parseInt(productID), productCode: productCode, provinceID: parseInt(provinceID),
                                                                districtID: parseInt(districtID), pageSize: 20, pageIndex: ConstConfig.DEFAULT_PAGEINDEX, total
                                                            };


                                                            ProductAPI.APICheckInStock(ConstConfig.URLAPI_CATEGORY, argsProductStock, function getResult(result) {
                                                                //console.log(argsProductStock);
                                                                //console.log("Tham số truyền vào Check Stock:<br />" + JSON.parse(argsProductStock));

                                                                // console.log(result.GetStoreInStock2016Result.StoreBO[1]);
                                                                console.log(result);
                                                                if (result.total > 0 && result.GetStoreInStock2016Result.StoreBO.length > 0 && result.GetStoreInStock2016Result.StoreBO[0].webAddressField != "undefined") {//có hàng

                                                                    // console.log(total);
                                                                    resultanswer = "";

                                                                    if (colorname) {
                                                                        //resultanswer += "<br />Danh sách siêu thị có sản phẩm màu " + sessions[sessionId].colorname.toUpperCase() + " tại " + districtName + "," + provinceName + "<br />";
                                                                        questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> màu " + sessions[sessionId].colorname.toUpperCase() + " tại " + districtName + "," + provinceName;
                                                                    }
                                                                    else {
                                                                        //resultanswer += "<br />Danh sách siêu thị có sản phẩm có hàng tại " + districtName + "," + provinceName + "<br />";
                                                                        questionTitle = "Danh sách siêu thị <span style='color:green'>CÒN HÀNG</span> tại " + districtName;
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
                                                                        if (storeBO.webAddressField && storeBO.webAddressField.toLowerCase() != "undefined") {
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

                                                                    // if (sessions[sessionId].isPreAskColor) {//nếu câu trước đã answer color rồi thì không đưa lại ds color nữa
                                                                    //     resultanswer = "";
                                                                    //     setTimeout(() => {
                                                                    //         SendMessage.SentToClient(sender, resultanswer, "Lựa chọn", 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                    //             .catch(console.error);
                                                                    //     }, 1500);

                                                                    // }
                                                                    // else {
                                                                    //     resultanswer += "Vui lòng chọn màu sắc " + sessions[sessionId].gender + "  quan tâm để xem danh sách cửa hàng còn hàng!";
                                                                    //     SendMessage.SendToUserListColor(sessions, sessionId, sessions[sessionId].productID, sessions[sessionId].product, sender, siteid, replyobject, questionTitle, intent);
                                                                    //     return;
                                                                    // }

                                                                }//end if(result)
                                                                else {
                                                                    //sessions[sessionId].province = null;
                                                                    //sessions[sessionId].district = null;

                                                                    // if (colorname) {
                                                                    //     resultanswer = "Rất tiếc. Sản phẩm này, bản màu " + sessions[sessionId].colorname.toUpperCase() + " đã <span style='color:red'>HẾT HÀNG</span> tại khu vực của " + sessions[sessionId].gender + " ! Vui lòng chọn màu khác ạ."

                                                                    //     //đưa ra ôption

                                                                    //     SendMessage.SentToClient(sender, resultanswer, questionTitle, 0, "option_whenoutcolorstock", replyobject, siteid)
                                                                    //         .catch(console.error);

                                                                    //     resultanswer = "";

                                                                    // }
                                                                    //else {
                                                                    resultanswer = "Rất tiếc. Sản phẩm đã <span style='color:red;font-weight:bold'>HẾT HÀNG</span> tại khu vực " + districtName + " của " + sessions[sessionId].gender + " ! Vui lòng chọn lại khu vực lân cận.";

                                                                    //suggest khu vực
                                                                    var argsDistrictByProvince = { intProvinceID: parseInt(provinceID) };
                                                                    //=======================================================================
                                                                    SendMessage.SendToUserListDistrict(sessions[sessionId].productID, provinceID, sender, siteid, replyobject, questionTitle, intent);
                                                                    //=======================================================================
                                                                    //}

                                                                }

                                                                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                                                                    .catch(console.error);

                                                            });//end APICheckInStock
                                                        }
                                                        else {//nếu ra quá nhiều thì suggest ra quận huyện nào thành phố đó (6 kết quả tối đa)

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
                                                    else {
                                                        sessions[sessionId].province = null;
                                                        sessions[sessionId].district = null;

                                                        sessions[sessionId].IsLatestRequireLocation_Province = true;

                                                        SendMessage.SentToClient(sender, "Dạ " + sessions[sessionId].gender + " có thể cung cấp rõ hơn tỉnh/thành, quận/huyện đang ở không ạ?  Ví dụ: hồ chí minh, quận 10 hồ chí minh...", questionTitle, button_payload_state, intent, replyobject, siteid)
                                                            .catch(console.error);
                                                    }




                                                });

                                            }
                                        }


                                    });
                                });
                            }

                            else {
                                resultanswer = "Sản phẩm " + result.GetProductResult.productNameField + " hiện tại <span style='color:red'>KHÔNG CÒN KINH DOANH</span> tại Thế giới di động. Rất xin lỗi vì sự bất tiện này ạ.";
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
                        var rn = CommonHelper.randomNumber(productnotfound.length);
                        resultanswer = productnotfound[rn];

                        SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                            .catch(console.error);

                    }

                });


            }//end if (sessions[sessionId].product)

            else {
                var rn = CommonHelper.randomNumber(unknowproduct.length);
                resultanswer = unknowproduct[rn];
                sessions[sessionId].isLatestUnknowProduct_AskStock = true;
                SendMessage.SentToClient(sender, resultanswer, questionTitle, button_payload_state, intent, replyobject, siteid)
                    .catch(console.error);
            }
        }
        catch (err) {
            logerror.WriteLogToFile(ConstConfig.ERRORFILE_PATH, "Error at stockmodule : " + err);
        }
    }
}