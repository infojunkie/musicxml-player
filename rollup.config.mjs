// @ts-check
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import json from '@rollup/plugin-json';

import pkg from './package.json' assert { type: 'json' };

/**
 * Comment with library information to be appended in the generated bundles.
 */
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${pkg.author}
 * Released under the ${pkg.license} License.
 */
`;

/**
 * Creates an output options object for Rollup.js.
 * @param {import('rollup').OutputOptions} options
 * @returns {import('rollup').OutputOptions}
 */
function createOutputOptions(options) {
  return {
    banner,
    name: 'MusicXmlPlayer',
    exports: 'named',
    sourcemap: true,
    ...options,
  };
}

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: './src/index.ts',
  output: [
    // createOutputOptions({
    //   file: './dist/musicxml-player.js',
    //   format: 'commonjs',
    // }),
    // createOutputOptions({
    //   file: './dist/musicxml-player.cjs',
    //   format: 'commonjs',
    // }),
    // createOutputOptions({
    //   file: './dist/musicxml-player.mjs',
    //   format: 'esm',
    // }),
    createOutputOptions({
      file: './dist/musicxml-player.esm.js',
      format: 'esm',
      inlineDynamicImports: true,
    }),
    // createOutputOptions({
    //   file: './dist/musicxml-player.umd.js',
    //   format: 'umd',
    // }),
    // createOutputOptions({
    //   file: './dist/musicxml-player.umd.min.js',
    //   format: 'umd',
    //   plugins: [terser()],
    // }),
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    nodeResolve(),
    commonjs(),
    json(),
    nodePolyfills(),
  ],
};

export default options;
