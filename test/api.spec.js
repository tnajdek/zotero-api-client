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

describe('ZoteroJS', () => {
	var lrc;
	// mock api so it never calls request(), instead
	// entire config is placed into lrc variable
	mockery.registerMock('./request', async options => {
		lrc = options;
	});
	mockery.enable({ warnOnUnregistered: false });
	const { api } = require('../src/api');
	mockery.disable();
	beforeEach(() => {
		lrc = null;
	});

	describe('Accept request parameters', () => {
		it('accepts api key', () => {
			const request = api(KEY)._getConfig();
			assert.equal(request.authorization, `Bearer ${KEY}`);
		});

		it('constructs user library key', () => {
			const request = api(KEY).library('user', '111')._getConfig();
			assert.equal(request.resource.library, 'u111');
		});

		it('constructs group library key', () => {
			const request = api(KEY).library('group', '111')._getConfig();
			assert.equal(request.resource.library, 'g111');
		});
	});

	describe('Construct get requests', () => {
		it('accepts api key', () => {
			const request = api(KEY)._getConfig();
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

		it('handles api.library.search.get', () => {
			api(KEY).library(LIBRARY_KEY).search().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.search);
		});

		it('handles api.library.search(S).get', () => {
			api(KEY).library(LIBRARY_KEY).search(SEARCH_KEY).get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.search, SEARCH_KEY);
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
			assert.equal(lrc.body, JSON.stringify(body));
		});

		it('handles api.library.items(I1).put(I1b)', () => {
			let body = { key: 'ITEM1111', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).put(body);
			assert.equal(lrc.method, 'put');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.equal(lrc.body, JSON.stringify(body));
		});

		it('handles api.library.items(I1).patch(I1pb)', () => {
			let body = { key: 'ITEM1111', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).patch(body);
			assert.equal(lrc.method, 'patch');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.equal(lrc.body, JSON.stringify(body));
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
			assert.equal(lrc.body, JSON.stringify(body));
		});

		it('handles api.library.collections(C1).put(C1b)', () => {
			let body = { key: 'COLLECT1', thing: 'updated' };
			api(KEY).library(LIBRARY_KEY).collections(COLLECTION_KEY).put(body);
			assert.equal(lrc.method, 'put');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.equal(lrc.body, JSON.stringify(body));
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

		it('handles api.library.search.post([S1b, S2b])', () => {
			let body = [{ key: 'SEARCH11' }, { key: 'SEARCH22' }];
			api(KEY).library(LIBRARY_KEY).search().post(body);
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.search);
			assert.equal(lrc.body, JSON.stringify(body));
		});

		it('handles api.library.search().delete([S1, S2])', () => {
			let keysToDelete = ['SEARCH11', 'SEARCH22'];
			api(KEY).library(LIBRARY_KEY).search().delete(keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.search);
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
});