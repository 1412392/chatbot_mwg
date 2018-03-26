var express=require('express');
var app=express();

require('../config')(app);

const hostname = '0.0.0.0';
const port = 80;


//chạy server

app.listen(80,function(){
	console.log("Successfull port 80");
});



