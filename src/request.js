'use strict';

/**
 * Module contains a request() function, a low-level Zotero API client
 * @module request
 */

require('isomorphic-fetch');

const {
	ApiResponse,
	SingleReadResponse,
	MultiReadResponse,
	SingleWriteResponse,
	MultiWriteResponse,
	DeleteResponse,
	ErrorResponse
} = require('./response');

const headerNames = {
	authorization: 'Authorization',
	zoteroWriteToken: 'Zotero-Write-Token',
	ifModifiedSinceVersion: 'If-Modified-Since-Version',
	ifUnmodifiedSinceVersion: 'If-Unmodified-Since-Version',
	contentType: 'Content-Type'
};

const queryParamNames = [
	'format',
	'include',
	'content',
	'style',
	'itemKey',
	'collectionKey',
	'searchKey',
	'itemType',
	'qmode',
	'since',
	'tag',
	'sort',
	'direction',
	'limit',
	'start'
];

const fetchParamNames = [
	'method',
	'body',
	'mode',
	'cache',
	'credentials'
];

const nonKeyResource = {
	//name in resource: name in the url (usually the same but there are exceptions)
	'top': 'top',
	'trash': 'trash',
	'children': 'children',
	'groups': 'groups',
	'subcollections': 'collections',
	'itemTypes': 'itemTypes',
	'itemFields': 'itemFields',
	'creatorFields': 'creatorFields',
	'itemTypeFields': 'itemTypeFields',
	'itemTypeCreatorTypes': 'itemTypeCreatorTypes'
};

const dataResource = [
	'collections',
	'items',
	'searches'
];

const keyResource = [
	'library', 'collections', 'items', 'searches', 'tags', 'template'
];

const defaults = {
	apiAuthorityPart: 'api.zotero.org',
	contentType: 'application/json',
	format: 'json',
	method: 'get',
	resource: {},
	mode: 'cors',
	cache: 'default',
	body: null,
	credentials: 'omit'
};

//@TODO implement validation
const validateUrlPath = urlPath => {
	return true;
};

const makeUrlPath = resource => {
	let path = [];

	for(let i of keyResource) {
		if(i in resource) {
			if(i === 'library') {
				if(resource[i].charAt(0) === 'u') {
					path.push('users', resource[i].slice(1));
				} else if(resource[i].charAt(0) === 'g') {
					path.push('groups', resource[i].slice(1));
				}
			} else {
				path.push(i);
				if(resource[i]) {
					path.push(resource[i]);
				}
			}
		}	
	}

	for(let i in nonKeyResource) {
		if(i in resource) {
			path.push(nonKeyResource[i]);
		}
	}

	return path.join('/');
};

const makeUrlQuery = options => {
	let params = [];
	for(let name of queryParamNames) {
		if(options[name]) {
			params.push(`${name}=${options[name]}`);
		}
	}
	return params.length ? '?' + params.join('&') : '';
};

