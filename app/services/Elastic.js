var elasticsearch = require('elasticsearch');
var CommonHelper = require('../helpers/commonhelper');


var el = new elasticsearch.Client({
    host: '192.168.2.54:9200',
    //log: 'trace'
});

module.exports = {
    getElasticSearch: async function (index, type, keyword, callback) {

        //bo dau keyword neu co
        keyword = CommonHelper.xoa_dau(keyword).replace(".", " ");
        var keywordforsearch = 'seKeyword:"*' + keyword + '*"';
        console.log("++++++++++keywordforsearch+++++", keywordforsearch);
        await el.search({
            index: index,
            type: type,
            q: keywordforsearch
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    },
    getElasticSearchDistrictAndProvince: async function (index, type, keyword, provinveID, callback) {
        keyword = CommonHelper.xoa_dau(keyword).replace(".", " ");;
        var keywordforsearch = 'seKeyword:"*' + keyword + '*"' + ' AND ' + 'provinceID:"' + provinveID + '"';
        console.log("++++++++++keywordforsearch+++++", keywordforsearch);

        await el.search({
            index: index,
            type: type,
            q: keywordforsearch
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    }
}