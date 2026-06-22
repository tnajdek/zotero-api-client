const presets = [
	[
		"@babel/preset-env", {
			"debug": !!process.env.DEBUG || false,
			"useBuiltIns": false,
		}
	]
];
const plugins = [
	["@babel/plugin-transform-runtime", {
		"absoluteRuntime": false,
		"corejs": 3,
	}]
];

module.exports = { presets, plugins };