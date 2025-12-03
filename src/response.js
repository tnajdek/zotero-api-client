const parseIntHeaders = (headers, headerName) => {
	const value = (headers && headers.get(headerName)) || null;
	return value === null ? null : parseInt(value, 10);
}

/**
 * @class Represents a generic Zotero API response. Usually a specialised variant inheriting from
 * this class is returned when doing an API request
 * @memberof module:zotero-api-client
 * @inner
 */
class ApiResponse {
	constructor(data, options, response) {
		this.raw = data;
		this.options = options;
		this.response = response;
	}

	/**
	 * Name of the class, useful to determine instance of which specialised class
	  has been returned
	 * @return {string} name of the class
	 */
	getResponseType() {
		return 'ApiResponse';
	}

	/**
	 * Content of the response. Specialised classes provide extracted data depending on context.
	 * @return {object}
	 */
	getData() {
		return this.raw;
	}

	/**
	 * Links available in the response. Specialised classes provide extracted links depending on context.
	 * @return {object}
	 */
	getLinks() {
		if ('links' in this.raw) {
			return this.raw.links;
		}
		return null;
	}

	/**
	 * Meta data available in the response. Specialised classes provide extracted meta data depending on context.
	 * @return {object}
	 */
	getMeta() {
		if ('meta' in this.raw) {
			return this.raw.meta;
		}
		return null;
	}

	/**
	 * Bib available in the response if requested via `options.include=bib`. Specialised classes provide extracted meta data depending on context.
	 * @return {object}
	 */
	getBib() {
		if('bib' in this.raw) {
			return this.raw.bib;
		}
		return null;
	}

	/**
	 * Value of the "Last-Modified-Version" header in response if present. Specialised classes provide
	  version depending on context
	 * @return {?number} Version of the content in response
	 */
	getVersion() {
		return parseIntHeaders(this.response.headers, 'Last-Modified-Version');
	}
}

class SchemaResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'SchemaResponse';
	}

	/**
	 * @returns {number} Version of the schema
	 */
	getVersion() {
		return this.raw.version;
	}

	getMeta() {
		return null;
	}
}

/**
 * @class Represents a response to a GET request containing a single entity
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class SingleReadResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'SingleReadResponse';
	}

	/**
	 * @return {Object} entity returned in this response
	 */
	getData() {
		return this.raw && 'data' in this.raw ? this.raw.data : this.raw;
	}
}

/**
 * @class represents a response to a GET request containing multiple entities
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class MultiReadResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'MultiReadResponse';
	}

	/**
	 * @return {Array} a list of entities returned in this response
	 */
	getData() {
		return this.raw.map(r => 'data' in r ? r.data : 'tag' in r ? {tag: r.tag} : r);
	}

	/**
	 * @return {Array} a list of links, indexes of the array match indexes of entities in {@link
module:zotero-api-client~MultiReadResponse#getData}
	 */
	getLinks() {
		return this.raw.map(r => 'links' in r && r.links || null);
	}

	/**
	 * @return {Array} a list of meta-data, indexes of the array match indexes of entities in {@link
module:zotero-api-client~MultiReadResponse#getData}
	 */
	getMeta() {
		return this.raw.map(r => 'meta' in r && r.meta || null);
	}

	/**
	 * @return {Array} a list of formatted references (if requested via `options.include=bib`), indexes of the array match indexes of entities in {@link
module:zotero-api-client~MultiReadResponse#getData}
	 */
	getBib() {
		return this.raw.map(r => 'bib' in r && r.bib || null);
	}

	/**
	 * @return {?number} Total number of results
	 */
	getTotalResults() {
		return parseIntHeaders(this.response.headers, 'Total-Results');
	}

	/**
	 * @return {object} Parsed content of "Link" header as an object where value of "rel" is a key and
	  the URL is the value. For paginated responses contain URLs for "first", "next", "prev" and "last".
	 */
	getRelLinks() {
		const links = this.response.headers.get('link') ?? '';
		const matches = Array.from(links.matchAll(/<(.*?)>;\s+rel="(.*?)"/ig));
		return Array
			.from(matches)
			.reduce((acc, match) => { // eslint-disable-line no-unused-vars
				const url = match[1];
				const rel = match[2];
				acc[rel] = url;
				return acc;
			}, {});
	}
}

/**
 * @class Represents a response to a PUT or PATCH request
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class SingleWriteResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'SingleWriteResponse';
	}

	/**
	 * @return {Object} For put requests, this represents a complete, updated object.
	 *                  For patch requests, this represents only updated fields of the updated object.
	 */
	getData() {
		return {
			...this.options.body,
			version: this.getVersion()
		}
	}
}

