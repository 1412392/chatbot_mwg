
var listProduct=require("../models/listproduct");


var dashboardController={
	index:function(req,res)
	{
		listProduct.findAll(function(err,ListProdut)
		{
			var Karaoke=0,Mobile=0,Laptop=0;

			for(var i=0;i<ListProdut.length;i++)
			{
				if(ListProdut[i].namecategory=="Karaoke")
				{
					Karaoke++;
				}
				else if(ListProdut[i].namecategory=="Laptop")
				{
					Laptop++;
				}
				else {
					Mobile++;
				}
			}

			
			res.render('Dashboard/index',{
				title:"Welcome to Admin page",
				ListProdut:ListProdut,
				Laptop:Laptop,
				Karaoke:Karaoke,
				Mobile:Mobile,
				user:req.user[0],


			});
		});
	}
};

module.exports=dashboardController;

