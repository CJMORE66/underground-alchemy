import {build} from 'esbuild';
await build({entryPoints:['src/city-landmarks/index.js'],bundle:true,minify:true,format:'esm',target:'es2020',outfile:'dist/city-landmarks.js',legalComments:'eof'});
console.log('Built original illustrative 3D landmark layer.');
