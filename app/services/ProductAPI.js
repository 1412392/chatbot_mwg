
var soap = require('soap');
var CommonHelper = require('../helpers/commonhelper');

const GetShockPriceByProductID = (urlApiProduct, productID) => {
    var args = {
        ProductID: productID
    }
    return new Promise((resolve, reject) => {
        soap.createClient(urlApiProduct, function (err, client) {
            client.GetShockPrice(args, function (err, result) {
                if (err) reject(err);
                // console.log("==========shock price========");
                // console.log(result);

                if (result && result.GetShockPriceResult) {
                    if (Date.parse(result.GetShockPriceResult.showWebFromDateField) <= new Date().getTime() &&
                        Date.parse(result.GetShockPriceResult.showWebToDateField) >= new Date().getTime()) {
                        var priceDiscount = parseFloat(result.GetShockPriceResult.discountValueField);
                        // console.log(priceDiscount);
                        resolve(priceDiscount);
                    }
                    else {
                        resolve(0);
                    }

                }
                else {
                    resolve(0);
                }

            });
        });
    })

}

module.exports = {
    APIGetProductSearch: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.SearchProductPhi(args, function (err, result) {

                var productSearch = JSON.parse(JSON.stringify(result));
                fn(productSearch);

            });

        });
    },

    APIGetProductDetail: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.GetProduct(args, function (err, result) {

                var productDetail = JSON.parse(JSON.stringify(result));

                // console.log("=============================");
                // console.log(productDetail);

                //resultanswer=ChangeResultAnswer(productDetail);
                //lay giá sốc
                var shockPrice = GetShockPriceByProductID(url, args.intProductID).then((shockprice) => {
                    console.log("======shockprice=====", shockprice);
                    if (productDetail) {
                        productDetail.shockPriceByProductID = shockprice;
                    }

                    fn(productDetail);
                }).catch(err => {
                    console.log("===error at APIGetProductDetail======", err);

                    fn(null);
                });


                // self.resultanswer+="Sản phẩm: "+productDetail.GetProductDetailBySiteIDResult.ProductName+"<br />"+
                // "Giá: "+productDetail.GetProductDetailBySiteIDResult.ExpectedPrice;


            });

        });
    },
    APIGetSeoURLProduct: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.getSeoURLProduct(args, function (err, result) {

                var seourl = JSON.parse(JSON.stringify(result));

                var final = "https://www.thegioididong.com" + seourl.getSeoURLProductResult;
                fn(final);



            });

        });
    },
    GetProductInfoByURL: function (sessions, urlApiProduct, currenturl, sessionId, ishaveProductEntity) {
        return new Promise((resolve, reject) => {
            if (currenturl && currenturl.length > 1) {
                var args = {
                    url: currenturl
                };
                soap.createClient(urlApiProduct, function (err, client) {

                    client.GetProductInfoByURL(args, function (err, result) {
                        if (err) reject(err);
                        var urlSearch = JSON.parse(JSON.stringify(result));
                        if (urlSearch && urlSearch.GetProductInfoByURLResult) {
                            var { PID } = urlSearch.GetProductInfoByURLResult;
                            console.log("===productIDFromURL====", PID);
                            if (PID && parseInt(PID) > 0) {

                                sessions[sessionId].productID_currentUrl = parseInt(PID);
                                //get productname
                                var argsProductDetail = { intProductID: parseInt(PID), intProvinceID: 3 };

                                module.exports.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(productDetail) {
                                    if (productDetail && productDetail.GetProductResult) {
                                        var finalProductName = productDetail.GetProductResult.productNameField;
                                        if (ishaveProductEntity) {//nếu câu hỏi kh có product , kiểm tra?
                                            //nếu product đó BOT detect mà search không ra, hoặc ra nhiều Model (như iphone 6=> ra 32gb,64gb..) thì lấy sản phẩm từ URL
                                            var keyword = sessions[sessionId].product;
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
                                            module.exports.APIGetProductSearch(urlApiProduct, argsSearchProduct, function getResult(result) {

                                                if (result.SearchProductPhiResult != null) {

                                                    if (result.SearchProductPhiResult.string.length > 1) {//nhiều kết quả search
                                                        var productID = result.SearchProductPhiResult.string[0];

                                                        var argsProductDetail = { intProductID: parseInt(productID), intProvinceID: 3 };
                                                        module.exports.APIGetProductDetail(urlApiProduct, argsProductDetail, function getResult(result) {
                                                            var productDetail = result.GetProductResult;
                                                            if (result && result.GetProductResult.productErpPriceBOField) {
                                                                //console.log(result);     
                                                                resolve(result.GetProductResult.productNameField);
                                                            }
                                                            else {
                                                                resolve(finalProductName);
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        resolve(finalProductName);
                                                    }
                                                }
                                                else {
                                                    resolve(finalProductName);
                                                }
                                            });

                                        }
                                        else {
                                            resolve(finalProductName);
                                        }


                                    }
                                    else {
                                        resolve(null);
                                    }
                                });
                            }
                            else {
                                resolve(null);
                            }
                        }
                        else {
                            resolve(null);
                        }
                    });
                });
            }
            else {
                resolve(null);
            }
        });

    },
    APICheckInStock: function (url, args, fn) {
        console.log("++++++++", args);
        soap.createClient(url, function (err, client) {

            client.GetStoreInStock2016(args, function (err, result) {

                var stores = JSON.parse(JSON.stringify(result));
                fn(stores);


            });

        });
    },

    APIGetPriceListByProduct: function (url, productID, fn) {

        soap.createClient(url, function (err, client) {

            var args = {
                intProductID: productID,
                intProvinceID: 3
            };
            client.GetPriceListByProduct(args, function (err, result) {

                var lstPrice = JSON.parse(JSON.stringify(result));

                // console.log("=============================");
                // lstPrice.GetPriceListByProductResult.ProductErpPriceBO.forEach(item=>{
                //     console.log(item);
                // })

                fn(lstPrice);


            });

        });

    },
    APIGetProductColor: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.GetProductColorByProductID(args, function (err, result) {

                var productColor = JSON.parse(JSON.stringify(result));
                var finalListProductColor = [];

                module.exports.APIGetPriceListByProduct(url, args.intProductID, function callback(ListPriceResult) {

                    //loc lai mau co the ban
                    if (productColor.GetProductColorByProductIDResult &&
                        productColor.GetProductColorByProductIDResult.ProductColorBO && productColor.GetProductColorByProductIDResult.ProductColorBO.length > 0) {

                        productColor.GetProductColorByProductIDResult.ProductColorBO.forEach(colorBO => {
                            ListPriceResult.GetPriceListByProductResult.ProductErpPriceBO.forEach(priceBO => {
                                if (priceBO != null && priceBO.productCodeField == colorBO.productCodeField &&
                                    priceBO.webStatusIdField != 1 &&
                                    priceBO.webStatusIdField != 2 && // Hang sap ve
                                    priceBO.webStatusIdField != 5 &&
                                    //price.webStatusIdField != 7 && // Xem giá tại siêu thị
                                    priceBO.webStatusIdField != 9 &&
                                    priceBO.webStatusIdField != 0 &&
                                    priceBO.priceField > 0) {
                                    finalListProductColor.push({
                                        ProductCode: colorBO.productCodeField,
                                        ColorName: colorBO.colorNameField
                                    })
                                }

                            });
                        })
                        console.log("=====finalListProductColor=====", finalListProductColor)
                        fn(finalListProductColor);
                    }
                    else {
                        fn(null);
                    }

                });

            });

        });
    },
    GetProductCodeColorByColorName: function (url, productID, color, fn) {

        if (!color) {
            fn({ ProductCode: null, ColorName: null });
        }
        else {
            soap.createClient(url, function (err, client) {
                var args = {
                    intProductID: productID
                }
                module.exports.APIGetProductColor(url, args, function callback(APIGetProductColorresult) {

                    var ProductCode = "", ColorName = "";
                    if (APIGetProductColorresult && APIGetProductColorresult.length > 0) {
                        APIGetProductColorresult.forEach(element => {
                            // console.log(element.ColorName);
                            var colorname = "mau " + CommonHelper.xoa_dau(element.ColorName.toLowerCase());
                            if (CommonHelper.xoa_dau(color.toLowerCase()).includes(colorname)
                                || colorname.includes(CommonHelper.xoa_dau(color.toLowerCase()))) {
                                ProductCode = element.ProductCode;
                                ColorName = element.ColorName;
                                return;

                            }

                        });
                        fn({ ProductCode: ProductCode.trim(), ColorName });

                    }
                    else {
                        fn({ ProductCode: null, ColorName: null });
                    }

                });
            });
        }
    }
}
