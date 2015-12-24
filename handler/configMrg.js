'use strict';

//module from npm
const http = require('http');
const cheerio = require('cheerio');
const iconv = require('iconv-lite'); // https://github.com/bnoordhuis/node-iconv
const fs = require('fs');

//module by ice
let config = require('./../config.json');

/**
 * init 读取配置文件，发送get请求，从网站获取searchId
 * @param callback
 * @returns {*}
 */
exports.init = function(callback) {

    if(config.isInit) {
		if(callback) return callback();
	}

	http.get(config.domain, function(res) {
		let body = [];
		res.on('data', function(chunk) {
			body.push(chunk);
		});
		res.on('end', function(chunk) {
			body = Buffer.concat(body); // what does this mean
			let str = iconv.decode(body, 'utf-8');
			if(str.indexOf('�') != -1){
                str = iconv.decode(body, 'gbk');
            }
			let htmlDom = cheerio.load(body);
			let s = htmlDom('input[name="s"]').val();
			config.searchId = s;
			config.isInit = true;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
			console.info('complete to get key');
			if(callback) return callback();
		});
		res.on('err', function(err) {
			if(callback) return callback('获取key失败：原因' + err);
		});
	});
};

