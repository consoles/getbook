'use strict';

exports.stringFormat = function(){

	if (arguments.length == 0) {
        return null;
    }
	let str = arguments[0];
	for (let i = 1; i < arguments.length; i++) {
        let re = new RegExp('\\{' + (i - 1) + '\\}', 'gm'); // g全局匹配，m匹配多行
        str = str.replace(re, arguments[i]); // 将匹配的字符用后面的替换
	}
	return str;
};

/*
exports.ClearBom = function(buff) {
	if (buff[0].toString(16).toLowerCase() == "ef" 
		&& buff[1].toString(16).toLowerCase() == "bb" 
		&& buff[2].toString(16).toLowerCase() == "bf") {
			buff = buff.slice(3);
	}
	return buff;
};
*/


//test
//var t = stringFormat('&Type={0}{1}', 'straa', '33');
//console.log(t);