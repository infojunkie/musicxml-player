import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';
import { build } from 'esbuild';
import process from 'process';

// https://stackoverflow.com/a/69409483/209184
const argv = key => {
  // Return true if the key exists and a value is undefined
  if ( process.argv.includes( `--${ key }` ) ) return true;

  const value = process.argv.find( element => element.startsWith( `--${ key }=` ) );

  // Return null if the key does not exist and a value is undefined
  if ( !value ) return null;

  return value.replace( `--${ key }=` , '' );
}

const targets = {
  'esm': {
    format: 'esm',
    outfile: 'build/musicxml-player.mjs',
  },
  'cjs': {
    format: 'cjs',
    platform: 'node',
    packages: 'external',
    outfile: 'build/musicxml-player.cjs',
  }
}

const format = argv('format') ?? 'mjs';
build({
  entryPoints: ['src/index.ts'],
  plugins: [nodeModulesPolyfillPlugin()],
  bundle: true,
  minify: true,
  sourcemap: true,
  ...targets[format]
});
