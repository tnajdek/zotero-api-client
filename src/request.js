import SparkMD5 from 'spark-md5';

import { ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse, FileUploadResponse,
	FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse, RawApiResponse,
	SingleReadResponse, SingleWriteResponse, } from './response.js';

const headerNames = {
	authorization: 'Authorization',
	contentType: 'Content-Type',
	ifMatch: 'If-Match',
	ifModifiedSinceVersion: 'If-Modified-Since-Version',
	ifNoneMatch: 'If-None-Match',
	ifUnmodifiedSinceVersion: 'If-Unmodified-Since-Version',
	zoteroApiKey: 'Zotero-API-Key',
	zoteroWriteToken: 'Zotero-Write-Token',
};

const queryParamsWithArraySupport = [ "tag", "itemTag" ];

const queryParamNames = [
	'collectionKey',
	'content',
	'direction',
	'format',
	'include',
	'includeTrashed',
	'itemKey',
	'itemQ',
	'itemQMode',
	'itemTag',
	'itemType',
	'limit',
	'linkMode',
	'locale',
	'q',
	'qmode',
	'searchKey',
	'since',
	'sort',
	'start',
	'style',
	'tag',
];

const fetchParamNames = [
	'body',
	'cache',
	'credentials',
	'method',
	'mode',
	'redirect',
	'signal',
];

const resourcesSpecs = [
	//name in resource, name in the url (usually the same but there are exceptions)
	{ 'name': 'library', urlPart: 'library', isKeyResource: true },
	{ 'name': 'collections', urlPart: 'collections', isKeyResource: true },
	{ 'name': 'publications', urlPart: 'publications', isKeyResource: false },
	{ 'name': 'items', urlPart: 'items', isKeyResource: true },
	{ 'name': 'searches', urlPart: 'searches', isKeyResource: true },
	{ 'name': 'top', urlPart: 'top', isKeyResource: false },
	{ 'name': 'trash', urlPart: 'trash', isKeyResource: false },
	{ 'name': 'tags', urlPart: 'tags', isKeyResource: true },
	{ 'name': 'children', urlPart: 'children', isKeyResource: false },
	{ 'name': 'groups', urlPart: 'groups', isKeyResource: false },
	{ 'name': 'subcollections', urlPart: 'collections', isKeyResource: false },
	{ 'name': 'itemTypes', urlPart: 'itemTypes', isKeyResource: false },
	{ 'name': 'itemFields', urlPart: 'itemFields', isKeyResource: false },
	{ 'name': 'creatorFields', urlPart: 'creatorFields', isKeyResource: false },
	{ 'name': 'itemTypeFields', urlPart: 'itemTypeFields', isKeyResource: false },
	{ 'name': 'itemTypeCreatorTypes', urlPart: 'itemTypeCreatorTypes', isKeyResource: false },
	{ 'name': 'template', urlPart: 'items/new', isKeyResource: false },
	{ 'name': 'file', urlPart: 'file', isKeyResource: false },
	{ 'name': 'fileUrl', urlPart: 'file/view/url', isKeyResource: false },
	{ 'name': 'settings', urlPart: 'settings', isKeyResource: false },
	{ 'name': 'deleted', 'urlPart': 'deleted', isKeyResource: false },
];

const defaults = {
	apiAuthorityPart: 'api.zotero.org',
	cache: 'default',
	contentType: 'application/json',
	credentials: 'omit',
	format: 'json',
	method: 'get',
	mode: 'cors',
	pretend: false,
	redirect: 'follow',
	resource: {},
	retry: 0,
	retryDelay: null,
	uploadRegisterOnly: null,
};

//@TODO implement validation
const validateUrlPath = urlPath => { //eslint-disable-line no-unused-vars
	return true;
};

const makeUrlPath = resource => {
	let path = [];

	for(let resourcesSpec of resourcesSpecs) {
		let resourceValue = resource[resourcesSpec.name];
		if(resourcesSpec.name in resource) {
			if(resourcesSpec.name === 'library') {
				if(resourceValue.charAt(0) === 'u') {
					path.push('users', resourceValue.slice(1));
				} else if(resourceValue.charAt(0) === 'g') {
					path.push('groups', resourceValue.slice(1));
				}
			} else {
				path.push(resourcesSpec.urlPart);
				if(resourcesSpec.isKeyResource && resource[resourcesSpec.name]) {
					path.push(resourceValue);
				}
			}
		}	
	}
	return path.join('/');
};

