import js from "@eslint/js";
import globals from "globals";

export default [
	{ ignores: ["*.js", "**/*.js", "!src/*.js", "!test/*.js"] },
	{
		files: ["src/*.js"],
		...js.configs.recommended,
		languageOptions: {
			ecmaVersion: 14,
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			...js.configs.recommended.rules,
			"no-console": "off",
		},
	},
	{
		files: ["test/*.js"],
		...js.configs.recommended,
		languageOptions: {
			ecmaVersion: 14,
			sourceType: "module",
			globals: {
				...globals.jest,
				...globals.node,
			},
		},
	},
];