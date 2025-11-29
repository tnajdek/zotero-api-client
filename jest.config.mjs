export default {
	maxWorkers: "50%",
	restoreMocks: true,
	coverageProvider: "v8",
	coverageDirectory: "coverage",
	coverageReporters: ['lcov', ['text', {skipFull: false}]],
	coveragePathIgnorePatterns: [
		"/node_modules/",
		"test/fixtures/",
		"test/mocks/",
	],
}
