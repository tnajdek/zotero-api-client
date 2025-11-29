import SparkMD5 from 'spark-md5';


import {
	ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse, FileUploadResponse,
	FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse, RawApiResponse,
	SchemaResponse, SingleReadResponse, SingleWriteResponse,
} from './response.js';

const acceptedHeaderNames = {
	authorization: 'Authorization',
	contentType: 'Content-Type',
	ifMatch: 'If-Match',
	ifModifiedSinceVersion: 'If-Modified-Since-Version',
	ifNoneMatch: 'If-None-Match',
	ifUnmodifiedSinceVersion: 'If-Unmodified-Since-Version',
	zoteroApiKey: 'Zotero-API-Key',
	zoteroWriteToken: 'Zotero-Write-Token',
	zoteroSchemaVersion: 'Zotero-Schema-Version',
};

const queryParamsWithArraySupport = ["tag", "itemTag"];

const queryParamNames = [
	'annotationType',
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
	'linkwrap',
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

const filePatchQueryParamNames = [
	'algorithm',
	'upload',
];

const fetchParamNames = [
	'body',
	'cache',
	'credentials',
	'integrity',
	'keepalive',
	'method',
	'mode',
	'priority',
	'redirect',
	'referrer',
	'referrerPolicy',
	'signal',
];

const resourcesSpecs = [
	//name in resource, name in the url (usually the same, but there are exceptions)
	{'name': 'library', urlPart: 'library', isKeyResource: true},
	{'name': 'collections', urlPart: 'collections', isKeyResource: true},
	{'name': 'publications', urlPart: 'publications', isKeyResource: false},
	{'name': 'items', urlPart: 'items', isKeyResource: true},
	{'name': 'searches', urlPart: 'searches', isKeyResource: true},
	{'name': 'top', urlPart: 'top', isKeyResource: false},
	{'name': 'trash', urlPart: 'trash', isKeyResource: false},
	{'name': 'tags', urlPart: 'tags', isKeyResource: true},
	{'name': 'children', urlPart: 'children', isKeyResource: false},
	{'name': 'groups', urlPart: 'groups', isKeyResource: false},
	{'name': 'subcollections', urlPart: 'collections', isKeyResource: false},
	{'name': 'itemTypes', urlPart: 'itemTypes', isKeyResource: false},
	{'name': 'itemFields', urlPart: 'itemFields', isKeyResource: false},
	{'name': 'schema', urlPart: 'schema', isKeyResource: false},
	{'name': 'creatorFields', urlPart: 'creatorFields', isKeyResource: false},
	{'name': 'itemTypeFields', urlPart: 'itemTypeFields', isKeyResource: false},
	{'name': 'itemTypeCreatorTypes', urlPart: 'itemTypeCreatorTypes', isKeyResource: false},
	{'name': 'template', urlPart: 'items/new', isKeyResource: false},
	{'name': 'file', urlPart: 'file', isKeyResource: false},
	{'name': 'fileUrl', urlPart: 'file/view/url', isKeyResource: false},
	{'name': 'settings', urlPart: 'settings', isKeyResource: true},
	{'name': 'deleted', 'urlPart': 'deleted', isKeyResource: false},
	{'name': 'verifyKeyAccess', urlPart: 'keys/current', isKeyResource: false},
];

const defaults = {
	apiAuthorityPart: 'api.zotero.org',
	apiPath: '',
	apiScheme: 'https',
	cache: 'default',
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

const makeUrlPath = resource => {
	let path = [];

	for (let resourcesSpec of resourcesSpecs) {
		let resourceValue = resource[resourcesSpec.name];
		if (resourcesSpec.name in resource) {
			if (resourcesSpec.name === 'library') {
				if (resourceValue.charAt(0) === 'u') {
					path.push('users', resourceValue.slice(1));
				} else if (resourceValue.charAt(0) === 'g') {
					path.push('groups', resourceValue.slice(1));
				}
			} else {
				path.push(resourcesSpec.urlPart);
				if (resourcesSpec.isKeyResource && resource[resourcesSpec.name]) {
					path.push(resourceValue);
				}
			}
		}
	}
	return path.join('/');
};

const makeUrlQuery = (options, paramNames) => {
	let params = [];
	for (let name of paramNames) {
		if (options[name]) {
			if (queryParamsWithArraySupport.includes(name) && Array.isArray(options[name])) {
				params.push(...options[name].map(k => `${name}=${encodeURIComponent(k)}`));
			} else {
				params.push(`${name}=${encodeURIComponent(options[name])}`);
			}
		}
	}
	return params.length ? '?' + params.join('&') : '';
};

const makeHeaders = (options, headerNames) => {
	let headers = {};
	for (let header of Object.keys(headerNames)) {
		if (header in options) {
			headers[headerNames[header]] = options[header];
		}
	}
	return headers;
}

const hasDefinedKey = (object, key) => {
	return key in object && object[key] !== null && typeof (object[key]) !== 'undefined';
}

const throwErrorResponse = async (rawResponse, options, requestDesc) => {
	let clonedRawResponse = rawResponse.clone();
	let reason = await clonedRawResponse.text();
	throw new ErrorResponse(`${requestDesc}${rawResponse.status}: ${rawResponse.statusText}`, reason, rawResponse, options);
}

const isTransientFailure = response => response.status === 408 || response.status >= 500;
const sleep = seconds => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, seconds * 1000);
	});
};

