// inline css
// 

const postcss = require('postcss').parse;
const fs = require('fs');
const path = require('path');
const {getDirectoryFiles} = require('./modules')

let [,,buildOption] = process.argv;

if ( !buildOption ) buildOption = '--dev';

const range = (start = 0, gap = 1, max = 0) => {
    let result = [start];
    let current = start;

    while ( current < max ) {
        if ( gap.toString().indexOf('.') > -1 ) {
            // 소수점이 있다면
            var decimalLen = gap.toString().split('.').pop().length;

            current = (parseFloat(current) + parseFloat(gap)).toFixed(decimalLen);
        } else {
            current += gap;
        }
        result.push(current);
    }

    return result;
}

const propertyWithArray = (key, value = [], css) => {
    let result = {};
    value.forEach((v, i) => {
        const currentKey = key.replaceAll('*', v.toString().replace('.', ''));
        const currentCss = css.replaceAll('*', v);

        result[currentKey] = currentCss;
    })

    return result;
}

// 고정으로 사용되는 CSS
const fixedCss = {
    // position
    '.relative': `position: relative`,
    '.absolute': `position: absolute`,
    '.fixed': `position: fixed`,
    '.static': `position: static`,
    '.fill-row': 'left: 0;right: 0',
    '.fill-col': 'top: 0;bottom: 0',
    '.fill': `left: 0;right: 0;top: 0;bottom: 0`,

    // margin & padding
    '.mg-nth4-r-none *:nth-of-type(4n)': 'margin-right: 0',
    '.mg-auto': 'margin: auto',
    '.mg-auto-row': 'margin: 0 auto',
    '.mg-auto-col': 'margin: auto 0',
    '.pd-auto': 'padding: auto',
    '.pd-auto-row': 'padding: 0 auto',
    '.pd-auto-col': 'padding: auto 0',

    // font
    '.ta-c': `text-align: center`,
    '.ta-l': `text-align: left`,
    '.ta-r': `text-align: right`,
    '.fw-lighter': 'font-weight: lighter',
    '.fw-light': 'font-weight: light',
    '.fw-regular': 'font-weight: regular',
    '.fw-medium': 'font-weight: medium',
    '.fw-bold': 'font-weight: bold',
    '.fw-exbold': 'font-weight: extra-bold',
    '.ellipsis': 'word-break: break-all; white-space: nowrap; overflow: hidden; text-overflow: ellipsis',
    '.line-through': 'text-decoration: line-through',
    '.underline': 'text-decoration: underline',
    '.no-decoration': 'text-decoration: none',


    // flex
    '.justify-center': `justify-content: center`,
    '.justify-start': `justify-content: flex-start`,
    '.justify-end': `justify-content: flex-end`,
    '.justify-between': `justify-content: space-between`,
    '.justify-around': `justify-content: space-around`,

    '.items-center': `align-items: center`,
    '.items-start': `align-items: flex-start`,
    '.items-end': `align-items: flex-end`,
    '.items-stretch': `align-items: stretch`,
    '.items-between': `align-items: space-between`,
    '.items-around': `align-items: space-around`,

    '.flex-row': 'flex-direction: row',
    '.flex-col': 'flex-direction: column',
    '.flex-row-r': 'flex-direction: row-reverse',
    '.flex-col-r': 'flex-direction: column-reverse',
    '.flex-center': 'display: flex; justify-content: center; align-items: center',
    '.flex-col-center': 'display: flex; flex-direction: column; justify-content: center; align-items: center',
    '.flex-1': 'flex: 1',
    '.flex-wrap': 'flex-wrap: wrap',
    
    // display
    '.flex': `display: flex`,
    '.block': `display: block`,
    '.inline': `display: inline`,
    '.inblock': `display: inline-block`,
    '.none': 'display: none',


    // border
    '.round': 'border-radius: 50%',
    '.bd-last-none > *:last-child': 'border: none',

    // transition
    '.trans': 'transition-property: all',
    '.trans-linear': 'transition-timing-function: linear',
    '.trans-out': 'transition-timing-function: ease-out',
    '.trans-in': 'transition-timing-function: ease-in',
    '.trans-in-out': 'transition-timing-function: ease-in-out',
    
    // pointer
    '.pointer-none': 'pointer-events: none',
    '.pointer-all': 'pointer-events: all',

    // background
    '.bg-center': 'background-position: center',
    '.bg-left': 'background-position: 0 center',
    '.bg-right': 'background-position: 100% center',
    '.bg-cover': 'background-size: cover',
    '.bg-fill': 'background-position: center;background-size: cover',
    '.bg-no-repeat': 'background-repeat: no-repeat',
    '.bg-repeat': 'background-repeat: repeat',
    '.bg-repeat-x': 'background-repeat: repeat-x',
    '.bg-repeat-y': 'background-repeat: repeat-y',
    '.bg-fill-row': 'background-position: center;background-repeat: no-repeat;background-size: 100% auto',
    '.bg-fill-col': 'background-position: center;background-repeat: no-repeat;background-size: auto 100%',

    // overflow
    '.ov-h': 'overflow: hidden',
    '.ov-s': 'overflow: scroll',
    '.ov-v': 'overflow: visible',
    '.ov-sx': 'overflow-x: scroll; overflow-y: hidden',
    '.ov-sy': 'overflow-x: hidden; overflow-y: scroll',
    '.hide-scroll': '-ms-overflow-style: none;scrollbar-width: none',
    '.hide-scroll::-webkit-scrollbar': 'display: none',
}

