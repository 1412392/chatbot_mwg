var express=require('express');
var app=express();

require('../config')(app);

const hostname = '0.0.0.0';
const port = 8080;


//chạy server

// app.listen(80,function(){
// 	console.log("Successfull port 80");
// });

app.listen(8080,function(){
	console.log("Successfull port 8080");
});


