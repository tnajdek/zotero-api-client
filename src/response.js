const parseIntHeaders = (headers, headerName) => {
	const value = headers && headers.get(headerName);
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
		if('links' in this.raw) {
			return this.raw.links;
		}
		return null;
	}

	/**
	* Meta data available in the response. Specialised classes provide extracted meta data depending on context.
	* @return {object}
	*/
	getMeta() {
		if('meta' in this.raw) {
			return this.raw.meta;
		}
		return null;
	}

	/**
	* Contents of "Last-Modified-Version" header in response if present. Specialised classes provide
	  version depending on context
	* @return {?number} Version of the content in response
	*/
	getVersion() {
		return parseIntHeaders(this.response?.headers, 'Last-Modified-Version');
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
 * @class represnets a response to a GET request containing multiple entities
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
		return this.raw.map(r => 'data' in r ? r.data : 'tag' in r ? { tag: r.tag } : r);
	}

	/**
	* @return {Array} a list of links, indexes of the array match indexes of entities in {@link
module:zotero-api-client~MultiReadResponse#getData}
	*/
	getLinks() {
		return this.raw.map(r => 'links' in r && r.links || null);
	}

	/**
	* @return {Array} a list of meta data, indexes of the array match indexes of entities in {@link
module:zotero-api-client~MultiReadResponse#getData}
	*/
	getMeta() {
		return this.raw.map(r => 'meta' in r && r.meta || null);
	}

	/**
	* @return {string} Total number of results
	*/
	getTotalResults() {
		return parseIntHeaders(this.response?.headers, 'Total-Results');
	}

	/**
	* @return {object} Parsed content of "Link" header as object where value of "rel" is a key and
	  the URL is the value, contains values for "next", "last" etc.
	*/
	getRelLinks() {
		const links = this.response?.headers.get('link') ?? '';
		const matches = Array.from(links.matchAll(/<(.*?)>;\s+rel="(.*?)"/ig));
		return Array.from(matches).reduce((acc, [_match, url, rel]) => { // eslint-disable-line no-unused-vars
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
	 *                  For patch requests, this reprents only updated fields of the updated object.
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
	 * if request was entirely successful (see isSuccess and getError) before using this method.
	 * @return {Array} A modified list of all entities posted.
	 */
	getData() {
		return this.options.body.map((item, index) => {
			index = index.toString();
			if(index in this.raw.success) {
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
			if("successful" in this.raw) {
				const entry = this.raw.successful[index.toString()];
				if(entry) {
					return entry.links || {}
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
			if("successful" in this.raw) {
				const entry = this.raw.successful[index.toString()];
				if(entry) {
					return entry.meta || {}
				}
			}
			return null;
		});
	}

	/**
	 * Returns all errors that have occurred.
	 * @return {Object} Errors object where keys are indexes of the array of the original request and values are the erorrs occurred.
	 */
	getErrors() {
		const errors = {};
		for(let i of Object.keys(this.raw.failed)) {
			errors[parseInt(i, 10)] = this.raw.failed[i];
		}

		return errors;
	}

	/**
	 * Allows obtaining updated entity based on its key, otherwise identical to getEntityByIndex
	 * @param  {String} key
	 * @throws {Error} If key is not present in the request
	 * @see {@link module:zotero-api-client.getEntityByIndex}
	 */
	getEntityByKey(key) {
		let index = this.options.body.findIndex(entity => {
			return entity.key === key
		});

		if(index > -1) {
			return this.getEntityByIndex(index);
		}

		throw new Error(`Key ${key} is not present in the request`);
	}

	/**
	 * Allows obtaining updated entity based on its index in the original request
	 * @param  {Number} index
	 * @return {Object}
	 * @throws {Error} If index is not present in the original request
	 * @throws {Error} If error occured in the POST for selected entity. Error message will contain reason for failure.
	 */
	getEntityByIndex(index) {
		if(typeof index === 'string') {
			index = parseInt(index, 10);
		}

		if(index.toString() in this.raw.success) {
			const remoteItem = this.raw.successful && this.raw.successful[index.toString()] || {};
			return {
				...this.options.body[index],
				...remoteItem.data,
				key: this.raw.success[index],
				version: this.getVersion()
			}	
		}

		if(index.toString() in this.raw.unchanged) {
			return this.options.body[index];
		}

		if(index.toString() in this.raw.failed) {
			throw new Error(`${this.raw.failed[index.toString()].code}: ${this.raw.failed[index.toString()].message}`);
		}

		throw new Error(`Index ${index} is not present in the reponse`);
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
 * @property {Object} authResponse     - Response object for the stage 1 (upload authorisation)
 *                                       request
 * @property {Object} response 	       - alias for "authResponse" 
 * @property {Object} uploadResponse   - Response object for the stage 2 (file upload) request
 * @property {Objext} registerResponse - Response object for the stage 3 (upload registration)
 *                                       request
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
		return this.registerResponse ?
			parseIntHeaders(this.registerResponse?.headers, 'Last-Modified-Version') :
			parseIntHeaders(this.response?.headers, 'Last-Modified-Version');
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
 * @class Represents a raw response, e.g. to data requests with format other than json
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
 * @property {String} message  - What error occurred, ususally contains response code and status
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
	* @see {@link module:zotero-api-client~ApiResponse#getResponseType}
	*/
	getResponseType() {
		return 'ErrorResponse';
	}
}

export { ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse,
FileUploadResponse, FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse,
RawApiResponse, SchemaResponse, SingleReadResponse, SingleWriteResponse };