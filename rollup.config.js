import babel from '@rollup/plugin-babel';
import filesize from 'rollup-plugin-filesize';
import replace from '@rollup/plugin-replace';
import sizes from 'rollup-plugin-sizes';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV?.startsWith('prod');

const config = {
	external: [
		'spark-md5',
		'cross-fetch/polyfill',
		/@babel\/runtime/
	],
	output: {
		format: 'cjs',
		compact: false,
		exports: 'named',
	},
	plugins: [
		resolve({
			preferBuiltins: false,
			mainFields: ['browser', 'main']
		}),
		commonjs(),
		replace({
			preventAssignment: true,
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
		}),
		babel({
			include: ['src/*.js'],
			extensions: ['.js'],
			babelHelpers: 'runtime'
		}),
		filesize({ showMinifiedSize: false, showGzippedSize: !!process.env.DEBUG }),
	]
};

if(process.env.DEBUG) {
	config.plugins.splice(-1, 0, sizes());
}


export default [
	{ ...config, input: 'src/main.js', output: { ...config.output, file: 'lib/main.cjs' } },
	{ ...config, input: 'src/main-node.js', output: { ...config.output, file: 'lib/main-node.cjs' } },
	{ ...config, 
		external: [],
		input: 'src/main.js',
		output: { ...config.output, compact: true, name: 'ZoteroApiClient', format: 'umd', file: 'dist/zotero-api-client.js' },
		plugins: [ ...config.plugins, terser() ]
	}
];