/**
 * @class Represents a response to a POST request
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class MultiWriteResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'MultiWriteResponse';
	}

	/**
	 * @return {Boolean} Indicates whether all write operations were successful
	 */
	isSuccess() {
		return Object.keys(this.raw.failed).length === 0;
	}

	/**
	 * Returns all entities POSTed in an array. Entities that have been written successfully
	 * are returned updated, other entities are returned unchanged. It is advised to verify
	 * if the request was entirely successful (see isSuccess and getError) before using this method.
	 * @return {Array} A modified list of all entities posted.
	 */
	getData() {
		return this.options.body.map((item, index) => {
			index = index.toString();
			if (index in this.raw.success) {
				const remoteItem = this.raw.successful && this.raw.successful[index] || {};
				return {
					...item,
					...remoteItem.data,
					key: this.raw.success[index],
					version: this.getVersion()
				};
			} else {
				return item;
			}
		});
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getLinks}
	 */
	getLinks() {
		return this.options.body.map((_, index) => {
			if ("successful" in this.raw) {
				const entry = this.raw.successful[index.toString()];
				if (entry) {
					return entry.links || null;
				}
			}
			return null;
		});
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getMeta}
	 */
	getMeta() {
		return this.options.body.map((_, index) => {
			if ("successful" in this.raw) {
				const entry = this.raw.successful[index.toString()];
				if (entry) {
					return entry.meta || null;
				}
			}
			return null;
		});
	}

	/**
	 * Returns all errors that have occurred.
	 * @return {Object} Errors object where keys are indexes of the array of the original request and values are the errors occurred.
	 */
	getErrors() {
		const errors = {};
		for (let i of Object.keys(this.raw.failed)) {
			errors[parseInt(i, 10)] = this.raw.failed[i];
		}

		return errors;
	}

	/**
	 * Allows getting an updated entity based on its key, otherwise identical to getEntityByIndex
	 * @param  {String} key
	 * @throws {Error} If key is not present in the request
	 * @see {@link module:zotero-api-client.getEntityByIndex}
	 */
	getEntityByKey(key) {
		let index = this.options.body.findIndex(entity => {
			return entity.key === key
		});

		if (index > -1) {
			return this.getEntityByIndex(index);
		}

		throw new Error(`Key ${key} is not present in the request`);
	}

	/**
	 * Allows getting an updated entity based on its index in the original request
	 * @param  {Number|String} index
	 * @return {Object}
	 * @throws {Error} If index is not present in the original request
	 * @throws {Error} If error occurred in the POST for selected entity. Error message will contain the reason for failure.
	 */
	getEntityByIndex(index) {
		if (typeof index === 'string') {
			index = parseInt(index, 10);
		}

		if (index.toString() in this.raw.success) {
			const remoteItem = this.raw.successful && this.raw.successful[index.toString()] || {};
			return {
				...this.options.body[index],
				...remoteItem.data,
				key: this.raw.success[index],
				version: this.getVersion()
			}
		}

		if (index.toString() in this.raw.unchanged) {
			return this.options.body[index];
		}

		if (index.toString() in this.raw.failed) {
			throw new Error(`${this.raw.failed[index.toString()].code}: ${this.raw.failed[index.toString()].message}`);
		}

		throw new Error(`Index ${index} is not present in the response`);
	}
}

/**
 * @class Represents a response to a DELETE request
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class DeleteResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'DeleteResponse';
	}
}

/**
 * @class Represents a response to a file upload request
 * @extends ApiResponse
 * @property {Object} authResponse     - Response object for stage 1 (upload authorisation) request
 * @property {Object} response 	       - alias for "authResponse"
 * @property {Object} uploadResponse   - Response object for stage 2 (file upload) request
 * @property {Object} registerResponse - Response object for stage 3 (upload registration) request
 * @memberof module:zotero-api-client
 * @inner
 */
class FileUploadResponse extends ApiResponse {
	constructor(data, options, authResponse, uploadResponse, registerResponse) {
		super(data, options, authResponse);
		this.uploadResponse = uploadResponse;
		this.registerResponse = registerResponse;
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'FileUploadResponse';
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getVersion}
	 */
	getVersion() {
		// full upload will have the latest version in the final register response,
		// partial upload could have the latest version in the upload response
		// (because that goes through API), however, currently that's not the case.
		// If a file existed before, and currently for partial uploads, the latest version
		// will be in obtained from the initial response
		return parseIntHeaders(this.registerResponse?.headers, 'Last-Modified-Version') ??
			parseIntHeaders(this.uploadResponse?.headers, 'Last-Modified-Version') ??
			parseIntHeaders(this.response.headers, 'Last-Modified-Version');
	}
}

/**
 * @class Represents a response to a file download request
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class FileDownloadResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'FileDownloadResponse';
	}
}

/**
 * @class Represents a response containing temporary url for file download
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class FileUrlResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'FileUrlResponse';
	}
}

/**
 * @class Represents a raw response, e.g. to data requests with format other than JSON
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class RawApiResponse extends ApiResponse {
	constructor(rawResponse, options) {
		super(rawResponse, options, rawResponse);
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'RawApiResponse';
	}
}

/**
 * @class Represents a response for pretended request, mostly for debug purposes. See {@link module:zotero-api-client.api~pretend}
 * @extends ApiResponse
 * @memberof module:zotero-api-client
 * @inner
 */
class PretendResponse extends ApiResponse {
	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'PretendResponse';
	}

	/**
	 * @return {Object} For pretended request version will always be null.
	 */
	getVersion() {
		return null;
	}
}

/**
 * @class Represents an error response from the api
 * @extends Error
 * @property {Object} response - Response object for the request, with untouched body
 * @property {String} message  - What error occurred, usually contains response code and status
 * @property {String} reason   - More detailed reason for the failure, if provided by the API
 * @property {String} options  - Configuration object used for this request
 * @memberof module:zotero-api-client
 * @inner
 */
class ErrorResponse extends Error {
	constructor(message, reason, response, options) {
		super(message);
		this.response = response;
		this.reason = reason;
		this.message = message;
		this.options = options;
	}

	/**
	 * Value of the "Last-Modified-Version" header in response if present. This is generally only available if the server responded with 412 due to a version mismatch.
	 * @return {?number} Version of the content in response
	 */
	getVersion() {
		return parseIntHeaders(this.response.headers, 'Last-Modified-Version');
	}

	/**
	 * @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	 */
	getResponseType() {
		return 'ErrorResponse';
	}
}

export {
	ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse,
	FileUploadResponse, FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse,
	RawApiResponse, SchemaResponse, SingleReadResponse, SingleWriteResponse
};
