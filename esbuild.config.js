const esbuild = require('esbuild');
const fs = require('fs');

esbuild
    .build({
        entryPoints: ['src/main.ts'],
        bundle: true,
        minify: false,
        sourcemap: true,
        outfile: 'dist/main.js',
        platform: 'neutral',
        target: ['es2019'],
        format: 'esm',
        external: ['google-apps-script'],
    })
    .then(() => {
        console.log('ビルドが完了しました。');

        fs.copyFileSync('src/appsscript.json', 'dist/appsscript.json');
        console.log('appsscript.json が dist フォルダにコピーされました');
    })
    .catch(() => process.exit(1));
