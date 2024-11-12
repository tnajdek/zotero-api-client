[![Build Status](https://github.com/tnajdek/zotero-api-client/actions/workflows/ci.yml/badge.svg)](https://github.com/tnajdek/zotero-api-client/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/tnajdek/zotero-api-client/badge.svg?branch=master)](https://coveralls.io/github/tnajdek/zotero-api-client?branch=master)
[![npm version](https://img.shields.io/npm/v/zotero-api-client)](https://www.npmjs.com/package/zotero-api-client)

Zotero API client
========
A lightweight, minimalistic Zotero API client developed in JavaScript with the following goals:

* Small, single-purpose module: focuses solely on interacting with the API
* Compatible with both Node and browser environments
* No abstraction over Zotero data: what you see is what you get
* Clean API
* Small bundle footprint
* Minimal request validation
* Predictable and consistent responses
* Full test coverage

**The client does *not* provide the following:**

* Version management: version headers need to be provided explicitly
* Caching: each call to `get()`, `post()`, etc., actually calls the API
* Abstraction: there are no **Item** or **Collection** objects. API response is returned with a minimal layer to automate common tasks and offers unrestricted access to the response raw JSON data.

Getting The Library
===================

The NPM package includes the source of the library, which can be used as part of your build process (e.g., with Browserify, Rollup, Webpack, etc.) or directly in Node:

```bash
npm install zotero-api-client
```

The package also includes a [UMD](https://github.com/umdjs/umd) bundle, which can be loaded with common module loaders or included directly in a `<script>` tag. In the latter case, the library will be available as a global object `ZoteroApiClient`. One way to use the UMD bundle on your page is to include it from the [unpkg](https://unpkg.com) project CDN:

```html
<script src="https://unpkg.com/zotero-api-client"></script>
```


Example
=======

A simple example of reading items from the public/test user library:

1. Import the library based on your environment:

   ```javascript
   // ES module, commonly used with a bundler:
   import api from 'zotero-api-client';
   // CommonJS, for Node.js and some bundling cases:
   const { default: api } = require('zotero-api-client');
   // UMD bundle creates `ZoteroApiClient` global object
   const { default: api } = ZoteroApiClient;
   ```

2. Use the API to make the request (using [async functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)):

   ```javascript
   const response = await api().library('user', 475425).collections('9KH9TNSJ').items().get();
   ```

3. Extract items from the response:

   ```javascript
   const items = response.getData();
   ```

4. Print the titles of all items in the library to the console:

   ```javascript
   console.log(items.map(i => i.title));
   ```

Overview
========

The library is composed of three layers:

- **`api` function**: This is the only interface exported for use.
- **Request engine**: This component does the heavy lifting and should not be used directly.
- **ApiResponse class**: Thin wrapper around the response. Multiple specialised variants exist for handling different response types.


API interface
-------------

The API interface is a function that returns a set of functions bound to previously configured options, allowing it to be chained and stored in a partially configured state. A common scenario is to store authentication and library details, which can be done as follows:

```javascript
import api from 'zotero-api-client';
const myapi = api('AUTH_KEY').library('user', 0);
```

This produces an API client already configured with your credentials and user library ID. You can now use `myapi` to obtain the list of collections in that library:

```javascript
const collectionsResponse = await myapi.collections().get();

```

Items in that library:

```javascript
const itemsResponse = await myapi.items().get();
```

Or items in a specific collection:

````js
const collectionItemsResponse = await myapi.collections('EXAMPLE1').items().get();
````

There are two types of API functions:

- **Configuration functions** (e.g., `items()`) that can be further chained.
- **Execution functions** (e.g., `get()`) that trigger the request.

For a complete reference, see the documentation for [api()](#module_zotero-api-client..api).

Response
--------

The response is an instance of a specialised response class object returned by one of the execution functions of the `api`. Each response includes a specialised `getData()` method, which returns the entities that were requested or modified, depending on the request configuration.

For a complete reference, see the documentation for [SingleReadResponse](#module_zotero-api-client..SingleReadResponse), [MultiReadResponse](#module_zotero-api-client..MultiReadResponse), [SingleWriteResponse](#module_zotero-api-client..SingleWriteResponse), [MultiWriteResponse](#module_zotero-api-client..MultiWriteResponse), [DeleteResponse](#module_zotero-api-client..DeleteResponse), [FileUploadResponse](#module_zotero-api-client..FileUploadResponse), [FileDownloadResponse](#module_zotero-api-client..FileDownloadResponse), [FileUrlResponse](#module_zotero-api-client..FileUrlResponse).

Request
-------

The `request` function takes a configuration object generated by the API interface, communicates with the API, and returns one of the response objects (see above). Some rarely used properties cannot be configured through API configuration functions and must be specified as optional properties when calling `api()` or one of the API's execution functions.

For a complete list of all properties `request()` accepts, please refer to the documentation for [request()](#module_zotero-api-client..request).

API Reference
=============

{{#module name="zotero-api-client"}}
{{>body}}
{{>member-index~}}
{{>separator~}}
{{>members~}}
{{/module}}
