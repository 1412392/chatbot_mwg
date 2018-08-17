// var User=require('../app/models/user');

// var passport = require('./passport');

// var bcrypt = require('bcryptjs');

var Router=require('express').Router;

var controllers=require('../app/controllers');

module.exports=function(app)
{
	

	var webhookRouter=Router()
		.get('/',controllers.webhook.index)
		.post('/',controllers.webhook.postmessage)
		.post('/processsubmit',controllers.webhook.processsubmit);


	app.use('/webhook',webhookRouter);
	
}