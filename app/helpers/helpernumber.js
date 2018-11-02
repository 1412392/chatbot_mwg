module.exports = {
    RoudPercentProperly: function (percent) {
        if (percent >= 5 && percent <= 15) {
            return 10;
        }
        if (percent > 15 && percent <= 25) {
            return 20;
        }
        if (percent > 25 && percent <= 35) {
            return 30;
        }

        if (percent > 35 && percent <= 45) {
            return 40;
        }

        if (percent > 45 && percent <= 55) {
            return 50;
        }
        if (percent > 55 && percent <= 65) {
            return 60;
        }
        if (percent > 65 && percent <= 75) {
            return 70;
        }
        if (percent > 75 && percent <= 90) {
            return 80;
        }

    }
}