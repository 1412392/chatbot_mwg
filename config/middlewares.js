var express=require('express');
var bodyParser=require('body-parser');
var fileUpload = require('express-fileupload');

var cookieParser=require('cookie-parser');
var session=require('express-session');



module.exports=function(app)
{
	app.use(express.static("public"));
	app.use(bodyParser.urlencoded({
		extended:true,
		
	}));
	app.use(bodyParser.json());

	app.use(fileUpload());
	app.use(cookieParser());

	app.use(session({
	  secret: 'my secret key',
	  resave: true,
	  saveUninitialized: true
	}));
	
}
