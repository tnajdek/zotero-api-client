'use strict';

/**
 * Module contains classes that offer abstraction over Zotero API responses
 * @module response
 */


/*
 * @class represents a generic Zotero API response 
 */
class ApiResponse {
	constructor(data, options, response) {
		this.raw = data;
		this.options = options;
		this.response = response;
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

	getVersion() {
		return this.response.headers.get('Last-Modified-Version');
	}
}

/**
 * @class represents a response to a GET request containing a single entity
 * @extends ApiResponse
 */
class SingleReadResponse extends ApiResponse {
	/**
	 * @return {Object} entity returned in this response
	 */
	getData() {
		return this.raw ? this.raw.data : this.raw;
	}
}

/**
 * @class represnets a response to a GET request containing multiple entities
 * @extends ApiResponse
 */
class MultiReadResponse extends ApiResponse {
	/**
	 * @return {Array} a list of entities returned in this response
	 */
	getData() {
		return this.raw.map(r => r.data);
	}

	getLinks() {
		return this.raw.map(r => 'links' in r && r.links || null).filter(Object);
	}
}

/**
 * @class represents a response to a PUT or PATCH request
 * @extends ApiResponse
 */
class SingleWriteResponse extends ApiResponse {

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
				return {
					...item,
					key: this.raw.success[index],
					version: this.response.headers.get('Last-Modified-Version')
				};
			} else {
				return item;
			}
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
			return {
				...this.options.body[index],
				key: this.raw.success[index],
				version: this.response.headers.get('Last-Modified-Version')
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
class DeleteResponse extends ApiResponse {}

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
	constructor(options, authResponse, uploadResponse, registerResponse) {
		super({}, options, authResponse);
		this.uploadResponse = uploadResponse;
		this.registerResponse = registerResponse;
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
}

module.exports = {
	ApiResponse,
	DeleteResponse,
	ErrorResponse,
	FileUploadResponse,
	MultiReadResponse,
	MultiWriteResponse,
	SingleReadResponse,
	SingleWriteResponse,
};