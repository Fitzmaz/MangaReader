const CryptoJS = require("crypto-js");
const https = require("https")
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function decrypt(ctext) {
    var key = CryptoJS.enc.Utf8.parse("123456781234567G");
    var iv = CryptoJS.enc.Utf8.parse('ABCDEF1G34123412');
    var decrypt = CryptoJS.AES.decrypt(ctext, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    var chapterImages = JSON.parse(decryptedStr);
    return chapterImages;
}

function _parseHTML(html, cb) {
    html.replace(/chapterImages *= *"([^"]*)"/, (match, chapterImages) => {
        html.replace(/chapterPath *= *"([^"]*)"/, (match, chapterPath) => {
            html.replace(/prevChapterData *= *({[^;]*})/, (match, prevChapterData) => {
                html.replace(/nextChapterData *= *({[^;]*})/, (match, nextChapterData) => {
                    var prev = JSON.parse(prevChapterData);
                    var next = JSON.parse(nextChapterData);
                    cb(chapterImages, chapterPath, prev.id, next.id);
                });
            });
        });
    })
}

function _parseURL(filename, interPath) {
    var host = 'https://mhimg.eshanyao.com';
    if (filename.match(/^https?:\/\/(images.dmzj.com|imgsmall.dmzj.com)/i)) return 'http://222.186.43.94/showImage.php?url='+encodeURI(filename);
    if (filename.match(/^[a-z]\//i)) return 'http://222.186.43.94/showImage.php?url='+encodeURI("https://images.dmzj.com/"+filename);
    if (filename.match(/^(http:|https:|ftp:|^)\/\//i)) return filename;
    var relative = path.join(interPath, filename);
    var url = new URL(relative, host).toString();
    return url;
}

function requestPageInfo(comicID, chapterID, callback) {
    var options = {
        hostname: 'm.manhuafen.com',
        port: 443,
        path: `/comic/${comicID}/${chapterID}.html`,
        method: 'GET'
    };

    var req = https.request(options, (res) => {
        let body = [];
        res.on('data', (chunk) => {
            body.push(chunk);
        }).on('end', () => {
            let htmlstr = Buffer.concat(body).toString();
            _parseHTML(htmlstr, (chapterImages, chapterPath, prev, next) => {
                var images = decrypt(chapterImages);
                var urls = images.map((value) => {
                    return _parseURL(value, chapterPath);
                })
                callback(null, { urls, prev, next});
            });
        });
    });

    req.on('error', (err) => {
        console.error(err);
        callback(err, null);
    });
    req.end();
}

var pageCache = {};
function getPageInfo(comicID, chapterID) {
    return new Promise((resolve, reject) => {
        var identifier = `${comicID}_${chapterID}`;
        if (pageCache[identifier]) {
            resolve(pageCache[identifier])
        } else {
            requestPageInfo(comicID, chapterID, (err, pageInfo) => {
                if (!err) {
                    pageCache[identifier] = pageInfo;
                    resolve(pageInfo);
                } else {
                    reject(err);
                }
            });
        }
    });
}

function ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

function download(uri, filename, callback) {
    console.log('downloading ' + uri);
    ensureDirectoryExistence(filename)
    var file = fs.createWriteStream(filename);
    https.get(uri, (res) => {
        res.pipe(file);
        file.on('finish', () => {
            file.close(callback);
        });
    }).on('error', (err) => {
        fs.unlink(filename, (err) => {
            callback(`${filename} unlink failed`);
        });
        if (callback) callback(err.message);
    });
};

function imgPath(comicID, chapterID, page) {
    return `store/${comicID}/${chapterID}/${page}.jpg`;
}

function getFile(comicID, chapterID, page, callback) {
    getPageInfo(comicID, chapterID).then((pageInfo) => {
        var urls = pageInfo.urls;
        var index = page - 1;
        if (index < 0 || index >= urls.length) {
            callback('page exceeds');
        } else {
            var url = urls[index];
            var filename = imgPath(comicID, chapterID, page);
            download(url, filename, (err) => {
                if (err) {
                    console.log(filename + ' failed');
                    callback(filename + ' failed');
                } else {
                    console.log(filename + ' downloaded');
                    fs.readFile(filename, callback);
                }
            });
        }
    }, (reason) => {
        callback(reason);
    });
}

function getManga(comicID, chapterID, page) {
    return new Promise((resolve, reject) => {
        const filePath = imgPath(comicID, chapterID, page);
        fs.exists(filePath, (exist) => {
            if (!exist) {
                getFile(comicID, chapterID, page, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
                return;
            }
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    });
}

// getFile(55, 8472)

module.exports = { getManga, getPageInfo }