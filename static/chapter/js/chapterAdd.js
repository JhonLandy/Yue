define(function (require, exports, module) {
	const Yue  = require("./Yue.js")//自动化表单
	let fromData = null;
	ajax({
		url:"/getData",
		async:false,
		success:function(data){
			if(data){
				fromData = data[0];
			}
			console.log(fromData);
		}
	})
	let $y = new Yue({els:'formChapter',data:fromData});
	//保存
	$("#sumbit").click(function(){
		if($y.validtor()){
			ajax({
				type: "post",
				url: "/saveData",
				dataType: "application/json",
				data:$y.$data,
				success:function(data){
					console.log(data);
					$(".alert").css("opacity", 1);
					setTimeout(()=> {
						$(".alert").css("opacity", 0);
					},1300);
				}
			})
		}
	});
	function ajax(config) {
		let type = config.type  || "get";
		let data = config.data  || null;
		let cb   = config.success || null;
		let result = null;
		let async = config.async !== undefined ? config.async : true;
		
		let xhr = new XMLHttpRequest();
		xhr.open(type, config.url, async);
		if(config.dataType) {
			xhr.setRequestHeader("content-type", config.dataType);
		}
		if(data) {
			data = JSON.stringify(data);
		}
		xhr.onload = () => {
			if(type === "post") {
				result = xhr.responseText;
			} else {
				result = JSON.parse(xhr.responseText);
			}
			cb&&cb(result);
		}
		xhr.send(data);
	}
});