/**
 * Executes request and returns a response
 * @param {String} options.authorization					- 'Authorization' header
 * @param {String} options.zoteroWriteToken					- 'Zotero-Write-Token' header 
 * @param {String} options.ifModifiedSinceVersion			- 'If-Modified-Since-Version' header
 * @param {String} options.ifUnmodifiedSinceVersion			- 'If-Unmodified-Since-Version' header
 * @param {String} options.contentType						- 'Content-Type' header
 * @param {String} options.format 							- 'format' query argument
 * @param {String} options.include 							- 'include' query argument
 * @param {String} options.content 							- 'content' query argument
 * @param {String} options.style 							- 'style' query argument
 * @param {String} options.itemKey 							- 'itemKey' query argument
 * @param {String} options.collectionKey 					- 'collectionKey' query argument
 * @param {String} options.searchKey 						- 'searchKey' query argument
 * @param {String} options.itemType 						- 'itemType' query argument
 * @param {String} options.qmode 							- 'qmode' query argument
 * @param {Number} options.since 							- 'since' query argument
 * @param {String} options.tag 								- 'tag' query argument
 * @param {String} options.sort 							- 'sort' query argument
 * @param {String} options.direction 						- 'direction' query argument
 * @param {Number} options.limit 							- 'limit' query argument
 * @param {Number} options.start 							- 'start' query argument 
 * @param {String} options.resource.top					    - use 'top' resource  
 * @param {String} options.resource.trash					- use 'trash' resource  
 * @param {String} options.resource.children				- use 'children' resource  	
 * @param {String} options.resource.groups					- use 'groups' resource  
 * @param {String} options.resource.itemTypes				- use 'itemTypes' resource  	
 * @param {String} options.resource.itemFields				- use 'itemFields' resource  	
 * @param {String} options.resource.creatorFields			- use 'creatorFields' resource  		
 * @param {String} options.resource.itemTypeFields			- use 'itemTypeFields' resource  		
 * @param {String} options.resource.itemTypeCreatorTypes	- use 'itemTypeCreatorTypes' resource  				
 * @param {String} options.resource.library					- use 'library' resource  
 * @param {String} options.resource.collections				- use 'collections' resource  	
 * @param {String} options.resource.items					- use 'items' resource  
 * @param {String} options.resource.searches				- use 'searches' resource  	
 * @param {String} options.resource.tags					- use 'tags' resource  
 * @param {String} options.resource.template				- use 'template' resource  	
 * @param {String} options.method 							- forwarded to fetch()
 * @param {String} options.body 							- forwarded to fetch()
 * @param {String} options.mode 							- forwarded to fetch()
 * @param {String} options.cache 							- forwarded to fetch()
 * @param {String} options.credentials 						- forwarded to fetch()
 * 
 * @return {Object} Returns a Promise that will eventually return a response object
 * @throws {Error} If options specify impossible configuration
 * @throws {ErrorResponse} If API responds with a non-ok response
 */
const request = async options => {
	options = {...defaults, ...options};
	const headers = {};

	for(let header of Object.keys(headerNames)) {
		if(header in options) {
			headers[headerNames[header]] = options[header];
		}
	}

	const path = makeUrlPath(options.resource);
	const query = makeUrlQuery(options);
	const url = `https://${options.apiAuthorityPart}/${path}${query}`;
	const fetchConfig = {};

	if(!validateUrlPath(path)) {
		throw new Error('Invalid resource');
	}
	
	for(let param of fetchParamNames) {
		if(param === 'body') {
			fetchConfig[param] = JSON.stringify(options[param]);
		} else {
			fetchConfig[param] = options[param];	
		}
	}

	fetchConfig.headers = headers;

	let response = await fetch(url, fetchConfig);
	let content;

	if(options.format != 'json') {
		return response;
	}

	if(response.status < 200 || response.status >= 400) {
		let clonedResponse = response.clone();
		let reason = null;
		try {
			reason = await clonedResponse.text();
		} finally {
			throw new ErrorResponse(`${response.status}: ${response.statusText}`, reason, response, options);
		}
	}

	try {
		content = await response.json();
	} catch(e) {
		return new ApiResponse(null, options, response);
	}

	switch(options.method.toUpperCase()) {
		case 'GET':
		default:
			if(dataResource.some(dataResource => dataResource in options.resource)) {
				if(Array.isArray(content)) {
					return new MultiReadResponse(content, options, response);
				} else {
					return new SingleReadResponse(content, options, response);
				}
			} else {
				return new ApiResponse(content, options, response);
			}
		case 'POST':
		case 'PUT':
		case 'PATCH':
			if('success' in content) {
				return new MultiWriteResponse(content, options, response);
			} else {
				return new SingleWriteResponse(content, options, response);
			}
		case 'DELETE':
			return new DeleteResponse(content, options, response);
	}
};

module.exports = request;
