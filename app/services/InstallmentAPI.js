var soap = require('soap');

module.exports = {

    APIGetNormalInstallment: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.GetListNormalInstallment(args, function (err, result) {
                // console.log("====packages", result);
                var packages = JSON.parse(JSON.stringify(result));

                fn(packages);

            });

        });
    },
    APIGetInfoZeroInstalmentPackage: function (url, args, fn) {
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
    },
    APIGetInstallmentResult: function (url, args, fn) {
        console.log("====START APIGetInstallmentResult========");
        console.log("========args==========", args)
        console.log("======url===========", url);
        console.log("====END APIGetInstallmentResult========");

        soap.createClient(url, function (err, client) {
            //console.log(args);
            client.GetInstallmentResult(args, function (err, result) {
                //console.log("====packages", result);
                if (result) {
                    var package = JSON.parse(JSON.stringify(result));
                    fn(package);
                }
                else {
                    if (args.Percent === 0 && args.BriefId === 1) {//nếu trả góp 0đ, thì thêm cái giấy tờ số 4: cmnd hk hoadon
                        args.BriefId = 4;
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
                    }
                    else {
                        fn(null);
                    }

                }
            });

        });
    },
    APICheckZeroInstalment: function (url, args, fn) {
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
}