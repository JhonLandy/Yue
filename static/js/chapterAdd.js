define(function (require, exports, module) {
	const Yue = require("./Yue.js")//自动化表单
	const $y = new Yue({els:'formChapter'});
	//保存
	$("#sumbit").click(function(){
		if($y.validtor()){
			let xhr = new XMLHttpRequest();
			xhr.open("post","/saveData",true);
			xhr.setRequestHeader("content-type", "application/json");
			xhr.onload = ()=> {
				console.log(xhr.responseText);
			}
			console.log(JSON.stringify($y.$data));
			xhr.send(JSON.stringify({
				data:6666
			}));
			return false;
		}
	});
});