/**
 * Executes request and returns a response. Not meant to be called directly, instead use {@link
   module:zotero-api-client~api}.
 * @param {Object} config - Configuration object
 * @param {String} config.apiScheme - Scheme part of the API URL
 * @param {String} config.apiAuthorityPart - Authority part of the API URL
 * @param {String} config.apiPath - Path part of the API URL
 * @param {String} config.authorization - 'Authorization' header
 * @param {String} config.zoteroWriteToken - 'Zotero-Write-Token' header
 * @param {String} config.ifModifiedSinceVersion - 'If-Modified-Since-Version' header
 * @param {String} config.ifUnmodifiedSinceVersion - 'If-Unmodified-Since-Version' header
 * @param {String} config.contentType - 'Content-Type' header
 * @param {String} config.collectionKey - 'collectionKey' query argument
 * @param {String} config.content - 'content' query argument
 * @param {String} config.direction - 'direction' query argument
 * @param {String} config.format - 'format' query argument
 * @param {String} config.include - 'include' query argument
 * @param {String} config.includeTrashed - 'includeTrashed' query argument
 * @param {String} config.itemKey - 'itemKey' query argument
 * @param {String} config.itemQ - 'itemQ' query argument
 * @param {String} config.itemQMode - 'itemQMode' query argument
 * @param {String|String[]} config.itemTag - 'itemTag' query argument
 * @param {String} config.itemType - 'itemType' query argument
 * @param {Number} config.limit - 'limit' query argument
 * @param {String} config.linkMode - 'linkMode' query argument
 * @param {String} config.linkwrap - 'linkwrap' query argument
 * @param {String} config.locale - 'locale' query argument
 * @param {String} config.q - 'q' query argument
 * @param {String} config.qmode - 'qmode' query argument
 * @param {String} config.searchKey - 'searchKey' query argument
 * @param {Number} config.since - 'since' query argument
 * @param {String} config.sort - 'sort' query argument
 * @param {Number} config.start - 'start' query argument
 * @param {String} config.style - 'style' query argument
 * @param {String|String[]} config.tag - 'tag' query argument
 * @param {Boolean} config.pretend - triggers pretend mode where fetch request is prepared and returned without execution
 * @param {String} config.resource.top - use 'top' resource
 * @param {String} config.resource.trash - use 'trash' resource
 * @param {String} config.resource.children - use 'children' resource
 * @param {String} config.resource.groups - use 'groups' resource
 * @param {String} config.resource.itemTypes - use 'itemTypes' resource
 * @param {String} config.resource.itemFields - use 'itemFields' resource
 * @param {String} config.resource.creatorFields - use 'creatorFields' resource
 * @param {String} config.resource.itemTypeFields - use 'itemTypeFields' resource
 * @param {String} config.resource.itemTypeCreatorTypes - use 'itemTypeCreatorTypes' resource
 * @param {String} config.resource.library - use 'library' resource
 * @param {String} config.resource.collections - use 'collections' resource
 * @param {String} config.resource.items - use 'items' resource
 * @param {String} config.resource.searches - use 'searches' resource
 * @param {String} config.resource.tags - use 'tags' resource
 * @param {String} config.resource.template - use 'template' resource
 * @param {String} config.method - forwarded to fetch()
 * @param {String} config.body - forwarded to fetch()
 * @param {String} config.mode - forwarded to fetch()
 * @param {String} config.cache - forwarded to fetch()
 * @param {String} config.credentials - forwarded to fetch()
 * @param {Boolean} config.uploadRegisterOnly - this file upload should only perform stage 1
 * @param {Number} config.retry - retry this many times after transient error
 * @param {Number} config.retryDelay - wait this many seconds before retry. If not set an exponential backoff algorithm will be used
 *
 * @return {Object} Returns a Promise that will eventually return a response object
 * @throws {Error} If options specify impossible configuration
 * @throws {ErrorResponse} If API responds with a non-ok response
 * @memberof module:zotero-api-client
 * @inner
 */
