[![Build Status](https://github.com/tnajdek/zotero-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/tnajdek/zotero-api-client/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/tnajdek/zotero-api-client/badge.svg?branch=master)](https://coveralls.io/github/tnajdek/zotero-api-client?branch=master)
[![npm version](https://img.shields.io/npm/v/zotero-api-client)](https://www.npmjs.com/package/zotero-api-client)

Zotero API client
========
A lightweight, minimalistic Zotero API client developed in JavaScript with the following goals in mind:

* Small, single purpose module, i.e. talk to the API
* Works in both node & browser environment
* No abstraction over Zotero data, what you see is what you get
* Clean api
* Small bundle footprint
* Minimal request validation
* Predictable and consistent responses
* Full test coverage

**It doesn't do any of the following:**

* Version management - version headers need to be provided explictely
* Caching - each call to get(), post() etc. will actually call the api
* Abstraction - There is no **Item** or **Collection** objects, only raw JSON

Getting The Library
===================

NPM package contains source of the library which can be used as part of your build (e.g. when using browserify/rollup/webpack etc.) process or directly in node:

	npm install zotero-api-client

Also included in the package is an [UMD](https://github.com/umdjs/umd) bundle which can be loaded using common loaders or included directly in a `<script>` tag. In the latter case library will be available as a global scope object `ZoteroApiClient`. One way of using UMD bundle on your page is to include it from [unpkg](https://unpkg.com) project CDN:

```html
<script src="https://unpkg.com/zotero-api-client"></script>
```


Example
=======

Simple example reading items from the public/test user library.

1. Import the library, pick one depending on your environment:

```javascript
// es module, most scenarios when using a bundler:
import api from 'zotero-api-client'
// common-js, node and some cases when using a bundler:
const { default: api } = require('zotero-api-client');
// UMD bundle creates `ZoteroApiClient` global object
const { default: api } = ZoteroApiClient;
```

2. Use the api to make the request (we're using [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function))

```javascript
const response = await api().library('user', 475425).collections('9KH9TNSJ').items().get();
```

3. Extract items from the response

```javascript
const items = response.getData();
```

4. Print titles of all the items in the library to console

```javascript
console.log(items.map(i => i.title));
```

Overview
========

Library composes of three layers:

* An api function, which is the only interface exported.
* A request engine called by the api. It does the heavy lifting. Should not be used directly.
* An ApiResponse, which has multiple specialised variants


API interface
-------------

API interface is a function that returns set of functions bound to previously configured options. This way it can be chained and stored at any level. Common scenario is to store authentication details and library details, which can be done quite simply:

```javascript
import api from 'zotero-api-client';
const myapi = api('AUTH_KEY').library('user', 0);
```

That produces api client already configured with your credentials and user library id. You can re-use it obtain list of collections in that library:

```javascript
const itemsResponse = await myapi.items().get();
```

Items in that library:

```javascript
const itemsResponse = await myapi.collections().get();
```

Or items in specific collection:

````js
const collectionItemsResponse = await myapi.collections('EXAMPLE1').items().get();
````

There two types of api functions, configuration functions (e.g. `items()`) that can be further chained and execution functions (e.g. `get()`) that fire up the request. 

For complete reference, please see documentation for [api()](#module_zotero-api-client..api).

Response
--------

Response is an instance of a specialised response class object returned by one of the execution functions of the `api`. Each response contains a specialised `getData()` method that will return entities requested or modified, depending on request configuration.

For complete reference, please see documentation [SingleReadResponse](#module_zotero-api-client..SingleReadResponse), [MultiReadResponse](#module_zotero-api-client..MultiReadResponse), [SingleWriteResponse](#module_zotero-api-client..SingleWriteResponse), [MultiWriteResponse](#module_zotero-api-client..MultiWriteResponse), [DeleteResponse](#module_zotero-api-client..DeleteResponse), [FileUploadResponse](#module_zotero-api-client..FileUploadResponse), [FileDownloadResponse](#module_zotero-api-client..FileDownloadResponse), [FileUrlResponse](#module_zotero-api-client..FileUrlResponse).

Request
-------

Request is a function that takes a complex configuration object generated by the api interface, communicates with the API and returns one of the response objects (see below). Some rarely used properties cannot be configured using api configuration functions and have to be specified as optional properties when calling `api()` or one of the execution functions of the api.

For a complete list of all the properties request() accepts, please see documentation for [request()](#module_zotero-api-client..request).

API Reference
=============

{{#module name="zotero-api-client"}}
{{>body}}
{{>member-index~}}
{{>separator~}}
{{>members~}}
{{/module}}
