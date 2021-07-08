/*
 * @class represents a generic Zotero API response 
 */
class ApiResponse {
	constructor(data, options, response) {
		this.raw = data;
		this.options = options;
		this.response = response;
	}

	getResponseType() {
		return 'ApiResponse';
	}

	getData() {
		return this.raw;
	}

	getLinks() {
		if('links' in this.raw) {
			return this.raw.links;
		}
		return null;
	}

	getMeta() {
		if('meta' in this.raw) {
			return this.raw.meta;
		}
		return null;
	}

	getVersion() {
		return parseInt(this.response.headers.get('Last-Modified-Version'), 10);
	}
}

/**
 * @class represents a response to a GET request containing a single entity
 * @extends ApiResponse
 */
class SingleReadResponse extends ApiResponse {
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
 */
class MultiReadResponse extends ApiResponse {
	getResponseType() {
		return 'MultiReadResponse';
	}
	/**
	 * @return {Array} a list of entities returned in this response
	 */
	getData() {
		return this.raw.map(r => 'data' in r ? r.data : 'tag' in r ? { tag: r.tag } : r);
	}

	getLinks() {
		return this.raw.map(r => 'links' in r && r.links || null);
	}

	getMeta() {
		return this.raw.map(r => 'meta' in r && r.meta || null);
	}
}

/**
 * @class represents a response to a PUT or PATCH request
 * @extends ApiResponse
 */
class SingleWriteResponse extends ApiResponse {
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
			version: parseInt(this.response.headers.get('Last-Modified-Version'), 10)
		}
	}
}

/**
 * @class represents a response to a POST request
 * @extends ApiResponse
 */
class MultiWriteResponse extends ApiResponse {
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
					version: parseInt(this.response.headers.get('Last-Modified-Version'), 10)
				};
			} else {
				return item;
			}
		});
	}

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
	 * @see {@link getEntityByIndex}
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
				version: parseInt(this.response.headers.get('Last-Modified-Version'), 10)
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
 * @class represents a response to a DELETE request
 * @extends ApiResponse
 */
class DeleteResponse extends ApiResponse {
	getResponseType() {
		return 'DeleteResponse';
	}
}

/**
 * @class represents a response to a file upload request
 * @extends ApiResponse
 * @property {Object} authResponse     - Response object for the stage 1 (upload authorisation)
 *                                       request
 * @property {Object} response 	       - alias for "authResponse" 
 * @property {Object} uploadResponse   - Response object for the stage 2 (file upload) request
 * @property {Objext} registerResponse - Response object for the stage 3 (upload registration)
 *                                       request
 */
class FileUploadResponse extends ApiResponse {
	constructor(data, options, authResponse, uploadResponse, registerResponse) {
		super(data, options, authResponse);
		this.uploadResponse = uploadResponse;
		this.registerResponse = registerResponse;
	}

	getResponseType() {
		return 'FileUploadResponse';
	}

	getVersion() {
		return this.registerResponse ?
			parseInt(this.registerResponse.headers.get('Last-Modified-Version'), 10) :
			parseInt(this.response.headers.get('Last-Modified-Version'), 10);
	}
}

/**
 * @class represents a response to a file download request
 * @extends ApiResponse
 */
class FileDownloadResponse extends ApiResponse {
	getResponseType() {
		return 'FileDownloadResponse';
	}
}

/**
 * @class represents a response containing temporary url for file download
 * @extends ApiResponse
 */
class FileUrlResponse extends ApiResponse {
	getResponseType() {
		return 'FileUrlResponse';
	}
}

/**
 * @class represents a raw response, e.g. to data requests with format other than json
 * @extends ApiResponse
 */
class RawApiResponse extends ApiResponse {
	constructor(rawResponse, options) {
		super(rawResponse, options, rawResponse);
	}

	getResponseType() {
		return 'RawApiResponse';
	}
}

class PretendResponse extends ApiResponse {
	getResponseType() {
		return 'PretendResponse';
	}

	getVersion() {
		return null;
	}
}

/**
 * @class represents an error response from the api
 * @extends Error
 * @property {Object} response - Response object for the request, with untouched body
 * @property {String} message  - What error occurred, ususally contains response code and status
 * @property {String} reason   - More detailed reason for the failure, if provided by the API
 * @property {String} options  - Configuration object used for this request
 */
class ErrorResponse extends Error {
	constructor(message, reason, response, options) {
		super(message);
		this.response = response;
		this.reason = reason;
		this.message = message;
		this.options = options;
	}

	getResponseType() {
		return 'ErrorResponse';
	}
}

export { ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse,
FileUploadResponse, FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse,
RawApiResponse, SingleReadResponse, SingleWriteResponse };