Overview
--------
This is a lightweight, minimalistic Zotero API client written in JavaScript. It's been developed based on the following principles:

* Small, single purpose module, i.e. talk to the API
* Works in node & browser (with the help of babel & commonjs)
* No abstraction over Zotero data, what you see is what you get
* Clean api
* Minimal request validation
* Predictable and consistent responses
* Great test coverage, testing of all features

**Bear in mind it doesn't do any of the following:**

* Version management - version headers need to be provided explictely
* Caching - each call to get(), post() etc. will actually call the repo
* Abstraction - There is no **Item** or **Collection**

This library should be considered a low level tool to talk to the API. For more clever, high level API client with abstraction over data see [libZotero](https://github.com/fcheslack/libZoteroJS)

Getting The Library
-------------------

	npm i zoterojs


Quick Start
-----------

Quick example, read from the api in three lines of code (we're using [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) from ES2017)

	// require the library
	const api = require('zoterojs');

	// use the api to make an async request and wait for
	// the promise to resolve
	const items = await api().library('user', 475425).collections('9KH9TNSJ').items().get().getData();
	console.log(items.map(i => i.title));


Overview
--------

Library composes of three layers:

* An api function, which is the only interface exported.
* A request engine called by the api. It does the heavy lifting.
* An ApiResponse, or, more likely, its specialised variant


Documentation
-------------

{{>main}}

