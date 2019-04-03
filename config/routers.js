// var User=require('../app/models/user');

// var passport = require('./passport');

// var bcrypt = require('bcryptjs');

var Router = require('express').Router;

var controllers = require('../app/controllers');
const line = require('@line/bot-sdk');
const config = {
	channelAccessToken: "OF/JLbPlLNPPK1z65/CYKHYcmxICRDPRZ/5mv+uf5nc8svIORfM/9fT/zH/f4h00SA2XA5+xXKNPgxep0dQlP8VIF3K2iBOgWcunGCzcWvkLeZhESgk8V/FMtIQS0RKaWZ0RcsSpkrhH0JbV3catwAdB04t89/1O/w1cDnyilFU=",
	channelSecret: "6a24678d4466e1ed662397ed64b3926b"
};
module.exports = function (app) {


	var webhookRouter = Router()
		.get('/', controllers.webhook.index)
		.post('/', controllers.webhook.postmessage)
		.post('/processsubmit', controllers.webhook.processsubmit);
		//.post('/notifyline',  controllers.webhook.notifyline)
		//.post('/notifyline_error',controllers.webhook.notifyline_error);


	app.use('/webhook', webhookRouter);

}