const defaultRange = range(-1000, 1, 1000);
const percentRange = range(-100, 1, 100);
const borderRange = range(1, 1, 10);

// 필요한 수치를 모두 풀어놓기 사용
const rangeCss = {
    // Size
    ...propertyWithArray('.w-*', defaultRange, 'width: *px'),
    ...propertyWithArray('.h-*', defaultRange, 'height: *px'),
    ...propertyWithArray('.box-*', defaultRange, 'width: *px;height: *px'),

    ...propertyWithArray('.w-*vw', percentRange, 'width: *vw'),
    ...propertyWithArray('.h-*vw', percentRange, 'height: *vw'),
    ...propertyWithArray('.box-*vw', percentRange, 'width: *vw;height: *vw'),

    ...propertyWithArray('.w-*p', percentRange, 'width: *%'),
    ...propertyWithArray('.h-*p', percentRange, 'height: *%'),
    ...propertyWithArray('.box-*p', percentRange, 'width: *%;height: *%'),

    // position
    ...propertyWithArray('.top-*', defaultRange, 'top: *px'),
    ...propertyWithArray('.left-*', defaultRange, 'left: *px'),
    ...propertyWithArray('.bottom-*', defaultRange, 'bottom: *px'),
    ...propertyWithArray('.right-*', defaultRange, 'right: *px'),
    
    ...propertyWithArray('.top-*vw', percentRange, 'top: *vw'),
    ...propertyWithArray('.left-*vw', percentRange, 'left: *vw'),
    ...propertyWithArray('.bottom-*vw', percentRange, 'bottom: *vw'),
    ...propertyWithArray('.right-*vw', percentRange, 'right: *vw'),

    ...propertyWithArray('.top-*p', percentRange, 'top: *%'),
    ...propertyWithArray('.left-*p', percentRange, 'left: *%'),
    ...propertyWithArray('.bottom-*p', percentRange, 'bottom: *%'),
    ...propertyWithArray('.right-*p', percentRange, 'right: *%'),

    ...propertyWithArray('.zindex-*', range(-1, 1, 1000), 'z-index: *'),

    // margin & padding
    ...propertyWithArray('.mg-*', defaultRange, 'margin: *px'),
    ...propertyWithArray('.mg-t-*', defaultRange, 'margin-top: *px'),
    ...propertyWithArray('.mg-b-*', defaultRange, 'margin-bottom: *px'),
    ...propertyWithArray('.mg-l-*', defaultRange, 'margin-left: *px'),
    ...propertyWithArray('.mg-r-*', defaultRange, 'margin-right: *px'),
    ...propertyWithArray('.mg-row-*', defaultRange, 'margin: 0 *px'),
    ...propertyWithArray('.mg-col-*', defaultRange, 'margin: *px 0'),

    ...propertyWithArray('.mg-*vw', percentRange, 'margin: *vw'),
    ...propertyWithArray('.mg-t-*vw', percentRange, 'margin-top: *vw'),
    ...propertyWithArray('.mg-b-*vw', percentRange, 'margin-bottom: *vw'),
    ...propertyWithArray('.mg-l-*vw', percentRange, 'margin-left: *vw'),
    ...propertyWithArray('.mg-r-*vw', percentRange, 'margin-right: *vw'),
    ...propertyWithArray('.mg-row-*vw', percentRange, 'margin: 0 *vw'),
    ...propertyWithArray('.mg-col-*vw', percentRange, 'margin: *vw 0'),

    ...propertyWithArray('.mg-*p', percentRange, 'margin: *%'),
    ...propertyWithArray('.mg-t-*p', percentRange, 'margin-top: *%'),
    ...propertyWithArray('.mg-b-*p', percentRange, 'margin-bottom: *%'),
    ...propertyWithArray('.mg-l-*p', percentRange, 'margin-left: *%'),
    ...propertyWithArray('.mg-r-*p', percentRange, 'margin-right: *%'),
    ...propertyWithArray('.mg-row-*p', percentRange, 'margin: 0 *%'),
    ...propertyWithArray('.mg-col-*p', percentRange, 'margin: *% 0'),
    
    ...propertyWithArray('.pd-*', defaultRange, 'padding: *px'),
    ...propertyWithArray('.pd-t-*', defaultRange, 'padding-top: *px'),
    ...propertyWithArray('.pd-b-*', defaultRange, 'padding-bottom: *px'),
    ...propertyWithArray('.pd-l-*', defaultRange, 'padding-left: *px'),
    ...propertyWithArray('.pd-r-*', defaultRange, 'padding-right: *px'),
    ...propertyWithArray('.pd-row-*', defaultRange, 'padding: 0 *px'),
    ...propertyWithArray('.pd-col-*', defaultRange, 'padding: *px 0'),

    ...propertyWithArray('.pd-*vw', percentRange, 'padding: *vw'),
    ...propertyWithArray('.pd-t-*vw', percentRange, 'padding-top: *vw'),
    ...propertyWithArray('.pd-b-*vw', percentRange, 'padding-bottom: *vw'),
    ...propertyWithArray('.pd-l-*vw', percentRange, 'padding-left: *vw'),
    ...propertyWithArray('.pd-r-*vw', percentRange, 'padding-right: *vw'),
    ...propertyWithArray('.pd-row-*vw', percentRange, 'padding: 0 *vw'),
    ...propertyWithArray('.pd-col-*vw', percentRange, 'padding: *vw 0'),

    ...propertyWithArray('.pd-*p', percentRange, 'padding: *%'),
    ...propertyWithArray('.pd-t-*p', percentRange, 'padding-top: *%'),
    ...propertyWithArray('.pd-b-*p', percentRange, 'padding-bottom: *%'),
    ...propertyWithArray('.pd-l-*p', percentRange, 'padding-left: *%'),
    ...propertyWithArray('.pd-r-*p', percentRange, 'padding-right: *%'),
    ...propertyWithArray('.pd-row-*p', percentRange, 'padding: 0 *%'),
    ...propertyWithArray('.pd-col-*p', percentRange, 'padding: *% 0'),
    
    // font
    ...propertyWithArray('.fs-*', range(1, 1, 500), 'font-size: *px'),
    ...propertyWithArray('.lh-*', range(1, 0.1, 10), 'line-height: *em'),
    ...propertyWithArray('.fw-*', range(100, 100, 700), 'font-weight: *'),
    ...propertyWithArray('.ls-*', range(0, 0.01, 1), 'letter-spacing: *em'),
    
    // border
    ...propertyWithArray('.bd-*', borderRange, 'border: *px solid transparent'),
    ...propertyWithArray('.bd-t-*', borderRange, 'border-top: *px solid transparent'),
    ...propertyWithArray('.bd-b-*', borderRange, 'border-bottom: *px solid transparent'),
    ...propertyWithArray('.bd-l-*', borderRange, 'border-left: *px solid transparent'),
    ...propertyWithArray('.bd-r-*', borderRange, 'border-right: *px solid transparent'),
    
    // transform
    ...propertyWithArray('.rotate-*', range(-360, 1, 360), 'transform: rotate(*deg)'),
    ...propertyWithArray('.scale-*', range(0, 0.1, 10), 'transform: scale(*)'),
    ...propertyWithArray('.trans-x-*p', percentRange, 'transform: translateX(*%)'),

    // transition
    ...propertyWithArray('.trans-duration-*', range(0, 0.1, 20), 'transition-duration: *s'),
    ...propertyWithArray('.trans-delay-*', range(0, 0.1, 20), 'transition-delay: *s'),
    
    // opacity
    ...propertyWithArray('.opacity-*', range(0, .1, 1), 'opacity: *'),
};