const request = async config => {
	let response;

	if ('response' in config && config.response) {
		return config;
	}

	const options = {...defaults, ...config};

	if (hasDefinedKey(options, 'body') && (hasDefinedKey(options, 'file') || hasDefinedKey(options, 'oldFile'))) {
		throw new Error('Cannot use both "file" and "body" in a single request.');
	}

	if (['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase()) && !('contentType' in config)) {
		options.contentType = 'application/json';
	}

	if (hasDefinedKey(options, 'filePatch')) {
		// for partial file upload api uses patch(), however first request (file authorisation still uses POST
		options.method = 'POST';
	}

	const headers = makeHeaders(options, acceptedHeaderNames);
	const path = makeUrlPath(options.resource);
	const query = makeUrlQuery(options, queryParamNames);
	const url = `${options.apiScheme}://${options.apiAuthorityPart}/${options.apiPath}${path}${query}`;
	const fetchConfig = {};

	for (let param of fetchParamNames) {
		if (param === 'body' && hasDefinedKey(options, param)) {
			fetchConfig[param] = JSON.stringify(options[param]);
		} else {
			fetchConfig[param] = options[param];
		}
	}

	let fileUploadData = {};
	// process the request for file upload authorisation request
	if ((hasDefinedKey(options, 'filePatch') || hasDefinedKey(options, 'file')) && hasDefinedKey(options, 'fileName')) {
		let fileName = options.fileName;
		let md5sum = SparkMD5.ArrayBuffer.hash(options.file);
		let mtime = Date.now();
		let fileSize = options.file.byteLength;
		fileUploadData = {fileName, md5sum, mtime, fileSize};
		fetchConfig['body'] = `md5=${md5sum}&filename=${fileName}&filesize=${fileSize}&mtime=${mtime}`;
	}

	if (options.uploadRegisterOnly === true) {
		const {fileName, fileSize, md5sum, mtime} = options;
		fileUploadData = {fileName, md5sum, mtime, fileSize};
		fetchConfig['body'] = `md5=${md5sum}&filename=${fileName}&filesize=${fileSize}&mtime=${mtime}`;
	}

	// checking against access-control-allow-methods seems to be case-sensitive
	fetchConfig.method = fetchConfig.method.toUpperCase();
	fetchConfig.headers = headers;

	options.retryCount = 0;
	if (options.pretend) {
		const response = new PretendResponse({url, fetchConfig}, options, null);
		return {response, ...config, source: 'request'};
	}

	let rawResponse = await fetch(url, fetchConfig);

	if (isTransientFailure(rawResponse) && options.retry > 0) {
		let retriesCounter = options.retry;
		let nextRetryDelay = typeof (options.retryDelay) === 'number' ? options.retryDelay : 1;
		while (retriesCounter > 0) {
			await sleep(nextRetryDelay);
			options.retryCount++;
			rawResponse = await fetch(url, fetchConfig);
			if (!isTransientFailure(rawResponse)) {
				break;
			}
			if (typeof (options.retryDelay) !== 'number') {
				nextRetryDelay *= 2;
			}
			retriesCounter--;
		}
	}

	if (((hasDefinedKey(options, 'file') || hasDefinedKey(options, 'filePatch')) && hasDefinedKey(options, 'fileName')) || options.uploadRegisterOnly === true) {
		if (rawResponse.ok) {
			let authData = await rawResponse.json();
			if ('exists' in authData && authData.exists) {
				response = new FileUploadResponse({...fileUploadData, ...authData}, options, rawResponse);
			} else {
				if (options.uploadRegisterOnly === true) {
					throw new ErrorResponse(
						'API did not recognize provided file meta.',
						'Attempted to register existing file, but API did not recognize provided file meta.',
						rawResponse, options
					);
				}
				let uploadResponse, isUploadSuccessful, registerResponse;
				if (hasDefinedKey(options, 'filePatch')) {
					const uploadQuery = makeUrlQuery({
						...options,
						upload: authData.uploadKey
					}, filePatchQueryParamNames);
					const uploadUrl = `${options.apiScheme}://${options.apiAuthorityPart}/${options.apiPath}${path}${uploadQuery}`;

					delete fetchConfig.headers['Content-Type'];
					// upload file patch request
					uploadResponse = await fetch(uploadUrl, {
						...fetchConfig,
						method: 'PATCH',
						body: options.filePatch,
					});
					isUploadSuccessful = uploadResponse.status === 204;
				} else {
					let prefix = new Uint8ClampedArray(authData.prefix.split('').map(e => e.charCodeAt(0)));
					let suffix = new Uint8ClampedArray(authData.suffix.split('').map(e => e.charCodeAt(0)));
					let body = new Uint8ClampedArray(prefix.byteLength + options.file.byteLength + suffix.byteLength);
					body.set(prefix, 0);
					body.set(new Uint8ClampedArray(options.file), prefix.byteLength);
					body.set(suffix, prefix.byteLength + options.file.byteLength);

					// full file upload request
					uploadResponse = await fetch(authData.url, {
						headers: {
							[acceptedHeaderNames['contentType']]: authData.contentType,
						},
						method: 'POST',
						body: body.buffer
					});
					isUploadSuccessful = uploadResponse.status === 201;

					// register file request
					registerResponse = await fetch(url, {
						...fetchConfig,
						body: `upload=${authData.uploadKey}`
					});
					if (!registerResponse.ok) {
						return await throwErrorResponse(registerResponse, options, 'Upload stage 3: ');
					}
				}

				if (isUploadSuccessful) {
					response = new FileUploadResponse(fileUploadData, options, rawResponse, uploadResponse, registerResponse);
				} else {
					return await throwErrorResponse(uploadResponse, options, 'Upload stage 2: ');
				}
			}
		} else {
			return await throwErrorResponse(rawResponse, options, 'Upload stage 1: ');
		}
	} else {
		if (rawResponse.status < 200 || rawResponse.status >= 400) {
			return await throwErrorResponse(rawResponse, options, '');
		}

		let content;

		if (options.format === 'json') {
			try {
				content = await rawResponse.json();
			} catch (_) {
				content = null;
			}
			switch (options.method.toUpperCase()) {
				case 'GET':
				default:
					if ('library' in options.resource) {
						if (content && Array.isArray(content)) {
							response = new MultiReadResponse(content, options, rawResponse);
						} else {
							response = new SingleReadResponse(content, options, rawResponse);
						}
					} else {
						if ('schema' in options.resource) {
							response = new SchemaResponse(content, options, rawResponse);
						} else {
							response = new ApiResponse(content, options, rawResponse);
						}
					}
					break;
				case 'POST':
				case 'PUT':
				case 'PATCH':
					if (content && typeof content === 'object' && 'success' in content) {
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
			if ('file' in options.resource && options.method.toUpperCase() === 'GET') {
				let rawData = await rawResponse.arrayBuffer();
				response = new FileDownloadResponse(rawData, options, rawResponse);
			} else if ('fileUrl' in options.resource && options.method.toUpperCase() === 'GET') {
				const url = await rawResponse.text();
				response = new FileUrlResponse(url.replace('\n', '').trim(), options, rawResponse);
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
