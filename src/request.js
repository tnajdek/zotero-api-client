'use strict';

require('isomorphic-fetch');

const {
	ApiResponse,
	SingleReadResponse,
	MultiReadResponse,
	SingleWriteResponse,
	MultiWriteResponse,
	DeleteResponse
} = require('./response');

const headerNames = {
	authorization: 'Authorization',
	zoteroWriteToken: 'Zotero-Write-Token',
	ifModifiedSinceVersion: 'If-Modified-Since-Version',
	ifUnmodifiedSinceVersion: 'If-Unmodified-Since-Version',
	contentType: 'Content-Type'
};

const core = [
	'resource',
	'apiAuthorityPart'
];

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

const nonKeyResource = [
	'top',
	'trash',
	'children',
	'groups',
	'itemTypes',
	'itemFields',
	'creatorFields',
	'itemTypeFields',
	'itemTypeCreatorTypes'
];

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
}

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

	for(let i of nonKeyResource) {
		if(i in resource) {
			path.push(i);
		}
	}

	return path.join('/');
}

const makeUrlQuery = options => {
	let params = [];
	for(let name of queryParamNames) {
		if(options[name]) {
			params.push(`${name}=${options[name]}`);
		}
	}
	return params.length ? '?' + params.join('&') : '';
}

module.exports = async options => {
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
		fetchConfig[param] = options[param];
	}

	fetchConfig.headers = headers;

	let response = await fetch(url, fetchConfig);

	if(options.format != 'json') {
		return response;
	}

	let content = await response.json();

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
}
