'use strict';

class ApiResponse {
	constructor(data, options, response) {
		this.raw = data;
		this.options = options;
		this.response = response;
	}

	getData() {
		return this.raw;
	}
}

class SingleReadResponse extends ApiResponse {
	getData() {
		return this.raw.data;
	}
}

class MultiReadResponse extends ApiResponse {
	getData() {
		return this.raw.map(r => r.data);
	}
}

class SingleWriteResponse extends ApiResponse {
	getData() {
		if(this.response.status === 204) {
			return {
				...this.options.body,
				version: this.response.headers.get('Last-Modified-Version') 
			}
		} else {
			return this.raw.data;
		}
	}
}

class MultiWriteResponse extends ApiResponse {
	isSuccess() {
		return Object.keys(this.raw.failed).length === 0;
	}

	getData() {
		return this.options.body.map((item, index) => {
			index = index.toString();
			if(index in this.raw.success) {
				return {
					...item,
					version: this.response.headers.get('Last-Modified-Version')
				};
			} else {
				return item;
			}
		});
	}

	getErrors() {
		const errors = {};
		for(let i of Object.keys(this.raw.failed)) {
			errors[parseInt(i, 10)] = this.raw.failed[i];
		}

		return errors;
	}

	getEntityByKey(key) {
		let index = this.options.body.findIndex(entity => {
			return entity.key === key
		});

		if(index > -1) {
			return this.getEntityByIndex(index);
		}

		throw new Error(`Key ${key} is not present in the request`);
	}

	getEntityByIndex(index) {
		if(typeof index === 'string') {
			index = parseInt(index, 10);
		}

		if(index.toString() in this.raw.success) {
			return {
				...this.options.body[index],
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

class DeleteResponse extends ApiResponse {}

class ErrorResponse extends Error {
	constructor(message, response, options) {
		super(message);
		this.response = response;
		this.message = message;
		this.options = options;
	}
}

module.exports = {
	ApiResponse,
	SingleReadResponse,
	MultiReadResponse,
	SingleWriteResponse,
	MultiWriteResponse,
	DeleteResponse,
	ErrorResponse
};