const makeUrlQuery = options => {
	let params = [];
	for(let name of queryParamNames) {
		if(options[name]) {
			if(queryParamsWithArraySupport.includes(name) && Array.isArray(options[name])) {
				params.push(...options[name].map(k => `${name}=${encodeURIComponent(k)}`));
			} else {
				params.push(`${name}=${encodeURIComponent(options[name])}`);
			}
		}
	}
	return params.length ? '?' + params.join('&') : '';
};

const hasDefinedKey = (object, key) => {
	return key in object && object[key] !== null && typeof(object[key]) !== 'undefined';
}

const throwErrorResponse = async (rawResponse, options, requestDesc) => {
	let clonedRawResponse = rawResponse.clone();
	let reason = null;
	try {
		reason = await clonedRawResponse.text();
	} catch(_) {
		// unable to parse error from response but should still throw
	}
	throw new ErrorResponse(`${requestDesc}${rawResponse.status}: ${rawResponse.statusText}`, reason, rawResponse, options);
}

const isTransientFailure = response => response.status == 408 || response.status >= 500;
const sleep = seconds => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, seconds * 1000);
	});
};

/**
 * Executes request and returns a response
 * @param {String} options.authorization					- 'Authorization' header
 * @param {String} options.zoteroWriteToken					- 'Zotero-Write-Token' header 
 * @param {String} options.ifModifiedSinceVersion			- 'If-Modified-Since-Version' header
 * @param {String} options.ifUnmodifiedSinceVersion			- 'If-Unmodified-Since-Version' header
 * @param {String} options.contentType						- 'Content-Type' header
 * @param {String} options.collectionKey					- 'collectionKey' query argument
 * @param {String} options.content							- 'content' query argument
 * @param {String} options.direction						- 'direction' query argument
 * @param {String} options.format							- 'format' query argument
 * @param {String} options.include							- 'include' query argument
 * @param {String} options.includeTrashed					- 'includeTrashed' query argument
 * @param {String} options.itemKey							- 'itemKey' query argument
 * @param {String} options.itemQ							- 'itemQ' query argument
 * @param {String} options.itemQMode						- 'itemQMode' query argument
 * @param {String|String[]} options.itemTag					- 'itemTag' query argument
 * @param {String} options.itemType							- 'itemType' query argument
 * @param {Number} options.limit							- 'limit' query argument
 * @param {String} options.linkMode							- 'linkMode' query argument
 * @param {String} options.locale							- 'locale' query argument
 * @param {String} options.q								- 'q' query argument
 * @param {String} options.qmode							- 'qmode' query argument
 * @param {String} options.searchKey						- 'searchKey' query argument
 * @param {Number} options.since							- 'since' query argument
 * @param {String} options.sort								- 'sort' query argument
 * @param {Number} options.start							- 'start' query argument
 * @param {String} options.style							- 'style' query argument
 * @param {String|String[]} options.tag						- 'tag' query argument
 * @param {Boolean} options.pretend							- triggers pretend mode where fetch request
 *                                        					  is prepared and returned without execution
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
 * @param {Boolean} options.uploadRegisterOnly				- this file upload should only perform stage 1
 *                                           				  error if file with provided meta does not exist
 * @param {Number} options.retry							- retry this many times after transient error.
 * @param {Number} options.retryDelay						- wait this many seconds before retry. If not set
 *                                         					  an exponential backoff algorithm will be used
 * 
 * @return {Object} Returns a Promise that will eventually return a response object
 * @throws {Error} If options specify impossible configuration
 * @throws {ErrorResponse} If API responds with a non-ok response
 */
