//tiền xử lý dữ liệu
const MatchPattern_J = (messagecontent) => {
    var pattern = "\\b\\s+j\\s+\\d{1}\\b";
    var patt = new RegExp(pattern);
    return patt.test(messagecontent);

}
const MatchPattern_PT = (messagecontent) => {//match với pattern xx%
    var pattern = "\\b\\s+\\d*\\s*%\\b";
    var patt = new RegExp(pattern);
    return patt.test(messagecontent);

}


module.exports = {
    ReplaceNonsenWord: function (messagecontent) {
        //module này xử lý các từ hay viết tắt, ngôn ngữ teen, từ sai chính tả
        messagecontent = messagecontent.trim();
        messagecontent = messagecontent.replace("@", " ");
        messagecontent = messagecontent.replace("!", " ");
        messagecontent = messagecontent.replace("#", " ");
        messagecontent = messagecontent.replace("$", " ");
        messagecontent = messagecontent.replace("+", " plus ");
        messagecontent = messagecontent.replace("-", " ");
        messagecontent = messagecontent.replace("o%", "0%");
        messagecontent = messagecontent.replace("o %", "0%");
        messagecontent = messagecontent.replace("sámung", "samsung");
        messagecontent = messagecontent.replace("sam sung", "samsung");
        messagecontent = messagecontent.replace("samsum", "samsung");
        messagecontent = messagecontent.replace("sam xung", "samsung");
        messagecontent = messagecontent.replace("mobistar", "mobiistar");
        messagecontent = messagecontent.replace(" realmi", " realme");
        messagecontent = messagecontent.replace(" reamed", " realme");
        messagecontent = messagecontent.replace(" relmi", " realme");

        messagecontent = messagecontent.replace(" ịhone", " iphone");

        messagecontent = messagecontent.replace("xioami", "xiaomi");
        messagecontent = messagecontent.replace("xieomi", "xiaomi");
        messagecontent = messagecontent.replace("xaomi", "xiaomi");
        messagecontent = messagecontent.replace("láp top", "laptop");
        messagecontent = messagecontent.replace("loptop", "laptop");
        messagecontent = messagecontent.replace("lap top", "laptop");

        messagecontent = messagecontent.replace("appo", "oppo");
        messagecontent = messagecontent.replace("garaxy", "garaxy");
        messagecontent = messagecontent.replace("vinsmart", "vsmart");
        messagecontent = messagecontent.replace("vsmat", "vsmart");


        messagecontent = messagecontent.replace("flush", "plus");
        messagecontent = messagecontent.replace("pluss", "plus ");
        messagecontent = messagecontent.replace("ss", "samsung  ");
        messagecontent = messagecontent.replace("j2pro", "j2 pro  ");
        messagecontent = messagecontent.replace("(", " ");
        messagecontent = messagecontent.replace(")", " ");
        messagecontent = messagecontent.replace("~", " ");
        messagecontent = messagecontent.replace(":", " ");
        messagecontent = messagecontent.replace("thág", "tháng");
        messagecontent = messagecontent.replace("thag", "tháng");
        messagecontent = messagecontent.replace("ạk", "ạ");

        messagecontent = messagecontent.replace(" ak ", " à ");
        messagecontent = messagecontent.replace(" ah ", " à ");
        messagecontent = messagecontent.replace("ko", "không");
        messagecontent = messagecontent.replace("k0", "không");
        messagecontent = messagecontent.replace(" hk ", " không ");
        messagecontent = messagecontent.replace("hok", "không");
        messagecontent = messagecontent.replace("kg", "không");
        messagecontent = messagecontent.replace("trug", "trung");
        messagecontent = messagecontent.replace("vâg", "vâng");
        messagecontent = messagecontent.replace("xog", "xong");


        //nguy hiểm
        if (!messagecontent.includes("lg")) {//ddiejn thoai LG k10,..
            messagecontent = messagecontent.replace(" k ", " không ");
            messagecontent = messagecontent.replace(" k?", " không ");
            if (messagecontent.endsWith(" k")) {
                messagecontent = messagecontent.replace(/.$/, "không");
            }
        }
        if (messagecontent.endsWith(" j")) {
            messagecontent = messagecontent.replace(/.$/, "gì");
        }
        if (messagecontent.includes(" j ")) {
            //kiểm tra pattern j 8plus...
            if (!MatchPattern_J(messagecontent)) {
                messagecontent = messagecontent.replace(" j ", " gì ");
            }
        }

        if (messagecontent.includes("%")) {
            if (MatchPattern_PT(messagecontent)) {
                try {
                    var value = messagecontent.match("\\b\\s+\\d*\\s*%\\b")
                    if (value && value.length > 0) {
                        var match = value[0];
                        if (match) {
                            messagecontent = messagecontent.replace(match, " " + match + " ");
                        }
                    }

                } catch (error) {

                }
            }
        }

        messagecontent = messagecontent.replace("vòg", "vòng");
        messagecontent = messagecontent.replace("vog", "vòng");
        messagecontent = messagecontent.replace("trog", "trong");
        messagecontent = messagecontent.replace("mún", "muốn");
        messagecontent = messagecontent.replace("mun", "muốn");
        messagecontent = messagecontent.replace("dc", "được");
        messagecontent = messagecontent.replace("đc", "được");
        messagecontent = messagecontent.replace(" dt ", " điện thoại ");
        messagecontent = messagecontent.replace(" đt ", " điện thoại ");
        messagecontent = messagecontent.replace("fai", "phải");
        messagecontent = messagecontent.replace("hàg", "hàng");
        messagecontent = messagecontent.replace(" nhiu ", " nhiêu ");
        //messagecontent = messagecontent.replace("lm", "làm");
        messagecontent = messagecontent.replace("hih", "hình");
        messagecontent = messagecontent.replace(" jo ", "giờ");
        messagecontent = messagecontent.replace("chả", "trả");
        messagecontent = messagecontent.replace("thui", "thôi");
        messagecontent = messagecontent.replace("trc", "trước");
        messagecontent = messagecontent.replace("km", "khuyễn mãi");
        messagecontent = messagecontent.replace("bnhiu", "bao nhiêu");
        messagecontent = messagecontent.replace("thasng", "tháng");
        // messagecontent = messagecontent.replace("bao nh", "bao nhiêu");
        messagecontent = messagecontent.replace("bn", "bao nhiêu");
        messagecontent = messagecontent.replace("bnhiu", "bao nhiêu");

        messagecontent = messagecontent.replace("od", "0đ");
        messagecontent = messagecontent.replace("0d", "0đ");
        if (!messagecontent.includes("mart")) {
            messagecontent = messagecontent.replace(" vs ", " với ");
        }

        messagecontent = messagecontent.replace("zay", "vậy");

        messagecontent = messagecontent.replace(" ipat ", " ipad ");

        messagecontent = messagecontent.replace(" duog", " duong");
        messagecontent = messagecontent.replace(" máy tính bản", " máy tính bảng");
        messagecontent = messagecontent.replace(" homerit", "home credit");
        messagecontent = messagecontent.replace(" 0₫", " 0đ");
        messagecontent = messagecontent.replace("coire", "core");


        messagecontent = messagecontent.replace(/\n/g, '');
        if (!messagecontent.includes("nokia") && !messagecontent.includes("inch") &&
            !messagecontent.includes("tr") || messagecontent.includes("a6"))//ví dụ 3.5tr 
        {
            messagecontent = messagecontent.replace(".", " ");
            messagecontent = messagecontent.replace(",", " ");
        }

        //===============storage========================
        messagecontent = messagecontent.replace("64 gb", "64GB");
        messagecontent = messagecontent.replace("32 gb", "32GB");
        messagecontent = messagecontent.replace("128 gb", "128GB");
        messagecontent = messagecontent.replace("16 gb", "16GB");
        messagecontent = messagecontent.replace("256 gb", "256GB");
        //===============storage========================
        //xu ly huawei 
        messagecontent = messagecontent.replace("hawei", "huawei");
        messagecontent = messagecontent.replace("hawai", "huawei");
        messagecontent = messagecontent.replace("huwei", "huawei");
        messagecontent = messagecontent.replace("huwai", "huawei");
        messagecontent = messagecontent.replace("huawai", "huawei");
        messagecontent = messagecontent.replace("hưawei", "huawei");
        messagecontent = messagecontent.replace("huawia", "huawei")
        messagecontent = messagecontent.replace("huawey", "huawei")
        messagecontent = messagecontent.replace("hưawei", "huawei")
        messagecontent = messagecontent.replace("hưaei", "huawei");

        messagecontent=messagecontent.replace("wifj","wifi");

        messagecontent = messagecontent.trim();
        return messagecontent;

    }
}