
var soap = require('soap');

module.exports = {

    APIGetDistrictByProvince: function (url, args, fn) {
        soap.createClient(url, function (err, client) {

            client.GetDistricByProvince(args, function (err, result) {

                var lstDistric = JSON.parse(JSON.stringify(result));
                fn(lstDistric);

            });

        });
    }

}