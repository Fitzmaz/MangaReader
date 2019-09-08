const http = require('http');
const { URL } = require('url');

const { getManga, getPageInfo } = require('./manga.js')

http.createServer((request, response) => {

    request.on('error', (err) => {
        console.error(err);
        response.statusCode = 400;
        response.end();
    });
    response.on('error', (err) => {
        console.log(err);
    });

    const { headers, method, url } = request;
    const { pathname, query, searchParams } = new URL(url, 'scheme://host');
    console.log(`${method} ${url}`);
    console.log(`${pathname} ${searchParams.toString()}`);

    if (pathname === '/echo') {
        request.pipe(response);
    } else if (pathname === '/helloworld') {
        response.write('<html>');
        response.write('<body>');
        response.write('<h1>Hello, World!</h1>');
        response.write('</body>');
        response.write('</html>');
        response.end();
    } else if (pathname === '/manga') {
        const comicID = searchParams.get('comicID');
        const chapterID = searchParams.get('chapterID');
        const page = searchParams.get('page');
        getManga(comicID, chapterID, page).then(data => {
            response.setHeader('Content-type', 'image/jpeg');
            // response.setHeader('Cache-Control', 'max-age=31536000');
            response.end(data);
        }, err => {
            response.statusCode = 500;
            response.end(`1Error getting the file: ${err}.`);
        });
    } else if (pathname === '/pageInfo') {
        const comicID = searchParams.get('comicID');
        const chapterID = searchParams.get('chapterID');
        getPageInfo(comicID, chapterID).then(value => {
            response.setHeader('Access-Control-Allow-Origin', '*')
            response.end(JSON.stringify(value));
        }, reason => {
            response.statusCode = 500;
            response.end(`Error getting pageInfo: ${reason}.`);
        });
    } else {
        response.statusCode = 404;
        response.end();
    }
}).listen(8080);