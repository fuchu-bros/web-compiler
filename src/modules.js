const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const autoprefixer = require('autoprefixer-core');

const getDirectoryFiles = (path, ext = false) => {
    return fs.readdirSync(path, {withFileTypes: true}).reduce((arr, f) => {
        if ( f.isDirectory() ) {
            const currentPath = path + `/${f.name}`;
            arr = arr.concat(getDirectoryFiles(currentPath, ext));
        } else if (f.name.indexOf('_') !== 0) {
            if ( ext === false || f.name.indexOf(`.${ext}`) > -1 ) {
                arr.push([path, f.name]);
            }
        }

        return arr;
    }, []);
}

const fileWatcher = (watchPath, exts = [], callback, debug = false) => {
    if ( !watchPath ) {
        if ( debug ) console.log("첫번째 인자에 경로를 작성 해 주세요.");
    } else if ( fs.existsSync(watchPath) === false ) {
        if ( debug ) console.log("해당 경로가 존제하지 않습니다.", watchPath);
    } else if ( fs.lstatSync(watchPath).isDirectory() === false ) {
        if ( debug ) console.log("디렉토리가 아닙니다.", watchPath);
    } else {
        if ( debug ) console.log(watchPath, "경로를 주시합니다.");
        let lastChangedFile = '';
        fs.watch( watchPath, {recursive: true}, (e, f) => {
            if ( fs.lstatSync(path.join(watchPath, f)).isDirectory() ) {
                // 폴더는 스킵
                return;
            }
            if ( lastChangedFile === f ) {
                // wait
            } else if ( e === "change" ) {
                lastChangedFile = f;

                if ( debug ) console.log(f, "파일이 변경되었습니다.");

                const [ext, name, ...misc] = f.split(/[\/\\\.]/).reverse();

                if ( exts.indexOf(ext) === -1 ) {
                    return;
                }

                const project = misc.pop();
                const filename = `${name}.${ext}`;
                const fullPath = path.join(watchPath, project, misc.reverse().join('/'));

                if ( debug ) console.log(file_path, name, ext, project);

                const result = {
                    f,
                    fullPath, 
                    ext,
                    name,
                    project,
                    filename
                };

                if ( typeof callback === 'function' ) {
                    callback(result);
                }

                setTimeout(() => {
                    lastChangedFile = '';
                }, 100);
            }
        })
    }
}

const sassWatcher = (watchPath) => {
    const watchExts = ['scss', 'sass'];
    fileWatcher(watchPath, watchExts, ({fullPath, filename, name}) => {
        if ( filename.indexOf("_") === 0 ) {
            // build all file in project
            buildSassAll(watchPath);
        } else {
            // build current file
            const savePath = watchExts.reduce((p, c) => {
                if ( p.indexOf(c) > -1 ) {
                    p = p.replace(c, 'css');
                }
                return p;
            }, fullPath);
            buildSass(fullPath, filename, savePath, `${name}.css`);
        }
        console.log("Sass watch", fullPath, savePath);
    });
}

const buildSassAll = (rootPath) => {
    ['scss', 'sass'].forEach((v, i) => {
        getDirectoryFiles(rootPath, v).forEach(([targetPath, targetFile], idx) => {
            const savePath = targetPath.replace(/s[ac]ss/, 'css');
            const saveFile = targetFile.replace(v, 'css');
            buildSass(targetPath, targetFile, savePath, saveFile);
        });
    });
}

const buildSass = (targetPath, targetFile = '', savePath = null, saveFile = null) => {
    const targetFullPath = path.join(targetPath, targetFile);
    if ( fs.existsSync(targetFullPath) ) {
        try{

            const result = sass.renderSync({
                file: targetFullPath,
                outputStyle: 'expanded',
            });

            const renderedCss = autoprefixer.process(result.css).css;
            
            if ( savePath && saveFile ) {
                fileWriter(savePath, saveFile, renderedCss);
            }

            return renderedCss;

        } catch (e) {
            console.log("Sass builder error", e);
        }
    } else {
        // No File.
        console.log("Sass builder : No file found", targetFullPath);
    }
}

const fileWriter = (savePath, saveFile, body) => {

    if ( fs.existsSync(savePath) === false ) {
        fs.mkdirSync(savePath, {recursive: true});
    }

    const saveFullPath = path.join(savePath, saveFile);

    fs.writeFileSync(saveFullPath, body);

    console.log("File Created in", saveFullPath);
}

const getViewData = (project, path) => {
    // project path > global path > project default > global default
}

module.exports = {
    getDirectoryFiles,
    fileWatcher,
    sassWatcher,
    buildSass,
    buildSassAll
}