const request = async config => {
	var response;

	if('response' in config && config.response) {
		return config;
	}

	const options = {...defaults, ...config};
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
		if(param === 'body' && hasDefinedKey(options, param)) {
			fetchConfig[param] = JSON.stringify(options[param]);
		} else {
			fetchConfig[param] = options[param];	
		}
	}

	// build pre-upload (authorisation) request body based on the file provided
	if(hasDefinedKey(options, 'body') && hasDefinedKey(options, 'file')) {
		throw new Error('Cannot use both "file" and "body" in a single request.');
	}

	// process the request for file upload authorisation request
	if(hasDefinedKey(options, 'file') && hasDefinedKey(options, 'fileName')) {
		let fileName = options.fileName;
		let md5sum = SparkMD5.ArrayBuffer.hash(options.file);
		let filesize = options.file.byteLength;
		let mtime = options.mtime || Date.now();
		fetchConfig['body'] = `md5=${md5sum}&filename=${fileName}&filesize=${filesize}&mtime=${mtime}`;
	}

	if(options.uploadRegisterOnly === true) {
		const { fileName, fileSize, md5sum, mtime } = options;
		fetchConfig['body'] = `md5=${md5sum}&filename=${fileName}&filesize=${fileSize}&mtime=${mtime}`;	
	}

	// checking against access-control-allow-methods seems to be case sensitive
	fetchConfig.method = fetchConfig.method.toUpperCase();
	fetchConfig.headers = headers;

	options.retryCount = 0;
	if(options.pretend) {
		const response = new PretendResponse({ url, fetchConfig }, options);
		return { response, ...config, source: 'request' };
	}
	let rawResponse = await fetch(url, fetchConfig);

	if(isTransientFailure(rawResponse) && options.retry > 0) {
		let retriesCounter = options.retry;
		let nextRetryDelay = typeof(options.retryDelay) === 'number' ? options.retryDelay : 1;
		while(retriesCounter > 0) {
			await sleep(nextRetryDelay);
			options.retryCount++;
			rawResponse = await fetch(url, fetchConfig);
			if(!isTransientFailure(rawResponse)) {
				break;
			}
			if(typeof(options.retryDelay) !== 'number') {
				nextRetryDelay *= 2;
			}
			retriesCounter--;
		}
	}

	if((hasDefinedKey(options, 'file') && hasDefinedKey(options, 'fileName')) || options.uploadRegisterOnly === true) {
		if(rawResponse.ok) {
			let authData = await rawResponse.json();
			if('exists' in authData && authData.exists) {
				response = new FileUploadResponse(authData, options, rawResponse);
			} else {
				if(options.uploadRegisterOnly === true) {
					throw new ErrorResponse(
						'API did not recognize provided file meta.',
						'Attempted to register existing file, but API did not recognize provided file meta.',
						rawResponse, options
					);
				}
				let prefix = new Uint8ClampedArray(authData.prefix.split('').map(e => e.charCodeAt(0)));
				let suffix = new Uint8ClampedArray(authData.suffix.split('').map(e => e.charCodeAt(0)));
				let body = new Uint8ClampedArray(prefix.byteLength + options.file.byteLength + suffix.byteLength);
				body.set(prefix, 0);
				body.set(new Uint8ClampedArray(options.file), prefix.byteLength);
				body.set(suffix, prefix.byteLength + options.file.byteLength);
				
				// follow-up request
				let uploadResponse = await fetch(authData.url, {
					headers: {
						[headerNames['contentType']]: authData.contentType,
					},
					method: 'post',
					body: body.buffer
				});

				if(uploadResponse.status === 201) {
					let registerResponse = await fetch(url, {
						...fetchConfig,
						body: `upload=${authData.uploadKey}`
					});
					if(!registerResponse.ok) {
						await throwErrorResponse(registerResponse, options, 'Upload stage 3: ');	
					}
					response = new FileUploadResponse({}, options, rawResponse, uploadResponse, registerResponse);
				} else {
					await throwErrorResponse(uploadResponse, options, 'Upload stage 2: ');
				}
			}
		} else {
			await throwErrorResponse(rawResponse, options, 'Upload stage 1: ');
		}
	} else {
		if(rawResponse.status < 200 || rawResponse.status >= 400) {
			await throwErrorResponse(rawResponse, options, '');
		}

		let content;

		if(options.format === 'json') {
			try {
				content = await rawResponse.json();
			} catch(_) {
				content = null;
			}
			switch(options.method.toUpperCase()) {
				case 'GET':
				default:
					if('library' in options.resource) {
						if(content && Array.isArray(content)) {
							response = new MultiReadResponse(content, options, rawResponse);
						} else {
							response = new SingleReadResponse(content, options, rawResponse);
						}
					} else {
						response = new ApiResponse(content, options, rawResponse);
					}
				break;
				case 'POST':
				case 'PUT':
				case 'PATCH':
					if(content && typeof content === 'object' && 'success' in content) {
						response = new MultiWriteResponse(content, options, rawResponse);
					} else {
						response = new SingleWriteResponse(content, options, rawResponse);
					}
				break
				case 'DELETE':
					response = new DeleteResponse(content, options, rawResponse);
				break
			}
		} else {
			if('file' in options.resource && options.method.toUpperCase() === 'GET') {
				let rawData = await rawResponse.arrayBuffer();
				response = new FileDownloadResponse(rawData, options, rawResponse);
			} else if('fileUrl' in options.resource && options.method.toUpperCase() === 'GET') {
				let url = await rawResponse.text();
				response = new FileUrlResponse(url, options, rawResponse);
			} else {
				response = new RawApiResponse(rawResponse, options);
			}
		}
	}

	return {
		...config,
		source: 'request',
		response
	};
};

export default request;