const inlineCss = Object.assign({}, fixedCss, rangeCss);
const objectToCss = (cssObjectData) => {
    let cssString = Object.keys(cssObjectData).reduce((prev, current) => {
        return prev + `\n${current}{${cssObjectData[current]}}`;
    }, '');

    return cssString;
}

if ( buildOption == '--dev' ) {

    const cssText = objectToCss(inlineCss);
    // console.log(cssText.toString());
    fs.writeFileSync(path.join(__dirname, '/../assets/global/css/inline.css'), cssText.toString());
    
} else if (buildOption == '--production' ) {

    ['mirae-book-pc', 'mirae-n', 'mirae-n-m'].forEach(project => {
        const findPath = path.join(__dirname, `/../dist/${project}`);
        let matchedClassProps;
        let filteredRangeCss = {};

        getDirectoryFiles(findPath, 'html').forEach(f => {
            let targetHtml = fs.readFileSync(f.join('/'), {encoding: 'UTF-8'});

            
            while (matchedClassProps = /class="([a-z0-9-_\s]*)"/gi.exec(targetHtml)) {
                matchedClassProps[1].split(' ').forEach(v => {
                    let key = `.${v}`;
                    if ( rangeCss[key] ) {
                        filteredRangeCss[key] = rangeCss[key];
                    }
                });
                targetHtml = targetHtml.replaceAll(matchedClassProps[0], '');
            }
        });

        const cssText = objectToCss(Object.assign({}, fixedCss, filteredRangeCss));
        fs.writeFileSync(path.join(__dirname, `/../dist/${project}/css/inline.css`), cssText);
    })


}
