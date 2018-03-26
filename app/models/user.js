var db=require('./db');

var Getuser={
	getUser:function(username,callback)
	{
		db.query("select id,email,username,password,lastname,firstname from admin where username=$1",
			[username],function(err,result)
			{	
				
				
				callback(err,result.rows);
			});
	},
	getUserByEmail:function(email,callback)
	{
		db.query("select id,email,username,password,lastname,firstname from admin where email=$1",
			[email],function(err,result)
			{	
				
				
				callback(err,result.rows);
			});
	},
	insert:function(user,callback)
	{

		db.query("insert into admin(firstname,lastname,email,username,password) values($1,$2,$3,$4,$5)",
			[user[0].firstname,user[0].lastname,user[0].email,user[0].username,user[0].password],
			function(err,result)
		{
			callback(err);
		});

	}
};

module.exports=Getuser;
