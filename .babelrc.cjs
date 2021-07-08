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
		"helpers": true,
		"regenerator": false,
	}]
];

module.exports = { presets, plugins };