const express = require('express');
const app = express();
const http = require('http');
const WEBSOCKET = require('websocket');
const fs = require('fs');
const path = require('path');

const {buildSass} = require("./src/modules");

app.set('view engine', 'pug');


// Auto refresh
let fileAwait;
const fileWatcherEvent = (e, f) => {
    
    if ( fileAwait ) {
        clearTimeout(fileAwait);
    }

    fileAwait = setTimeout(() => {
        ws_controller?.send('1');
    }, 300);
}


fs.watch(__dirname + '/assets', {recursive: true}, fileWatcherEvent);
fs.watch(__dirname + '/views', {recursive: true}, fileWatcherEvent);
fs.watch(__dirname + '/data', {recursive: true}, fileWatcherEvent);


app.get('/autoRefresh.js', (req, res) => {
    res.send(`
        const ws = new WebSocket("ws://localhost:3000");
        ws.onopen = (e) => {
            // open
        };
        ws.onmessage = (e) => {
            switch(e.data) {
                case '0':
                    console.log("AutoRefresh Actived...");
                    break;
                case '1':
                    console.log("Refresh");
                    ws.close();
                    window.location.reload();
                    break;
            }
        }
        ws.onerror = (e) => {
            console.log("Socket Error ::=>", e);
        }
    `);
})

// Print view file
app.get('/:project/html/*', (req, res) => {

    const view_path = (() => {
        let url = req.url.replace('/html', '').replace('.html', '').slice(1);
        if ( /\/$/.test(url) ) {
            url += 'index';
        }
        return url;
    })();

    let params = {
        isDev: true,
        project: req.params.project
    };

    const customDataPath = __dirname + `/data/${view_path}.json`;
    if ( fs.existsSync(customDataPath) ) {
        try{
            let customData = JSON.parse( fs.readFileSync(customDataPath, {encoding: "utf-8"}) );
            Object.assign(params, customData);
        } catch(e) {

        }
    }
    
    const defaultDataPath = __dirname + `/data/${params.project}/default.json`
    if ( fs.existsSync(defaultDataPath) ) {
        try{
            let defaultData = JSON.parse( fs.readFileSync(defaultDataPath, {encoding: "utf-8"}) );
            Object.assign(params, defaultData);
        } catch(e) {

        }
    }
    // View
    if ( fs.existsSync(`./views/${view_path}.pug`) ) {
        // console.log("Params", params);
        res.render(view_path, params);
    }else {
        res.send(`No Pug file found in /views/${view_path}.pug`);
    }

});

const sendAssetFiles = (req, res) => {
    const {project} = req.params;

    let file_path = __dirname + `/assets${req.url}`;

    if ( fs.existsSync(file_path) ) {
        res.sendFile(file_path);
    } else if ( fs.existsSync( file_path.replace(project, 'global') ) ) {
        res.sendFile( file_path.replace(project, 'global') );
    } else {   
        res.status('404').end();
    }
}

const sendSassToCss = (req, res) => {
    // 프로젝트 sass > 글로벌 sass > 프로젝트 css > 글로벌 css > 파일 없음
    const {project} = req.params;

    const file_path = __dirname + `/assets${req.url}`;
    const file_sass = file_path.replace('.css', '.scss').replace('css', 'sass');
    const global_path = file_path.replace(project, 'global');
    const global_sass = file_sass.replace(project, 'global');

    if ( fs.existsSync(file_sass) ) {
        res.set('Content-Type', 'text/css').send(buildSass(file_sass));
    } else if ( fs.existsSync(global_sass) ) {   
        res.set('Content-Type', 'text/css').send(buildSass(global_sass));
    } else if ( fs.existsSync(file_path) ) {
        res.sendFile(file_path);
    } else if ( fs.existsSync( global_path ) ) {
        res.sendFile( global_path );
    } else {
        res.status('404').end();
    }

}

app.get("/:project/js/*", sendAssetFiles)
app.get("/:project/css/*", sendSassToCss)
app.get("/:project/font/*", sendAssetFiles)
app.get("/:project/images/*", sendAssetFiles)


app.get('/html/*', (req, res) => {
    const url = req.url;
    if ( fs.existsSync(`./views/global${url}.pug`) ) {
        res.render(`global${url}`);
    } else {
        res.send(`No Pug file found in /views/global${url}.pug`);
    }
})



const WEB_SERVER = http.createServer(app);

const WS_SERVER = new WEBSOCKET.server({
    httpServer: WEB_SERVER
});

let ws_controller;
WS_SERVER.on('request', (request) => {

    ws_controller = request.accept(null, request.origin);

    console.log("AutoRefresh Connected...");

    ws_controller.on('close', () => {
        console.log("AutoRefresh disconnected...");
    })

    ws_controller.send('0');
})

WS_SERVER.on('message', (msg) => {
    console.log("Message", msg.data);
})

WEB_SERVER.listen(3000, () => {
    console.log(`미래엔 시작 http://localhost:3000`);
});