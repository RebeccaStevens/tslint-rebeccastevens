/**
 * Rollup Config.
 */
// @ts-check

import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginJson from 'rollup-plugin-json';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';

import glob from 'glob';

import terserConfig from './terser.config';

export default {
  // All toplevel ts files in src are inputs.
  input: glob.sync('./src/*.ts'),

  output: {
    dir: './rules',
    entryFileNames: '[name].js',
    chunkFileNames: 'common/[hash].js',
    format: 'cjs',
    sourcemap: false
  },

  experimentalCodeSplitting: true,

  external: [
    'tslint',
    'typescript'
  ],

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript(),
    rollupPluginJson(),
    rollupPluginTerser(terserConfig)
  ],

  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false
  }
};