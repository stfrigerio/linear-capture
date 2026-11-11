const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const shared = {
  entryPoints: ['src/index.js'],
  bundle: true,
  target: ['es2020'],
};

async function build() {
  // ESM (for npm import)
  await esbuild.build({
    ...shared,
    outfile: 'dist/linear-capture.esm.js',
    format: 'esm',
    sourcemap: true,
  });

  // IIFE (for <script> tag)
  await esbuild.build({
    ...shared,
    outfile: 'dist/linear-capture.js',
    format: 'iife',
    globalName: 'LinearCapture',
    sourcemap: true,
  });

  // Minified IIFE (production)
  await esbuild.build({
    ...shared,
    outfile: 'dist/linear-capture.min.js',
    format: 'iife',
    globalName: 'LinearCapture',
    minify: true,
  });

  // The query list for backend proxies: no browser code, ESM + CommonJS
  for (const [format, outfile] of [['esm', 'dist/queries.mjs'], ['cjs', 'dist/queries.cjs']]) {
    await esbuild.build({ entryPoints: ['src/queries.js'], bundle: true, platform: 'neutral', format, outfile });
  }

  console.log('✓ Built dist/linear-capture.esm.js');
  console.log('✓ Built dist/linear-capture.js');
  console.log('✓ Built dist/linear-capture.min.js');
  console.log('✓ Built dist/queries.mjs, dist/queries.cjs');
}

if (watch) {
  esbuild.context({
    ...shared,
    outfile: 'dist/linear-capture.esm.js',
    format: 'esm',
    sourcemap: true,
  }).then(ctx => {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  build().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
