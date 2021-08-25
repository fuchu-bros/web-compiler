// 미래엔 빌더
const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const pug = require('pug');
const readlineSync = require('readline-sync');
const {getDirectoryFiles, buildSassAll} = require('./src/modules');


console.log(":: Start mirae-n Builder ::");


const distPath = path.join(__dirname, "/dist");

if ( fs.existsSync(distPath) ) {
    let distMsg = "/dist directory has founded. Remove it?";
    if ( readlineSync.keyInYN(distMsg) ) {
        fs.rmdirSync(distPath, {recursive: true});
        fs.mkdirSync(distPath);
    } else {
        exit();
    }
}


// 프로젝트 목록 가져오기
const VIEWROOT = path.join(__dirname, "/views");
const projectLists = fs.readdirSync(VIEWROOT, {withFileTypes: true}).reduce((arr, f) => {
    if ( f.isDirectory() && f.name.indexOf('_') !== 0 ) {
        arr.push(f.name);
    }
    return arr;
}, []);

console.log(`${projectLists.length} project founded.`);

console.log(`Build all sass files...`);

buildSassAll(path.join(__dirname, "/assets"));


projectLists.forEach((project, i) => {
    const projectViewRoot = path.join(VIEWROOT, `/${project}`);
    const pugfiles = getDirectoryFiles(projectViewRoot, 'pug');
    const pugDistPath = path.join(__dirname, `/dist/${project}/html`);
    
    const defaultDataPath = path.join(__dirname, `/data/${project}/default.json`);
    let defaultData = {};
    if ( fs.existsSync(defaultDataPath) ) {
        try{
            defaultData = JSON.parse( fs.readFileSync(defaultDataPath, {encoding: "utf-8"}) );
        } catch(e) {

        }
    }

    // do pug 
    pugfiles.forEach(([viewPath, viewName], i) => {
        
        const savePath = path.join(pugDistPath, viewPath.replace(projectViewRoot, ''));
        
        const customDataPath = viewPath.replace('views', 'data') + "/" + viewName.replace('pug', 'json');
        let customData = {};
        if ( fs.existsSync(customDataPath) ) {
            try{
                customData = JSON.parse( fs.readFileSync(customDataPath, {encoding: "utf-8"}) );
                Object.assign(params, customData);
            } catch(e) {
                
            }
        }
        
        let params = Object.assign({
            isDev: false,
            project,
            basedir: VIEWROOT,
            pretty: true
        }, customData, defaultData);

        if ( !fs.existsSync(savePath) ) {
            fs.mkdirSync(savePath, {recursive: true});
        }
        // console.log(params, defaultDataPath, customDataPath);

        const renderPug = pug.renderFile(viewPath + `/${viewName}`, params);
        fs.writeFileSync(savePath + "/" + viewName.replace('pug', 'html'), renderPug);
        
        console.log(`Pug to Html : ${savePath}/${viewName.replace('pug', 'html')}`);
        
    });

    const targetPath = __dirname + `/dist/${project}`;

    const copyDir = ['css', 'font', 'images', 'js'];

    copyDir.forEach((dname, i) => {

        const projPath = __dirname + `/assets/${project}/${dname}`;
        const globalPath = __dirname + `/assets/global/${dname}`;
        if ( fs.existsSync(projPath) ) {
            getDirectoryFiles(projPath).forEach((cFile, idx) => {

                const copyPath = cFile[0].replace('assets', 'dist')
                if ( !fs.existsSync(copyPath) ) {
                    fs.mkdirSync(copyPath, {recursive: true});
                }

                fs.copyFileSync(
                    cFile.join("/"), 
                    copyPath + "/" + cFile[1]
                );
            })
        }

        if ( fs.existsSync(globalPath) ) {
            getDirectoryFiles(globalPath).forEach((cFile, idx) => {

                const copyPath = cFile[0].replace('assets', 'dist').replace('global', project);

                if ( !fs.existsSync(copyPath) ) {
                    fs.mkdirSync(copyPath, {recursive: true});
                }

                fs.copyFileSync(
                    cFile.join("/"), 
                    copyPath + "/" + cFile[1]
                );
            })
        }
    })
});


console.log(":: mirae-n build success. ::");