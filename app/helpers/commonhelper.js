var lstAccessoryKeyword = [
    "ốp", "op lung", "bluetooth", "tai nghe", "tai phone", "pin", "sạc", "sac", "bàn phím", "ban phim", "loa", "thẻ nhớ", "the nho", "usb",
    "gậy", "giá đỡ", "gay tu suong", "dán màn hình", "dây cáp", "ong kinh", "kính", "túi", "day cap"
];

module.exports = {
    isIncludeAccessoryKeyword: function (keyword) {

        if (!keyword) return false;
        for (var i = 0; i < lstAccessoryKeyword.length; i++) {
            if (keyword.toLowerCase().includes(lstAccessoryKeyword[i]))
                return true;
        }
        return false;
    },
    IsPreoder: function (productBO) {
        return (productBO.isPreorderCamField && productBO.preorderCamFromDateField != null
            && productBO.preorderCamToDateField != null &&
            Date.parse(productBO.preorderCamFromDateField) <= new Date().getTime() &&
            Date.parse(productBO.preorderCamToDateField) >= new Date().getTime());
    },
    randomNumber: function (lengthNumber) {
        return Math.floor((Math.random() * (lengthNumber - 1)) + 0);//random tu 0 den lengthnumber-1
    },
    format_currency: function (price) {

        return price.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");

    }
}