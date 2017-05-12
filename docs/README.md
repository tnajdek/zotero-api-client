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
* Caching - each call to get(), post() etc. will actually call the api
* Abstraction - There is no **Item** or **Collection**

This library should be considered a low level tool to talk to the API. For more clever, high level API client with abstraction over data see [libZotero](https://github.com/fcheslack/libZoteroJS)

Getting The Library
-------------------

	npm i zoterojs


Example
-----------

Simple example reading items from the public/test user library.

1. Require the library

	const api = require('zoterojs');

1. Use the api to make the request (we're using [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function))

	const response = await api().library('user', 475425).collections('9KH9TNSJ').items().get();

1. Extract items from the response

	const items = response.getData();

1. Print titles of all the items in the library to console

	console.log(items.map(i => i.title));


Overview
--------

Library composes of three layers:

* An api function, which is the only interface exported.
* A request engine called by the api. It does the heavy lifting.
* An ApiResponse, or, more likely, its specialised variant


Documentation
-------------

Library composes of three layers:

* An api function, which is the only interface exported.
* A request engine called by the api. It does the heavy lifting.
* An ApiResponse, or, more likely, its specialised variant


API interface
=============

API interface is a function that returns set of functions bound to previously configured options. This way it can be chained and stored at any level. Common scenario is to store authentication details and library details, which can be done quite simply:

	const myapi = require('zoterojs')('AUTH').library('user', 0);

That produces api client already configured with your credentials and user library id. You can re-use it obtain list of collections in that library:

	const itemsResponse = await myapi.collections().get();

Items in that library:

	const itemsResponse = await myapi.collections().get();

Or items in specific collection:

	const collectionItemsResponse = await myapi.collections('EXAMPLE1').items().get();

There two types of api functions, configuration functions (e.g. `items()`) that can be further chained and execution functions (e.g. `get()`) that fire up the request. 

For complete reference, please see documentation for <a href="#module_api">api()</a>.

Request
=======

Request is a function that takes a complex configuration object generated by the api interface, communicates with the API and returns one of the response objects (see below). Some rarely used properties cannot be configured using api configuration functions and have to be specified as optional properties when calling `api()` or one of the execution functions of the api.

For a complete list of all the properties request() accepts, please see documentation for <a href="#module_request">request()</a>.

Response
========



{{>main}}
