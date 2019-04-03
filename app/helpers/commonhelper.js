var lstAccessoryKeyword = [
    "ốp", "op lung", "bluetooth", "tai nghe", "tai phone", "pin", "sạc", "sac", "bàn phím", "ban phim", "loa", "thẻ nhớ", "the nho", "usb",
    "gậy", "giá đỡ", "gay tu suong", "dán màn hình", "dây cáp", "ong kinh", "kính", "túi", "day cap"
];
var lstCommonProduct = [
    "laptop", "iphone", "điện thoại iphone", "iphone đó", "nokia", "huawei", "note", "realme",
    "sạc", "ốp lưng", "pin", "oppo", "xiaomi", "mobiistar", "vivo", "samsung", "sam sung", "dell", "asus", "macbook", "hp",
    "dán màn hình", "cáp sạc", "laptop msi", "ipad 2017", "msi", "lenovo",
    "may tinh bang", "tablet", "máy tính bảng", "miếng dán cường lực", "dán cường lực"
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

    },
    hasNumber: function (myString) {
        return /\d/.test(myString);
    },
     isGeneralProduct :function (productname) {
        for (var i = 0; i < lstCommonProduct.length; i++) {
            if (productname.toLowerCase().trim() === lstCommonProduct[i].toLocaleLowerCase().trim())
                return true;
        }
        return false;
    }
}