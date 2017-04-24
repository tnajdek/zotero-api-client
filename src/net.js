'use strict';

const get = options => {
	request({
		...this,
		...options,
		method: 'get'
	})
};

const post = options => {
	request({
		...this,
		...options,
		method: 'post'
	})
};

const put = options => {
	request({
		...this,
		...options,
		method: 'put'
	})
};

const patch = options => {
	request({
		...this,
		...options,
		method: 'patch'
	})
};

const delete = options => {
	request({
		...this,
		...options,
		method: 'delete'
	})
};

export default {

}