/* eslint-env mocha */
'use strict';

const mockery = require('mockery');
const assert = require('chai').assert;
const KEY = 'LOREM';
const LIBRARY_KEY = 'u123456';
const ITEM_KEY = 'IITTEEMM';
const COLLECTION_KEY = 'CCOOLLEE';
const SEARCH_KEY = 'SEARCH_KEY';
const URL_ENCODED_TAGS = 'URL_ENCODED_TAGS';

describe('Zotero Api Client', () => {
	var lrc;
	// mock api so it never calls request(), instead
	// entire config is placed into lrc variable
	mockery.registerMock('./request', async opts => {
		lrc = opts;
		return {
			...opts,
			response: 'response' in opts && opts.response || null
		};
	});
	mockery.enable({ warnOnUnregistered: false });
	const api = require('../src/api');
	mockery.disable();
	
	beforeEach(() => {
		lrc = null;
	});

	describe('Accepts request parameters', () => {
		it('accepts api key', () => {
			const request = api(KEY).getConfig();
			assert.equal(request.authorization, `Bearer ${KEY}`);
		});

		it('accepts api key and optional config', () => {
			const request = api(KEY, {
				apiAuthorityPart: 'some-other-api.zotero.org'
			}).getConfig();
			assert.equal(request.authorization, `Bearer ${KEY}`);
			assert.equal(request.apiAuthorityPart, 'some-other-api.zotero.org');
		});

		it('allows configuration via multiple api() calls', () => {
			const request = api(KEY).api(null, {
				apiAuthorityPart: 'some-other-api.zotero.org'
			}).api().api().getConfig();
			assert.equal(request.authorization, `Bearer ${KEY}`);
			assert.equal(request.apiAuthorityPart, 'some-other-api.zotero.org');
		});

		it('allows independendly configured clients', () => {
			const myapi = api(KEY).api;
			const request1 = myapi().library('user', '1');
			const request2 = myapi().library('user', '2');
			assert.equal(request1.getConfig().authorization, `Bearer ${KEY}`);
			assert.equal(request1.getConfig().resource.library, 'u1');
			assert.equal(request2.getConfig().authorization, `Bearer ${KEY}`);
			assert.equal(request2.getConfig().resource.library, 'u2');
		});

		it('allows unauthorised requests', () => {
			const request = api().getConfig();
			assert.notProperty(request, 'authorization');
		});

		it('constructs user library key', () => {
			const request = api(KEY).library('user', '111').getConfig();
			assert.equal(request.resource.library, 'u111');
		});

		it('constructs group library key', () => {
			const request = api(KEY).library('group', '111').getConfig();
			assert.equal(request.resource.library, 'g111');
		});

		it('convert version() to a relevant header', () => {
			api(KEY).library(LIBRARY_KEY).items('AABBCCDD').version(42).get();
			assert.equal(lrc.ifModifiedSinceVersion, 42);

			api(KEY).library(LIBRARY_KEY).items().version(42).post([]);
			assert.equal(lrc.ifUnmodifiedSinceVersion, 42);

			api(KEY).library(LIBRARY_KEY).items('AABBCCDD').version(42).put({});
			assert.equal(lrc.ifUnmodifiedSinceVersion, 42);

			api(KEY).library(LIBRARY_KEY).items('AABBCCDD').version(42).patch({});
			assert.equal(lrc.ifUnmodifiedSinceVersion, 42);

			api(KEY).library(LIBRARY_KEY).items('AABBCCDD').version(42).delete();
			assert.equal(lrc.ifUnmodifiedSinceVersion, 42);
		});

	});

	describe('Construct get requests', () => {
		it('accepts api key', () => {
			const request = api(KEY).getConfig();
			assert.equal(request.authorization, `Bearer ${KEY}`);
		});
		
		it('handles api.library.items.get', () => {
			api(KEY).library(LIBRARY_KEY).items().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
		});

		it('handles api.library.items.top.get', () => {
			api(KEY).library(LIBRARY_KEY).items().top().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.isNull(lrc.resource.top);
		});

		it('handles api.library.items.trash.get', () => {
			api(KEY).library(LIBRARY_KEY).items().trash().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.isNull(lrc.resource.trash);
		});

		it('handles api.library.items(I).get', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
		});

		it('handles api.library.items(I).children.get', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).children().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.children);
		});

		it('handles api.library.items(I).tags.get', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).tags().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.tags);
		});

		it('handles api.library.collections.get', () => {
			api(KEY).library(LIBRARY_KEY).collections().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.collections);
		});

		it('handles api.library.collections(C).subcollections.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).subcollections().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.subcollections);
		});

		it('handles api.library.collections.top.get', () => {
			api(KEY).library(LIBRARY_KEY).collections().top().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.collections);
			assert.isNull(lrc.resource.top);
		});


		it('handles api.library.collections(C).get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
		});

		it('handles api.library.collections(C).children.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).children().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.children);
		});

		it('handles api.library.collections(C).items.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).items().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.items);
		});

		it('handles api.library.collections(C).items.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).items().top().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.items);
			assert.isNull(lrc.resource.top);
		});

		it('handles api.library.collections(C).tags.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).tags().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.tags);
		});

		it('handles api.library.collections(C).tags.get', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).tags().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.tags);
		});

		it('handles api.library.searches.get', () => {
			api(KEY).library(LIBRARY_KEY).searches().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.searches);
		});

		it('handles api.library.searches(S).get', () => {
			api(KEY).library(LIBRARY_KEY).searches(SEARCH_KEY).get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.searches, SEARCH_KEY);
		});

		it('handles api.library.tags().get', () => {
			api(KEY).library(LIBRARY_KEY).tags().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.tags);
		});

		it('handles api.library.tags().get', () => {
			api(KEY).library(LIBRARY_KEY).tags(URL_ENCODED_TAGS).get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.tags, URL_ENCODED_TAGS);
		});
	});

	describe('Construct write requests', () => {

		it('handles api.library.items().post([I1b, I2b])', () => {
			let body = [{ key: 'ITEM1111' }, { key: 'ITEM2222' }];
			api(KEY).library(LIBRARY_KEY).items().post(body);
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.items(I1).put(I1b)', () => {
			let body = { key: 'ITEM1111', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).put(body);
			assert.equal(lrc.method, 'put');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.items(I1).patch(I1pb)', () => {
			let body = { key: 'ITEM1111', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).patch(body);
			assert.equal(lrc.method, 'patch');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.items(I1).delete()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).delete();
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
		});

		it('handles api.library.items().delete([I1, I2])', () => {
			let keysToDelete = ['ITEM1111', 'ITEM2222'];
			api(KEY).library(LIBRARY_KEY).items().delete(keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.deepEqual(lrc.itemKey.sort(), keysToDelete.sort())
		});

		it('handles api.library.collections().post([C1b, C2b])', () => {
			let body = [{ key: 'COLLECT1' }, { key: 'COLLECT2' }];
			api(KEY).library(LIBRARY_KEY).collections().post(body);
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.collections);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.collections(C1).put(C1b)', () => {
			let body = { key: 'COLLECT1', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).put(body);
			assert.equal(lrc.method, 'put');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.collections(C1).delete()', () => {
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).delete();
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
		});

		it('handles api.library.collections().delete([C1, C2])', () => {
			let keysToDelete = ['COLLECT1', 'COLLECT2'];
			api(KEY).library(LIBRARY_KEY).collections().delete(keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.collections);
			assert.deepEqual(lrc.collectionKey.sort(), keysToDelete.sort())
		});

		it('handles api.library.searches.post([S1b, S2b])', () => {
			let body = [{ key: 'SEARCH11' }, { key: 'SEARCH22' }];
			api(KEY).library(LIBRARY_KEY).searches().post(body);
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.searches);
			assert.deepEqual(lrc.body, body);
		});

		it('handles api.library.searches().delete([S1, S2])', () => {
			let keysToDelete = ['SEARCH11', 'SEARCH22'];
			api(KEY).library(LIBRARY_KEY).searches().delete(keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.searches);
			assert.deepEqual(lrc.searchKey.sort(), keysToDelete.sort())
		});

		it('handles api.library.tags().delete([T1, T2])', () => {
			let keysToDelete = ['TTAAGG11', 'TTAAGG22'];
			api(KEY).library(LIBRARY_KEY).tags().delete(keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.tags);
			assert.deepEqual(lrc.tag.sort(), keysToDelete.sort())
		});
	});

	describe('Construct meta requests', () => {
		it('handles api.itemTypes', () => {
			api().itemTypes().get();
			assert.equal(lrc.method, 'get');
			assert.isNull(lrc.resource.itemTypes);
		});

		it('handles api.itemFields', () => {
			api().itemFields().get();
			assert.equal(lrc.method, 'get');
			assert.isNull(lrc.resource.itemFields);
		});

		it('handles api.itemTypeFields', () => {
			api().itemTypeFields('book').get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.itemType, 'book');
			assert.isNull(lrc.resource.itemTypeFields);
		});

		it('handles api.creatorFields', () => {
			api().creatorFields().get();
			assert.equal(lrc.method, 'get');
			assert.isNull(lrc.resource.creatorFields);
		});

		it('handles api.itemTypeCreatorTypes', () => {
			api().itemTypeCreatorTypes('book').get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.itemType, 'book');
			assert.isNull(lrc.resource.itemTypeCreatorTypes);
		});

		it('handles api.template', () => {
			api().template('book').get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.itemType, 'book');
			assert.isNull(lrc.resource.template);
		});

	});

	describe('Handles invalid calls', () => {
		it('throws when invalid library is specified', () => {
			let configuredApi = api();
			assert.throws(configuredApi.library.bind(configuredApi, 'foobar', 1), /Unrecognized library type foobar/);
		});

		it('throws when delete is called incorrectly', () => {
			let configuredApi = api();
			assert.throws(configuredApi.delete.bind(configuredApi), /Called delete\(\) without first specifing what to delete/);
			assert.throws(configuredApi.delete.bind(configuredApi, 'foobar'), /Called delete\(\) with string, expected an Array/);
		});
	});

	describe('Handles extensions', () => {
		it('allows additional executors', async () => {
			const extension = args => {
				const { config, ef } = args;
				const executor = () => ({ response: 'good'});
				return ef.bind(config)({
					executors: [executor, ...config.executors]
				});
			}

			const response = await api().use(extension).library(LIBRARY_KEY).items('AABBCCDD').get();

			assert.equal(response, 'good');
		});

		it('allows configuration via multiple api() calls while preserving additional executors', async () => {
			const extension = args => {
				const { config, ef } = args;
				const executor = () => ({ response: 'good'});
				return ef.bind(config)({
					executors: [executor, ...config.executors]
				});
			}

			const response = await api().use(extension).api().library(LIBRARY_KEY).api().items('AABBCCDD').api().get();
			assert.equal(response, 'good');
		});

		it('allows additional functions', async () => {
			const extension = args => {
				const { config, ef, functions } = args;
				functions.foo = function() {
					return ef.bind(this)({
						isFoo: true
					})
				};

				return ef.bind(config)();
			}

			const partial = api().use(extension);
			const configWithoutFoo = await partial.library(LIBRARY_KEY).items('AABBCCDD').getConfig();
			assert.notProperty(configWithoutFoo, 'isFoo');

			const configWithFoo = await partial.foo().library(LIBRARY_KEY).items('AABBCCDD').getConfig();
			assert.property(configWithFoo, 'isFoo');
			assert.equal(configWithFoo.isFoo, true);
		});

		it('allows configuration via multiple api() calls while preserving extension functions', async () => {
			const extension = args => {
				const { config, ef, functions } = args;
				functions.foo = function() {
					return ef.bind(this)({
						isFoo: true
					})
				};

				return ef.bind(config)();
			}

			const partial = api().use(extension).api(KEY);
			const configWithoutFoo = await partial.library(LIBRARY_KEY).items('AABBCCDD').getConfig();
			assert.notProperty(configWithoutFoo, 'isFoo');

			const configWithFoo = await partial.foo().library(LIBRARY_KEY).items('AABBCCDD').getConfig();
			assert.property(configWithFoo, 'isFoo');
			assert.equal(configWithFoo.isFoo, true);
			assert.equal(configWithFoo.authorization, `Bearer ${KEY}`);
		});
	});
});