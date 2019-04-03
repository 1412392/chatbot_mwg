var elasticsearch = require('elasticsearch');

var el = new elasticsearch.Client({
    host: '192.168.2.54:9200',
    log: 'trace'
});
module.exports = {
    getElasticSearch: async function (index, type, keyword, callback) {

        await el.search({
            index: index,
            type: type,
            q: keyword
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    },
    getElasticSearchDistrictAndProvince: async function (index, type, keyword, provinveID, callback) {

        await el.search({
            index: index,
            type: type,
            q: keyword + " AND " + "provinceID:" + '"' + provinveID + '"'
        }, function (error, response) {
            if (error) return callback(error, null); // returns the callback with the error that happened

            return callback(null, response.hits.hits);
        });  // returns the result of showdocs(response)

    }
}