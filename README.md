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


* [zotero-api-client](#module_zotero-api-client)
    * [~ApiResponse](#module_zotero-api-client..ApiResponse)
        * [.getResponseType()](#module_zotero-api-client..ApiResponse+getResponseType) ⇒ <code>string</code>
        * [.getData()](#module_zotero-api-client..ApiResponse+getData) ⇒ <code>object</code>
        * [.getLinks()](#module_zotero-api-client..ApiResponse+getLinks) ⇒ <code>object</code>
        * [.getMeta()](#module_zotero-api-client..ApiResponse+getMeta) ⇒ <code>object</code>
        * [.getVersion()](#module_zotero-api-client..ApiResponse+getVersion) ⇒ <code>number</code>
    * [~SingleReadResponse](#module_zotero-api-client..SingleReadResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..SingleReadResponse+getResponseType)
        * [.getData()](#module_zotero-api-client..SingleReadResponse+getData) ⇒ <code>Object</code>
    * [~MultiReadResponse](#module_zotero-api-client..MultiReadResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..MultiReadResponse+getResponseType)
        * [.getData()](#module_zotero-api-client..MultiReadResponse+getData) ⇒ <code>Array</code>
        * [.getLinks()](#module_zotero-api-client..MultiReadResponse+getLinks) ⇒ <code>Array</code>
        * [.getMeta()](#module_zotero-api-client..MultiReadResponse+getMeta) ⇒ <code>Array</code>
        * [.getTotalResults()](#module_zotero-api-client..MultiReadResponse+getTotalResults) ⇒ <code>string</code>
        * [.getRelLinks()](#module_zotero-api-client..MultiReadResponse+getRelLinks) ⇒ <code>object</code>
    * [~SingleWriteResponse](#module_zotero-api-client..SingleWriteResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..SingleWriteResponse+getResponseType)
        * [.getData()](#module_zotero-api-client..SingleWriteResponse+getData) ⇒ <code>Object</code>
    * [~MultiWriteResponse](#module_zotero-api-client..MultiWriteResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..MultiWriteResponse+getResponseType)
        * [.isSuccess()](#module_zotero-api-client..MultiWriteResponse+isSuccess) ⇒ <code>Boolean</code>
        * [.getData()](#module_zotero-api-client..MultiWriteResponse+getData) ⇒ <code>Array</code>
        * [.getLinks()](#module_zotero-api-client..MultiWriteResponse+getLinks)
        * [.getMeta()](#module_zotero-api-client..MultiWriteResponse+getMeta)
        * [.getErrors()](#module_zotero-api-client..MultiWriteResponse+getErrors) ⇒ <code>Object</code>
        * [.getEntityByKey(key)](#module_zotero-api-client..MultiWriteResponse+getEntityByKey)
        * [.getEntityByIndex(index)](#module_zotero-api-client..MultiWriteResponse+getEntityByIndex) ⇒ <code>Object</code>
    * [~DeleteResponse](#module_zotero-api-client..DeleteResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..DeleteResponse+getResponseType)
    * [~FileUploadResponse](#module_zotero-api-client..FileUploadResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..FileUploadResponse+getResponseType)
        * [.getVersion()](#module_zotero-api-client..FileUploadResponse+getVersion)
    * [~FileDownloadResponse](#module_zotero-api-client..FileDownloadResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..FileDownloadResponse+getResponseType)
    * [~FileUrlResponse](#module_zotero-api-client..FileUrlResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..FileUrlResponse+getResponseType)
    * [~RawApiResponse](#module_zotero-api-client..RawApiResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..RawApiResponse+getResponseType)
    * [~PretendResponse](#module_zotero-api-client..PretendResponse) ⇐ <code>ApiResponse</code>
        * [.getResponseType()](#module_zotero-api-client..PretendResponse+getResponseType)
        * [.getVersion()](#module_zotero-api-client..PretendResponse+getVersion) ⇒ <code>Object</code>
    * [~ErrorResponse](#module_zotero-api-client..ErrorResponse) ⇐ <code>Error</code>
        * [.getResponseType()](#module_zotero-api-client..ErrorResponse+getResponseType)
    * [~api()](#module_zotero-api-client..api) ⇒ <code>Object</code>
        * [~api(key, opts)](#module_zotero-api-client..api..api) ⇒ <code>Object</code>
        * [~library([typeOrKey], [id])](#module_zotero-api-client..api..library) ⇒ <code>Object</code>
        * [~items(items)](#module_zotero-api-client..api..items) ⇒ <code>Object</code>
        * [~itemTypes()](#module_zotero-api-client..api..itemTypes) ⇒ <code>Object</code>
        * [~itemFields()](#module_zotero-api-client..api..itemFields) ⇒ <code>Object</code>
        * [~creatorFields()](#module_zotero-api-client..api..creatorFields) ⇒ <code>Object</code>
        * [~schema()](#module_zotero-api-client..api..schema) ⇒ <code>Object</code>
        * [~itemTypeFields(itemType)](#module_zotero-api-client..api..itemTypeFields) ⇒ <code>Object</code>
        * [~itemTypeCreatorTypes(itemType)](#module_zotero-api-client..api..itemTypeCreatorTypes) ⇒ <code>Object</code>
        * [~template(itemType)](#module_zotero-api-client..api..template) ⇒ <code>Object</code>
        * [~collections(items)](#module_zotero-api-client..api..collections) ⇒ <code>Object</code>
        * [~subcollections()](#module_zotero-api-client..api..subcollections) ⇒ <code>Object</code>
        * [~publications()](#module_zotero-api-client..api..publications) ⇒ <code>Object</code>
        * [~tags(tags)](#module_zotero-api-client..api..tags) ⇒ <code>Object</code>
        * [~searches(searches)](#module_zotero-api-client..api..searches) ⇒ <code>Object</code>
        * [~top()](#module_zotero-api-client..api..top) ⇒ <code>Object</code>
        * [~trash()](#module_zotero-api-client..api..trash) ⇒ <code>Object</code>
        * [~children()](#module_zotero-api-client..api..children) ⇒ <code>Object</code>
        * [~settings(settings)](#module_zotero-api-client..api..settings) ⇒ <code>Object</code>
        * [~deleted()](#module_zotero-api-client..api..deleted) ⇒ <code>Object</code>
        * [~groups()](#module_zotero-api-client..api..groups) ⇒ <code>Object</code>
        * [~version(version)](#module_zotero-api-client..api..version) ⇒ <code>Object</code>
        * [~attachment(fileName, file, mtime, md5sum)](#module_zotero-api-client..api..attachment) ⇒ <code>Object</code>
        * [~registerAttachment(fileName, fileSize, mtime, md5sum)](#module_zotero-api-client..api..registerAttachment) ⇒ <code>Object</code>
        * [~attachmentUrl()](#module_zotero-api-client..api..attachmentUrl) ⇒ <code>Object</code>
        * [~verifyKeyAccess()](#module_zotero-api-client..api..verifyKeyAccess) ⇒ <code>Object</code>
        * [~get(opts)](#module_zotero-api-client..api..get) ⇒ <code>Promise</code>
        * [~post(data, opts)](#module_zotero-api-client..api..post) ⇒ <code>Promise</code>
        * [~put(data, opts)](#module_zotero-api-client..api..put) ⇒ <code>Promise</code>
        * [~patch(data, opts)](#module_zotero-api-client..api..patch) ⇒ <code>Promise</code>
        * [~del(keysToDelete, opts)](#module_zotero-api-client..api..del) ⇒ <code>Promise</code>
        * [~getConfig()](#module_zotero-api-client..api..getConfig) ⇒ <code>Object</code>
        * [~pretend(verb, data, opts)](#module_zotero-api-client..api..pretend) ⇒ <code>Promise</code>
        * [~use(extend)](#module_zotero-api-client..api..use) ⇒ <code>Object</code>
    * [~request()](#module_zotero-api-client..request) ⇒ <code>Object</code>

<a name="module_zotero-api-client..ApiResponse"></a>

### zotero-api-client~ApiResponse
Represents a generic Zotero API response. Usually a specialised variant inheriting from
this class is returned when doing an API request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  

* [~ApiResponse](#module_zotero-api-client..ApiResponse)
    * [.getResponseType()](#module_zotero-api-client..ApiResponse+getResponseType) ⇒ <code>string</code>
    * [.getData()](#module_zotero-api-client..ApiResponse+getData) ⇒ <code>object</code>
    * [.getLinks()](#module_zotero-api-client..ApiResponse+getLinks) ⇒ <code>object</code>
    * [.getMeta()](#module_zotero-api-client..ApiResponse+getMeta) ⇒ <code>object</code>
    * [.getVersion()](#module_zotero-api-client..ApiResponse+getVersion) ⇒ <code>number</code>

<a name="module_zotero-api-client..ApiResponse+getResponseType"></a>

#### apiResponse.getResponseType() ⇒ <code>string</code>
Name of the class, useful to determine instance of which specialised class
	  has been returned

**Kind**: instance method of [<code>ApiResponse</code>](#module_zotero-api-client..ApiResponse)  
**Returns**: <code>string</code> - name of the class  
<a name="module_zotero-api-client..ApiResponse+getData"></a>

#### apiResponse.getData() ⇒ <code>object</code>
Content of the response. Specialised classes provide extracted data depending on context.

**Kind**: instance method of [<code>ApiResponse</code>](#module_zotero-api-client..ApiResponse)  
<a name="module_zotero-api-client..ApiResponse+getLinks"></a>

#### apiResponse.getLinks() ⇒ <code>object</code>
Links available in the response. Specialised classes provide extracted links depending on context.

**Kind**: instance method of [<code>ApiResponse</code>](#module_zotero-api-client..ApiResponse)  
<a name="module_zotero-api-client..ApiResponse+getMeta"></a>

#### apiResponse.getMeta() ⇒ <code>object</code>
Meta data available in the response. Specialised classes provide extracted meta data depending on context.

**Kind**: instance method of [<code>ApiResponse</code>](#module_zotero-api-client..ApiResponse)  
<a name="module_zotero-api-client..ApiResponse+getVersion"></a>

#### apiResponse.getVersion() ⇒ <code>number</code>
Contents of "Last-Modified-Version" header in response if present. Specialised classes provide
	  version depending on context

**Kind**: instance method of [<code>ApiResponse</code>](#module_zotero-api-client..ApiResponse)  
**Returns**: <code>number</code> - Version of the content in response  
<a name="module_zotero-api-client..SingleReadResponse"></a>

### zotero-api-client~SingleReadResponse ⇐ <code>ApiResponse</code>
Represents a response to a GET request containing a single entity

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  

* [~SingleReadResponse](#module_zotero-api-client..SingleReadResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..SingleReadResponse+getResponseType)
    * [.getData()](#module_zotero-api-client..SingleReadResponse+getData) ⇒ <code>Object</code>

<a name="module_zotero-api-client..SingleReadResponse+getResponseType"></a>

#### singleReadResponse.getResponseType()
**Kind**: instance method of [<code>SingleReadResponse</code>](#module_zotero-api-client..SingleReadResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..SingleReadResponse+getData"></a>

#### singleReadResponse.getData() ⇒ <code>Object</code>
**Kind**: instance method of [<code>SingleReadResponse</code>](#module_zotero-api-client..SingleReadResponse)  
**Returns**: <code>Object</code> - entity returned in this response  
<a name="module_zotero-api-client..MultiReadResponse"></a>

### zotero-api-client~MultiReadResponse ⇐ <code>ApiResponse</code>
represnets a response to a GET request containing multiple entities

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  

* [~MultiReadResponse](#module_zotero-api-client..MultiReadResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..MultiReadResponse+getResponseType)
    * [.getData()](#module_zotero-api-client..MultiReadResponse+getData) ⇒ <code>Array</code>
    * [.getLinks()](#module_zotero-api-client..MultiReadResponse+getLinks) ⇒ <code>Array</code>
    * [.getMeta()](#module_zotero-api-client..MultiReadResponse+getMeta) ⇒ <code>Array</code>
    * [.getTotalResults()](#module_zotero-api-client..MultiReadResponse+getTotalResults) ⇒ <code>string</code>
    * [.getRelLinks()](#module_zotero-api-client..MultiReadResponse+getRelLinks) ⇒ <code>object</code>

<a name="module_zotero-api-client..MultiReadResponse+getResponseType"></a>

#### multiReadResponse.getResponseType()
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..MultiReadResponse+getData"></a>

#### multiReadResponse.getData() ⇒ <code>Array</code>
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**Returns**: <code>Array</code> - a list of entities returned in this response  
<a name="module_zotero-api-client..MultiReadResponse+getLinks"></a>

#### multiReadResponse.getLinks() ⇒ <code>Array</code>
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**Returns**: <code>Array</code> - a list of links, indexes of the array match indexes of entities in [getData](#module_zotero-api-client..MultiReadResponse+getData)  
<a name="module_zotero-api-client..MultiReadResponse+getMeta"></a>

#### multiReadResponse.getMeta() ⇒ <code>Array</code>
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**Returns**: <code>Array</code> - a list of meta data, indexes of the array match indexes of entities in [getData](#module_zotero-api-client..MultiReadResponse+getData)  
<a name="module_zotero-api-client..MultiReadResponse+getTotalResults"></a>

#### multiReadResponse.getTotalResults() ⇒ <code>string</code>
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**Returns**: <code>string</code> - Total number of results  
<a name="module_zotero-api-client..MultiReadResponse+getRelLinks"></a>

#### multiReadResponse.getRelLinks() ⇒ <code>object</code>
**Kind**: instance method of [<code>MultiReadResponse</code>](#module_zotero-api-client..MultiReadResponse)  
**Returns**: <code>object</code> - Parsed content of "Link" header as object where value of "rel" is a key and
	  the URL is the value, contains values for "next", "last" etc.  
<a name="module_zotero-api-client..SingleWriteResponse"></a>

### zotero-api-client~SingleWriteResponse ⇐ <code>ApiResponse</code>
Represents a response to a PUT or PATCH request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  

* [~SingleWriteResponse](#module_zotero-api-client..SingleWriteResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..SingleWriteResponse+getResponseType)
    * [.getData()](#module_zotero-api-client..SingleWriteResponse+getData) ⇒ <code>Object</code>

<a name="module_zotero-api-client..SingleWriteResponse+getResponseType"></a>

#### singleWriteResponse.getResponseType()
**Kind**: instance method of [<code>SingleWriteResponse</code>](#module_zotero-api-client..SingleWriteResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..SingleWriteResponse+getData"></a>

#### singleWriteResponse.getData() ⇒ <code>Object</code>
**Kind**: instance method of [<code>SingleWriteResponse</code>](#module_zotero-api-client..SingleWriteResponse)  
**Returns**: <code>Object</code> - For put requests, this represents a complete, updated object.
                 For patch requests, this reprents only updated fields of the updated object.  
<a name="module_zotero-api-client..MultiWriteResponse"></a>

### zotero-api-client~MultiWriteResponse ⇐ <code>ApiResponse</code>
Represents a response to a POST request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  

* [~MultiWriteResponse](#module_zotero-api-client..MultiWriteResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..MultiWriteResponse+getResponseType)
    * [.isSuccess()](#module_zotero-api-client..MultiWriteResponse+isSuccess) ⇒ <code>Boolean</code>
    * [.getData()](#module_zotero-api-client..MultiWriteResponse+getData) ⇒ <code>Array</code>
    * [.getLinks()](#module_zotero-api-client..MultiWriteResponse+getLinks)
    * [.getMeta()](#module_zotero-api-client..MultiWriteResponse+getMeta)
    * [.getErrors()](#module_zotero-api-client..MultiWriteResponse+getErrors) ⇒ <code>Object</code>
    * [.getEntityByKey(key)](#module_zotero-api-client..MultiWriteResponse+getEntityByKey)
    * [.getEntityByIndex(index)](#module_zotero-api-client..MultiWriteResponse+getEntityByIndex) ⇒ <code>Object</code>

<a name="module_zotero-api-client..MultiWriteResponse+getResponseType"></a>

#### multiWriteResponse.getResponseType()
**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..MultiWriteResponse+isSuccess"></a>

#### multiWriteResponse.isSuccess() ⇒ <code>Boolean</code>
**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**Returns**: <code>Boolean</code> - Indicates whether all write operations were successful  
<a name="module_zotero-api-client..MultiWriteResponse+getData"></a>

#### multiWriteResponse.getData() ⇒ <code>Array</code>
Returns all entities POSTed in an array. Entities that have been written successfully
are returned updated, other entities are returned unchanged. It is advised to verify
if request was entirely successful (see isSuccess and getError) before using this method.

**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**Returns**: <code>Array</code> - A modified list of all entities posted.  
<a name="module_zotero-api-client..MultiWriteResponse+getLinks"></a>

#### multiWriteResponse.getLinks()
**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**See**: [getLinks](#module_zotero-api-client..ApiResponse+getLinks)  
<a name="module_zotero-api-client..MultiWriteResponse+getMeta"></a>

#### multiWriteResponse.getMeta()
**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**See**: [getMeta](#module_zotero-api-client..ApiResponse+getMeta)  
<a name="module_zotero-api-client..MultiWriteResponse+getErrors"></a>

#### multiWriteResponse.getErrors() ⇒ <code>Object</code>
Returns all errors that have occurred.

**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**Returns**: <code>Object</code> - Errors object where keys are indexes of the array of the original request and values are the erorrs occurred.  
<a name="module_zotero-api-client..MultiWriteResponse+getEntityByKey"></a>

#### multiWriteResponse.getEntityByKey(key)
Allows obtaining updated entity based on its key, otherwise identical to getEntityByIndex

**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**Throws**:

- <code>Error</code> If key is not present in the request

**See**: [module:zotero-api-client.getEntityByIndex](module:zotero-api-client.getEntityByIndex)  

| Param | Type |
| --- | --- |
| key | <code>String</code> | 

<a name="module_zotero-api-client..MultiWriteResponse+getEntityByIndex"></a>

#### multiWriteResponse.getEntityByIndex(index) ⇒ <code>Object</code>
Allows obtaining updated entity based on its index in the original request

**Kind**: instance method of [<code>MultiWriteResponse</code>](#module_zotero-api-client..MultiWriteResponse)  
**Throws**:

- <code>Error</code> If index is not present in the original request
- <code>Error</code> If error occured in the POST for selected entity. Error message will contain reason for failure.


| Param | Type |
| --- | --- |
| index | <code>Number</code> | 

<a name="module_zotero-api-client..DeleteResponse"></a>

### zotero-api-client~DeleteResponse ⇐ <code>ApiResponse</code>
Represents a response to a DELETE request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  
<a name="module_zotero-api-client..DeleteResponse+getResponseType"></a>

#### deleteResponse.getResponseType()
**Kind**: instance method of [<code>DeleteResponse</code>](#module_zotero-api-client..DeleteResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..FileUploadResponse"></a>

### zotero-api-client~FileUploadResponse ⇐ <code>ApiResponse</code>
Represents a response to a file upload request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| authResponse | <code>Object</code> | Response object for the stage 1 (upload authorisation)                                       request |
| response | <code>Object</code> | alias for "authResponse" |
| uploadResponse | <code>Object</code> | Response object for the stage 2 (file upload) request |
| registerResponse | <code>Objext</code> | Response object for the stage 3 (upload registration)                                       request |


* [~FileUploadResponse](#module_zotero-api-client..FileUploadResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..FileUploadResponse+getResponseType)
    * [.getVersion()](#module_zotero-api-client..FileUploadResponse+getVersion)

<a name="module_zotero-api-client..FileUploadResponse+getResponseType"></a>

#### fileUploadResponse.getResponseType()
**Kind**: instance method of [<code>FileUploadResponse</code>](#module_zotero-api-client..FileUploadResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..FileUploadResponse+getVersion"></a>

#### fileUploadResponse.getVersion()
**Kind**: instance method of [<code>FileUploadResponse</code>](#module_zotero-api-client..FileUploadResponse)  
**See**: [getVersion](#module_zotero-api-client..ApiResponse+getVersion)  
<a name="module_zotero-api-client..FileDownloadResponse"></a>

### zotero-api-client~FileDownloadResponse ⇐ <code>ApiResponse</code>
Represents a response to a file download request

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  
<a name="module_zotero-api-client..FileDownloadResponse+getResponseType"></a>

#### fileDownloadResponse.getResponseType()
**Kind**: instance method of [<code>FileDownloadResponse</code>](#module_zotero-api-client..FileDownloadResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..FileUrlResponse"></a>

### zotero-api-client~FileUrlResponse ⇐ <code>ApiResponse</code>
Represents a response containing temporary url for file download

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  
<a name="module_zotero-api-client..FileUrlResponse+getResponseType"></a>

#### fileUrlResponse.getResponseType()
**Kind**: instance method of [<code>FileUrlResponse</code>](#module_zotero-api-client..FileUrlResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..RawApiResponse"></a>

### zotero-api-client~RawApiResponse ⇐ <code>ApiResponse</code>
Represents a raw response, e.g. to data requests with format other than json

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  
<a name="module_zotero-api-client..RawApiResponse+getResponseType"></a>

#### rawApiResponse.getResponseType()
**Kind**: instance method of [<code>RawApiResponse</code>](#module_zotero-api-client..RawApiResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..PretendResponse"></a>

### zotero-api-client~PretendResponse ⇐ <code>ApiResponse</code>
Represents a response for pretended request, mostly for debug purposes. See [module:zotero-api-client.api~pretend](module:zotero-api-client.api~pretend)

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>ApiResponse</code>  

* [~PretendResponse](#module_zotero-api-client..PretendResponse) ⇐ <code>ApiResponse</code>
    * [.getResponseType()](#module_zotero-api-client..PretendResponse+getResponseType)
    * [.getVersion()](#module_zotero-api-client..PretendResponse+getVersion) ⇒ <code>Object</code>

<a name="module_zotero-api-client..PretendResponse+getResponseType"></a>

#### pretendResponse.getResponseType()
**Kind**: instance method of [<code>PretendResponse</code>](#module_zotero-api-client..PretendResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..PretendResponse+getVersion"></a>

#### pretendResponse.getVersion() ⇒ <code>Object</code>
**Kind**: instance method of [<code>PretendResponse</code>](#module_zotero-api-client..PretendResponse)  
**Returns**: <code>Object</code> - For pretended request version will always be null.  
<a name="module_zotero-api-client..ErrorResponse"></a>

### zotero-api-client~ErrorResponse ⇐ <code>Error</code>
Represents an error response from the api

**Kind**: inner class of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Extends**: <code>Error</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| response | <code>Object</code> | Response object for the request, with untouched body |
| message | <code>String</code> | What error occurred, ususally contains response code and status |
| reason | <code>String</code> | More detailed reason for the failure, if provided by the API |
| options | <code>String</code> | Configuration object used for this request |

<a name="module_zotero-api-client..ErrorResponse+getResponseType"></a>

#### errorResponse.getResponseType()
**Kind**: instance method of [<code>ErrorResponse</code>](#module_zotero-api-client..ErrorResponse)  
**See**: [getResponseType](#module_zotero-api-client..ApiResponse+getResponseType)  
<a name="module_zotero-api-client..api"></a>

### zotero-api-client~api() ⇒ <code>Object</code>
Wrapper function creates closure scope and calls api()

**Kind**: inner method of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Returns**: <code>Object</code> - Partially configured api functions  

* [~api()](#module_zotero-api-client..api) ⇒ <code>Object</code>
    * [~api(key, opts)](#module_zotero-api-client..api..api) ⇒ <code>Object</code>
    * [~library([typeOrKey], [id])](#module_zotero-api-client..api..library) ⇒ <code>Object</code>
    * [~items(items)](#module_zotero-api-client..api..items) ⇒ <code>Object</code>
    * [~itemTypes()](#module_zotero-api-client..api..itemTypes) ⇒ <code>Object</code>
    * [~itemFields()](#module_zotero-api-client..api..itemFields) ⇒ <code>Object</code>
    * [~creatorFields()](#module_zotero-api-client..api..creatorFields) ⇒ <code>Object</code>
    * [~schema()](#module_zotero-api-client..api..schema) ⇒ <code>Object</code>
    * [~itemTypeFields(itemType)](#module_zotero-api-client..api..itemTypeFields) ⇒ <code>Object</code>
    * [~itemTypeCreatorTypes(itemType)](#module_zotero-api-client..api..itemTypeCreatorTypes) ⇒ <code>Object</code>
    * [~template(itemType)](#module_zotero-api-client..api..template) ⇒ <code>Object</code>
    * [~collections(items)](#module_zotero-api-client..api..collections) ⇒ <code>Object</code>
    * [~subcollections()](#module_zotero-api-client..api..subcollections) ⇒ <code>Object</code>
    * [~publications()](#module_zotero-api-client..api..publications) ⇒ <code>Object</code>
    * [~tags(tags)](#module_zotero-api-client..api..tags) ⇒ <code>Object</code>
    * [~searches(searches)](#module_zotero-api-client..api..searches) ⇒ <code>Object</code>
    * [~top()](#module_zotero-api-client..api..top) ⇒ <code>Object</code>
    * [~trash()](#module_zotero-api-client..api..trash) ⇒ <code>Object</code>
    * [~children()](#module_zotero-api-client..api..children) ⇒ <code>Object</code>
    * [~settings(settings)](#module_zotero-api-client..api..settings) ⇒ <code>Object</code>
    * [~deleted()](#module_zotero-api-client..api..deleted) ⇒ <code>Object</code>
    * [~groups()](#module_zotero-api-client..api..groups) ⇒ <code>Object</code>
    * [~version(version)](#module_zotero-api-client..api..version) ⇒ <code>Object</code>
    * [~attachment(fileName, file, mtime, md5sum)](#module_zotero-api-client..api..attachment) ⇒ <code>Object</code>
    * [~registerAttachment(fileName, fileSize, mtime, md5sum)](#module_zotero-api-client..api..registerAttachment) ⇒ <code>Object</code>
    * [~attachmentUrl()](#module_zotero-api-client..api..attachmentUrl) ⇒ <code>Object</code>
    * [~verifyKeyAccess()](#module_zotero-api-client..api..verifyKeyAccess) ⇒ <code>Object</code>
    * [~get(opts)](#module_zotero-api-client..api..get) ⇒ <code>Promise</code>
    * [~post(data, opts)](#module_zotero-api-client..api..post) ⇒ <code>Promise</code>
    * [~put(data, opts)](#module_zotero-api-client..api..put) ⇒ <code>Promise</code>
    * [~patch(data, opts)](#module_zotero-api-client..api..patch) ⇒ <code>Promise</code>
    * [~del(keysToDelete, opts)](#module_zotero-api-client..api..del) ⇒ <code>Promise</code>
    * [~getConfig()](#module_zotero-api-client..api..getConfig) ⇒ <code>Object</code>
    * [~pretend(verb, data, opts)](#module_zotero-api-client..api..pretend) ⇒ <code>Promise</code>
    * [~use(extend)](#module_zotero-api-client..api..use) ⇒ <code>Object</code>

<a name="module_zotero-api-client..api..api"></a>

#### api~api(key, opts) ⇒ <code>Object</code>
Entry point of the interface. Configures authentication.
Can be used to configure any other properties of the api
Returns a set of function that are bound to that configuration
and can be called to specify further api configuration.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | Authentication key |
| opts | <code>Object</code> | Optional api configuration. For a list of all                         possible properties, see documentation for                         request() function |

<a name="module_zotero-api-client..api..library"></a>

#### api~library([typeOrKey], [id]) ⇒ <code>Object</code>
Configures which library api requests should use.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| [typeOrKey] | <code>\*</code> | Library key, e.g. g1234. Alternatively, if                          second parameter is present, library type i.e                          either 'group' or 'user' |
| [id] | <code>Number</code> | Only when first argument is a type, library id |

<a name="module_zotero-api-client..api..items"></a>

#### api~items(items) ⇒ <code>Object</code>
Configures api to use items or a specific item
Can be used in conjuction with library(), collections(), top(), trash(),
children(), tags() and any execution function (e.g. get(), post())

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| items | <code>String</code> | <code></code> | Item key, if present, configure api to point at                          this specific item |

<a name="module_zotero-api-client..api..itemTypes"></a>

#### api~itemTypes() ⇒ <code>Object</code>
Configure api to request all item types
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..itemFields"></a>

#### api~itemFields() ⇒ <code>Object</code>
Configure api to request all item fields
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..creatorFields"></a>

#### api~creatorFields() ⇒ <code>Object</code>
Configure api to request localized creator fields
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..schema"></a>

#### api~schema() ⇒ <code>Object</code>
Configure api to request schema
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..itemTypeFields"></a>

#### api~itemTypeFields(itemType) ⇒ <code>Object</code>
Configure api to request all valid fields for an item type
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| itemType | <code>String</code> | item type for which valid fields will be                             requested, e.g. 'book' or 'journalType' |

<a name="module_zotero-api-client..api..itemTypeCreatorTypes"></a>

#### api~itemTypeCreatorTypes(itemType) ⇒ <code>Object</code>
Configure api to request valid creator types for an item type
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| itemType | <code>String</code> | item type for which valid creator types                             will be requested, e.g. 'book' or                              'journalType' |

<a name="module_zotero-api-client..api..template"></a>

#### api~template(itemType) ⇒ <code>Object</code>
Configure api to request template for a new item
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| itemType | <code>String</code> | item type for which template will be                             requested, e.g. 'book' or 'journalType' |

<a name="module_zotero-api-client..api..collections"></a>

#### api~collections(items) ⇒ <code>Object</code>
Configure api to use collections or a specific collection
Can be used in conjuction with library(), items(), top(), tags() and
any of the execution function (e.g. get(), post())

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| items | <code>String</code> | Collection key, if present, configure api to                          point to this specific collection |

<a name="module_zotero-api-client..api..subcollections"></a>

#### api~subcollections() ⇒ <code>Object</code>
Configure api to use subcollections that reside underneath the specified
collection.
Should only be used in conjuction with both library() and collection()
and any of the execution function (e.g. get(), post())

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..publications"></a>

#### api~publications() ⇒ <code>Object</code>
Configure api to narrow the request to only consider items filled under
"My Publications"
Should only be used in conjuction with both library() and items()
and any of the execution function (e.g. get(), post())

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..tags"></a>

#### api~tags(tags) ⇒ <code>Object</code>
Configure api to request or delete tags or request a specific tag
Can be used in conjuction with library(), items(), collections() and
any of the following execution functions: get(), delete() but only
if the first argument is not present. Otherwise can only be used in
conjuctin with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| tags | <code>String</code> | <code></code> | name of a tag to request. If preset, configure                         api to request specific tag. |

<a name="module_zotero-api-client..api..searches"></a>

#### api~searches(searches) ⇒ <code>Object</code>
Configure api to use saved searches or a specific saved search
Can be used in conjuction with library() and any of the execution
functions

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| searches | <code>String</code> | <code></code> | Search key, if present, configure api to point at                             this specific saved search |

<a name="module_zotero-api-client..api..top"></a>

#### api~top() ⇒ <code>Object</code>
Configure api to narrow the request only to the top level items
Can be used in conjuction with items() and collections() and only
with conjuction with a get() execution function

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..trash"></a>

#### api~trash() ⇒ <code>Object</code>
Configure api to narrow the request only to the items in the trash
Can be only used in conjuction with items() and get() execution
function

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..children"></a>

#### api~children() ⇒ <code>Object</code>
Configure api to narrow the request only to the children of given
item
Can be only used in conjuction with items() and get() execution
function

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..settings"></a>

#### api~settings(settings) ⇒ <code>Object</code>
Configure api to request settings
Can only be used in conjuction with get(), put(), post() and delete()
For usage with put() and delete() settings key must be provided
For usage with post() settings key must not be included

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| settings | <code>String</code> | <code></code> | Settings key, if present, configure api to point at                             this specific key within settings, e.g. `tagColors`. |

<a name="module_zotero-api-client..api..deleted"></a>

#### api~deleted() ⇒ <code>Object</code>
Configure api to request deleted content
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..groups"></a>

#### api~groups() ⇒ <code>Object</code>
Configure api to request user-accessible groups (i.e. The set of groups 
the current API key has access to, including public groups the key owner
belongs to even if the key doesn't have explicit permissions for them.)
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..version"></a>

#### api~version(version) ⇒ <code>Object</code>
Configure api to specify local version of given entity.
When used in conjuction with get() exec function, it will populate the
If-Modified-Since-Version header.
When used in conjuction with post(), put(), patch() or delete() it will
populate the If-Unmodified-Since-Version header.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| version | <code>Number</code> | <code></code> | local version of the entity |

<a name="module_zotero-api-client..api..attachment"></a>

#### api~attachment(fileName, file, mtime, md5sum) ⇒ <code>Object</code>
Configure api to upload or download an attachment file
Can be only used in conjuction with items() and post()/get()
Use items() to select attachment item for which file is uploaded/downloaded
Will populate format on download as well as Content-Type, If-None-Match headers
in case of an upload

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fileName | <code>String</code> |  | name of the file, should match values in attachment                              item entry |
| file | <code>ArrayBuffer</code> |  | file to be uploaded |
| mtime | <code>Number</code> | <code></code> | file's mtime, if not provided current time is used |
| md5sum | <code>Number</code> | <code></code> | existing file md5sum, if matches will override existing file. Leave empty to perform new upload. |

<a name="module_zotero-api-client..api..registerAttachment"></a>

#### api~registerAttachment(fileName, fileSize, mtime, md5sum) ⇒ <code>Object</code>
Advanced, low-level function that will attempt to register existing 
file with given attachment-item based on known file metadata
Can be only used in conjuction with items() and post()
Use items() to select attachment item for which file is registered
Will populate Content-Type, If-Match headers
Will fail with a ErrorResponse if API does not return "exists"

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| fileName | <code>String</code> | name of the file, should match values in attachment                              item entry |
| fileSize | <code>Number</code> | size of the existing file |
| mtime | <code>Number</code> | mtime of the existing file |
| md5sum | <code>String</code> | md5sum of the existing file |

<a name="module_zotero-api-client..api..attachmentUrl"></a>

#### api~attachmentUrl() ⇒ <code>Object</code>
Configure api to request a temporary attachment file url
Can be only used in conjuction with items() and get()
Use items() to select attachment item for which file is url is requested
Will populate format, redirect

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..verifyKeyAccess"></a>

#### api~verifyKeyAccess() ⇒ <code>Object</code>
Configure api to request information on the API key.
Can only be used in conjuction with get()

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Chainable**  
**Returns**: <code>Object</code> - Partially configured api functions  
<a name="module_zotero-api-client..api..get"></a>

#### api~get(opts) ⇒ <code>Promise</code>
Execution function. Specifies that the request should use a GET method.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return either an 
                  ApiResponse, SingleReadResponse or MultiReadResponse.
                  Might throw Error or ErrorResponse.  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..post"></a>

#### api~post(data, opts) ⇒ <code>Promise</code>
Execution function. Specifies that the request should use a POST method.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return MultiWriteResponse.
                  Might throw Error or ErrorResponse  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | An array of entities to post |
| opts | <code>Object</code> | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..put"></a>

#### api~put(data, opts) ⇒ <code>Promise</code>
Execution function. Specifies that the request should use a PUT method.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return SingleWriteResponse.
                  Might throw Error or ErrorResponse  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | An entity to put |
| opts | <code>Object</code> | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..patch"></a>

#### api~patch(data, opts) ⇒ <code>Promise</code>
Execution function. Specifies that the request should use a PATCH
method.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return SingleWriteResponse.
                  Might throw Error or ErrorResponse  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | Partial entity data to patch |
| opts | <code>Object</code> | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..del"></a>

#### api~del(keysToDelete, opts) ⇒ <code>Promise</code>
Execution function. Specifies that the request should use a DELETE
method.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return DeleteResponse.
                  Might throw Error or ErrorResponse  

| Param | Type | Description |
| --- | --- | --- |
| keysToDelete | <code>Array</code> | An array of keys to delete. Depending on                                how api has been configured, these will                                be item keys, collection keys, search                                 keys or tag names. If not present, api                                should be configured to use specific                                 item, collection, saved search or settings                                key, in which case, that entity will be deleted |
| opts | <code>Object</code> | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..getConfig"></a>

#### api~getConfig() ⇒ <code>Object</code>
Execution function. Returns current config without doing any requests.
Usually used in advanced scenarios where config needs to be tweaked
manually before submitted to the request method or as a debugging tool.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Object</code> - current config  
<a name="module_zotero-api-client..api..pretend"></a>

#### api~pretend(verb, data, opts) ⇒ <code>Promise</code>
Execution function. Prepares the request but does not execute fetch()
instead returning a "pretended" response where details for the actual
fetch that would have been used are included.
Usually used in advanced scenarios where config needs to be tweaked
manually before submitted to the request method or as a debugging tool.

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Promise</code> - A promise that will eventually return PretendResponse.
                  Might throw Error or ErrorResponse  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| verb | <code>String</code> | <code>get</code> | Defines which execution function is used to prepare                         the request. Should be one of 'get', 'post', 'patch'                         'put', 'delete'. Defaults to 'get'. |
| data | <code>Object</code> |  | This argument is passed over to the actual execution                         function. For 'get' it is ignored, for 'post', 'patch'                         and 'put' see 'data' of that execution function, for                         'delete' see 'keysToDelete' |
| opts | <code>Object</code> |  | Optional api configuration. If duplicate,                          overrides properties already present. For a list                         of all possible properties, see documentation                         for request() function |

<a name="module_zotero-api-client..api..use"></a>

#### api~use(extend) ⇒ <code>Object</code>
Used for extending capabilities of the library by installing plugins.
In most cases plugins inject additional executors or bind api to an
alternative/extended set of functions

**Kind**: inner method of [<code>api</code>](#module_zotero-api-client..api)  
**Returns**: <code>Object</code> - Extended/partially configured api functions  

| Param | Type | Description |
| --- | --- | --- |
| extend | <code>function</code> | function that installs alternative                              or additional functionality of the api.                              It should return bound api functions,                              usually by caling arguments[0].ef() |

<a name="module_zotero-api-client..request"></a>

### zotero-api-client~request() ⇒ <code>Object</code>
Executes request and returns a response. Not meant to be called directly, instead use [api](#module_zotero-api-client..api).

**Kind**: inner method of [<code>zotero-api-client</code>](#module_zotero-api-client)  
**Returns**: <code>Object</code> - Returns a Promise that will eventually return a response object  
**Throws**:

- <code>Error</code> If options specify impossible configuration
- <code>ErrorResponse</code> If API responds with a non-ok response


| Param | Type | Description |
| --- | --- | --- |
| options.authorization | <code>String</code> | 'Authorization' header |
| options.zoteroWriteToken | <code>String</code> | 'Zotero-Write-Token' header |
| options.ifModifiedSinceVersion | <code>String</code> | 'If-Modified-Since-Version' header |
| options.ifUnmodifiedSinceVersion | <code>String</code> | 'If-Unmodified-Since-Version' header |
| options.contentType | <code>String</code> | 'Content-Type' header |
| options.collectionKey | <code>String</code> | 'collectionKey' query argument |
| options.content | <code>String</code> | 'content' query argument |
| options.direction | <code>String</code> | 'direction' query argument |
| options.format | <code>String</code> | 'format' query argument |
| options.include | <code>String</code> | 'include' query argument |
| options.includeTrashed | <code>String</code> | 'includeTrashed' query argument |
| options.itemKey | <code>String</code> | 'itemKey' query argument |
| options.itemQ | <code>String</code> | 'itemQ' query argument |
| options.itemQMode | <code>String</code> | 'itemQMode' query argument |
| options.itemTag | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 'itemTag' query argument |
| options.itemType | <code>String</code> | 'itemType' query argument |
| options.limit | <code>Number</code> | 'limit' query argument |
| options.linkMode | <code>String</code> | 'linkMode' query argument |
| options.locale | <code>String</code> | 'locale' query argument |
| options.q | <code>String</code> | 'q' query argument |
| options.qmode | <code>String</code> | 'qmode' query argument |
| options.searchKey | <code>String</code> | 'searchKey' query argument |
| options.since | <code>Number</code> | 'since' query argument |
| options.sort | <code>String</code> | 'sort' query argument |
| options.start | <code>Number</code> | 'start' query argument |
| options.style | <code>String</code> | 'style' query argument |
| options.tag | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 'tag' query argument |
| options.pretend | <code>Boolean</code> | triggers pretend mode where fetch request                                        					  is prepared and returned without execution |
| options.resource.top | <code>String</code> | use 'top' resource |
| options.resource.trash | <code>String</code> | use 'trash' resource |
| options.resource.children | <code>String</code> | use 'children' resource |
| options.resource.groups | <code>String</code> | use 'groups' resource |
| options.resource.itemTypes | <code>String</code> | use 'itemTypes' resource |
| options.resource.itemFields | <code>String</code> | use 'itemFields' resource |
| options.resource.creatorFields | <code>String</code> | use 'creatorFields' resource |
| options.resource.itemTypeFields | <code>String</code> | use 'itemTypeFields' resource |
| options.resource.itemTypeCreatorTypes | <code>String</code> | use 'itemTypeCreatorTypes' resource |
| options.resource.library | <code>String</code> | use 'library' resource |
| options.resource.collections | <code>String</code> | use 'collections' resource |
| options.resource.items | <code>String</code> | use 'items' resource |
| options.resource.searches | <code>String</code> | use 'searches' resource |
| options.resource.tags | <code>String</code> | use 'tags' resource |
| options.resource.template | <code>String</code> | use 'template' resource |
| options.method | <code>String</code> | forwarded to fetch() |
| options.body | <code>String</code> | forwarded to fetch() |
| options.mode | <code>String</code> | forwarded to fetch() |
| options.cache | <code>String</code> | forwarded to fetch() |
| options.credentials | <code>String</code> | forwarded to fetch() |
| options.uploadRegisterOnly | <code>Boolean</code> | this file upload should only perform stage 1                                           				  error if file with provided meta does not exist |
| options.retry | <code>Number</code> | retry this many times after transient error. |
| options.retryDelay | <code>Number</code> | wait this many seconds before retry. If not set                                         					  an exponential backoff algorithm will be used |

