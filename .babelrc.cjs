const presets = [
	[
		"@babel/preset-env",
		{
			"corejs": 3,
			"debug": !!process.env.DEBUG || false,
			"useBuiltIns": "usage",
		}
	]
];

module.exports = { presets };