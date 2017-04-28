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
		return Object.keys(this.raw.failed.length) === 0;
	}

	getData() {
		const data = [];
		for(let i of Object.keys(this.raw.success)) {
			i = parseInt(i, 10);
			data.push({
				...this.options.body[i],
				version: this.response.headers.get('Last-Modified-Version')
			});
		}

		return [...data, ...Object.values(this.raw.unchanged)];
	}

	getErrors() {
		const errors = {};
		for(let i of Object.keys(this.raw.failed)) {
			errors[this.options.body[parseInt(i, 10)]] = this.raw.failed[i];
		}

		return errors;
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