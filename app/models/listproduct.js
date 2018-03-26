
var db=require('./db');

var GetListProduct={

	findAll:function(callback)
	{
			db.query("select id,name,c.nameCategory,description,price,dateadd,quantity,s.nameStatus,urlImage from listproduct l,category c,status s where l.categoryID=c.categoryID and s.statusID=l.statusID",[],function(err,result)
			{	
				
				//console.log(JSON.stringify(result));
				callback(err,result.rows);
			});
		
	},
 	insert:function(item,callback)
	{
		db.query("insert into listproduct(name,categoryID,description,price,dateadd,quantity,statusID,urlImage) values($1,$2,$3,$4,$5,$6,$7,$8)",
			[item.name,item.categoryID,item.description,item.price,item.dateadd,item.quantity,item.statusID,item.urlImage],
			function(err,result)
		{
			

			callback(err);
		});

	},
	delete:function(id,callback)
	{
		db.query("delete from listproduct where id=$1",[id],function(err,result)
		{

			callback(err);
			

		});
	},
	update:function(item,callback)
	{
		db.query("update listproduct set name=$1,categoryID=$2,description=$3,price=$4,dateadd=$5,quantity=$6,statusID=$7 where id=$8",
		[item.name,item.categoryID,item.description,item.price,item.dateadd,item.quantity,item.statusID,item.idsp],function(err,result)
		{
			callback(err);
		});
	}

};	

module.exports=GetListProduct;
