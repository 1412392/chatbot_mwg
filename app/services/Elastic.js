var elasticsearch = require('elasticsearch');
var CommonHelper = require('../helpers/commonhelper');


var el = new elasticsearch.Client({
    host: '192.168.2.54:9200',
    //log: 'trace'
});

module.exports = {
    getElasticSearch: async function (index, type, keyword, callback) {

        //bo dau keyword neu co
        keyword = CommonHelper.xoa_dau(keyword);
        await el.search({
            index: index,
            type: type,
            q: "seKeyword:" + '"' + keyword + '"'
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    },
    getElasticSearchDistrictAndProvince: async function (index, type, keyword, provinveID, callback) {
        keyword = CommonHelper.xoa_dau(keyword);
        console.log("seKeyword:" + '"' + keyword + '"' + " AND " + "provinceID:" + '"' + provinveID + '"')
        await el.search({
            index: index,
            type: type,
            q: "seKeyword:" + '"' + keyword + '"' + " AND " + "provinceID:" + '"' + provinveID + '"'
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    }
}