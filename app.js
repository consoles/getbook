'use strict';
//module by npm
const async = require('async');

//module by 316523235@qq.com
//const config = require('./config.json');
const configMrg = require('./handler/configMrg.js');
const bookMrg = require('./handler/bookMrg.js');

//bookMrg.readBookList();
//return;
//新版，直接把小说名称放在robotBook.txt中就可以(小说间换行)

/*if(config.isInit) {
	crawlBook();
} else {
	configMrg.init(function() {
        crawlBook();
	});
}*/

let crawlBook = () => {
    bookMrg.readBookList();
    bookMrg.startRobot();
};

configMrg.init(function(){
    crawlBook();
});

//旧版一次只下载一个
return;
var search = require('./handler/search.js');

var bookName = process.argv.splice(2)[0] || '';
if(bookName == '')  {
	console.log('please input bookName, example: node app.js 上仙')
	return;
}
if(config.isInit) {
	search.search(bookName);
} else {
	configMrg.init(function() { search.search(bookName) });
}