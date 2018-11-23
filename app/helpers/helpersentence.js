//tiền xử lý dữ liệu
const MatchPattern_J = (messagecontent) => {
    var pattern = "\\b\\s+j\\s+\\d{1}\\b";
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
        messagecontent = messagecontent.replace("mobistar", "mobiistar");
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

        messagecontent = messagecontent.replace("ak", "à");
        messagecontent = messagecontent.replace("ah", "à");
        messagecontent = messagecontent.replace("ah", "ạ");
        messagecontent = messagecontent.replace("ko", "không");
        messagecontent = messagecontent.replace("k0", "không");
        messagecontent = messagecontent.replace("hk", "không");
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

        messagecontent = messagecontent.replace("vòg", "vòng");
        messagecontent = messagecontent.replace("vog", "vòng");
        messagecontent = messagecontent.replace("trog", "trong");
        messagecontent = messagecontent.replace("mún", "muốn");
        messagecontent = messagecontent.replace("mun", "muốn");
        messagecontent = messagecontent.replace("dc", "được");
        messagecontent = messagecontent.replace("đc", "được");
        messagecontent = messagecontent.replace("dt", "điện thoại");
        messagecontent = messagecontent.replace("đt", "điện thoại");
        messagecontent = messagecontent.replace("fai", "phải");
        messagecontent = messagecontent.replace("hàg", "hàng");
        messagecontent = messagecontent.replace("nhiu", "nhiêu");
        //messagecontent = messagecontent.replace("lm", "làm");
        messagecontent = messagecontent.replace("hih", "hình");
        messagecontent = messagecontent.replace("jo", "giờ");
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
        messagecontent = messagecontent.replace("vs", "với");
        messagecontent = messagecontent.replace("zay", "vậy");


        messagecontent = messagecontent.replace(/\n/g, '');
        if (!messagecontent.includes("nokia") && !messagecontent.includes("inch")) {
            messagecontent = messagecontent.replace(".", " ");
            messagecontent = messagecontent.replace(",", " ");
        }

        messagecontent = messagecontent.trim();
        return messagecontent;

    }
}