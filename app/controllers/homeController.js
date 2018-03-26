

var homeController={
	index:function(req,res)
	{

			
			res.render('home/index',{
				title:"RASA Tool - View logs and RASA NLU Analyze",
			
			});
		
	}
};

module.exports=homeController;

