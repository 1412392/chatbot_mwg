// var User=require('../app/models/user');

// var passport = require('./passport');

// var bcrypt = require('bcryptjs');

var Router=require('express').Router;

var controllers=require('../app/controllers');

module.exports=function(app)
{
	

	var homeRouter=Router()
		.get('/',controllers.home.index);


	var webhookRouter=Router()
		.get('/',controllers.webhook.index)
		.post('/',controllers.webhook.postmessage);


	

	app.use('/',homeRouter);
	
	app.use('/webhook',webhookRouter);
	
}