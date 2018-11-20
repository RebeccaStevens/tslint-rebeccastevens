/**
 * Rollup Config.
 */
// @ts-check

import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';
import rollupPluginUnassert from 'rollup-plugin-unassert';

import glob from 'glob';

import terserConfig from './terser.config';
import commonjsConfig from './commonjs.config';

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
    'tsutils',
    'tsutils/typeguard',
    'tsutils/util',
    'typescript'
  ],

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(commonjsConfig),
    rollupPluginTypescript(),
    rollupPluginUnassert({
      include: './src/**/*.ts'
    }),
    rollupPluginTerser(terserConfig)
  ],

  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false
  }
};
