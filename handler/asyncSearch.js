'use strict';
const http = require('http');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const querystring = require('querystring');
const fs = require('fs');

//module by 316523235@qq.com
let config = require('./../config.json');
const string = require('./../common/string.js');

/**
 * 得到图书的链接 http://www.fhxs.com/read/34/34891/
 * @param robotBook
 * @param callback
 */
exports.search = function(robotBook, callback) {
    if(config.isUseCache && existsBookIndex(robotBook.bookName)) {
    	var bookIndexUrl = getBookIndex(robotBook.bookName);
    	console.log('find cache bookName: ' + robotBook.bookName);
		console.log('find cache bookIndexUrl: ' + bookIndexUrl);
    	robot_Index(robotBook, bookIndexUrl, callback);
    	return;
    }

    var urlStr = string.stringFormat(config.searchUrl, config.searchId, encodeURI(robotBook.bookName));
	http.get(urlStr, function(res) {
		var body = [];
		res.on('data', function(chunk) {
			body.push(chunk);
		});
		res.on('end', function(chunk) {
			body = Buffer.concat(body);
			var str = iconv.decode(body, 'utf-8');
			if(str.indexOf('�') != -1){
                str = iconv.decode(body, 'gbk');
            }
			var htmlDom = cheerio.load(body);

			var realBook = htmlDom('.result-game-item-title-link[title="' + robotBook.bookName + '"]');
			//console.log(realBook);
			//console.log(realBook.length);
			if(realBook.length == 0) {
				//未找到该书籍
				console.log('http sussess, but don’t find book of "' + robotBook.bookName + '"' );
				console.log('Similar books list');
				var books = htmlDom('.result-game-item-title-link');
				for(var i = 0; i < books.length; i++) {
					console.log('--' + books[i].attribs.title);
				}
				return callback();
			}
			var attrs = realBook[0].attribs;
			var bookIndexUrl = attrs.href;

			console.log('find bookName: ' + robotBook.bookName);
			console.log('find bookIndexUrl: ' + bookIndexUrl);

			createBookIndex(robotBook.bookName, bookIndexUrl);
			robot_Index(robotBook, bookIndexUrl, callback);
		});
	});
};

function robot_Index(robotBook, indexUrl, callback) {
	http.get(indexUrl, function(res) {
		var body = [];
		res.on('data', function(chunk) {
			body.push(chunk);
		});
		res.on('end', function(chunk) {
			body = Buffer.concat(body);
			var str = iconv.decode(body, 'utf-8');
			if(str.indexOf('�') != -1){
                str = iconv.decode(body, 'gbk');
            }

			var htmlDom = cheerio.load(str);
			var arrUrls = []; // 存放每个章节的链接
			var dlList = htmlDom('#list').find("a");
			var startIndex = Math.min(robotBook.start, dlList.length);
			var endIndex = Math.min(robotBook.start + robotBook.len, dlList.length);
			console.log('抓取' + (startIndex + 1) + ' ~ ' + (endIndex + 1) + '章');
			while(endIndex > startIndex) {
				var t = {"index": startIndex, "name": dlList[startIndex].children[0].data||"", "url": dlList[startIndex].attribs.href||"" };
				arrUrls.push(t);
				startIndex++;
			}

			var realyRobotBook = { bookName: robotBook.bookName, start: startIndex, end: endIndex, errTimes: 0};
			if(arrUrls.length > 0)
				GetContent(arrUrls, realyRobotBook, callback);
			else
				callback();
		});
	});
}

/**
 * 得到单个章节具体内容
 * @param arrUrls
 * @param realyRobotBook
 * @param callback
 * @constructor
 */
function GetContent(arrUrls, realyRobotBook, callback) {
	if(arrUrls.length == 0) { console.log('robot ' + realyRobotBook.bookName + ' end\r\n'); callback(); return; } 

	if(existsChapter(realyRobotBook.bookName, arrUrls[0].name)) {
		console.log('local has charpter：' + arrUrls[0].name);
		arrUrls = arrUrls.slice(1, arrUrls.length);
    	GetContent(arrUrls, realyRobotBook, callback);
    	return;
	}

	http.get(arrUrls[0].url, function(res) {
		var body = [];
		res.on('data', function(chunk) {
			body.push(chunk);
		});
		res.on('end', function(chunk) {
			body = Buffer.concat(body);
			var str = iconv.decode(body, 'utf-8');
			if(str.indexOf('�') != -1){
                str = iconv.decode(body, 'gbk');
            }
            var dom = cheerio.load(str);
            // 得到每个章节的内容
            var content = dom('#TXT').text();
            // 存入硬盘
        	createChapter(realyRobotBook.bookName, arrUrls[0].name, content);
        	console.info('robot chapter OK: ' + arrUrls[0].name);
        	//进行下一章
        	arrUrls = arrUrls.slice(1, arrUrls.length);
    		setTimeout(function() {
                GetContent(arrUrls, realyRobotBook, callback)
            }, 1000 * config.nextMinite);
		});
		res.on('err', function(err) {
			console.log('robot ' + arrUrls[0].name + ' fail, err: ' + err);
			if(realyRobotBook.errTimes > 3) {
				callback();
			} else {
				realyRobotBook.errTimes += 1;
        		setTimeout(function() { GetContent(arrUrls, realyRobotBook, callback) }, 1000 * config.nextMinite); 
			}
		});
	});
}

/**
 * 创建图书目录，例如：txt/上仙，下面的一个index.txt保存了图书的url
 * @param bookName
 * @param indexUrl
 */
function createBookIndex(bookName, indexUrl) {
	if(!fs.existsSync('./txt'))
    	fs.mkdirSync('./txt');
	var path = string.stringFormat('./txt/{0}', bookName);
	if(!fs.existsSync(path))
    	fs.mkdirSync(path);
    fs.writeFileSync(path + '/index.txt', indexUrl);
}

function existsBookIndex(bookName) {
	var path = string.stringFormat('./txt/{0}', bookName);
	return fs.existsSync(path);
}

function getBookIndex(bookName) {
	var path = string.stringFormat('./txt/{0}/index.txt', bookName);
	return fs.readFileSync(path).toString();
}

function createChapter(bookName, chapterName, content) {
	var path = string.stringFormat('./txt/{0}/{1}.txt', bookName, chapterName);
    fs.writeFileSync(path, content);
}

function existsChapter(bookName, chapterName) {
	var path = string.stringFormat('./txt/{0}/{1}.txt', bookName, chapterName);
	return fs.existsSync(path);
}