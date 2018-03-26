var User=require('../models/user');

var passport = require('../../config/passport');

var bcrypt = require('bcryptjs');


var signupController={
	index:function(req,res)
	{
		

		res.render('Login/register',{
			title:"Trang Đăng Ký",
			singuperr1:req.flash('singuperr1'),
			singuperr2:req.flash('singuperr2'),
			singuperr3:req.flash('singuperr3'),
			layout:false,

		});
	},
	success:function(req,res)
	{
		
		res.render('Login/regsuccess',{
			title:"Đăng Ký Thành Công",
			
			layout:false,

		});
	}
};
module.exports=signupController;
