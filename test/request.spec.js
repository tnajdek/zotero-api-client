/* eslint-env mocha */
'use strict';

const fetchMock = require('fetch-mock');
const { assert } = require('chai');
const request = require('../src/request');
const {
	SingleReadResponse,
	MultiReadResponse
} = require('../src/response.js');
const singleGetResponseFixture = require('./fixtures/single-object-get-response.json');
const multiGetResponseFixture = require('./fixtures/multi-object-get-response.json');

describe('ZoteroJS', () => {
	describe('request()', () => {
		beforeEach(() => {
			fetchMock.catch(request => {
				throw(new Error(`A request to ${request} was not expected`));
			});
		});

		afterEach(fetchMock.restore);

		it('should get a single item', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/X42A7DEE',
				singleGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: 'X42A7DEE'
				}
			}).then(response => {
				assert.instanceOf(response, SingleReadResponse);
				assert.equal(response.getData().key, 'X42A7DEE');
			});
		});

		it('should get /top items from a user library', () => {
			//@TODO: verify URL
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/top',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.equal(response.getData().length, 15);
			});
		});

		it('should get /top items from a group library', () => {
			//@TODO: verify URL
			fetchMock.mock(
				'begin:https://api.zotero.org/groups/123456/items/top',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'g123456',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.equal(response.getData().length, 15);
			});
		});

		it('should get items from the collection', () => {
			//@TODO: verify URL
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/collections/N7W92H48/items',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					collections: 'N7W92H48',
					items: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.equal(response.getData().length, 15);
			});
		});

		it('should get /top items from the collection', () => {
			//@TODO: verify URL
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/collections/N7W92H48/items/top',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					collections: 'N7W92H48',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.equal(response.getData().length, 15);
			});
		});

	});
});