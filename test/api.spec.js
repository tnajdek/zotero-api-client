/* eslint-env mocha */
import { assert } from 'chai';
import _api from '../src/api.js';

const KEY = 'LOREM';
const LIBRARY_KEY = 'u123456';
const ITEM_KEY = 'IITTEEMM';
const COLLECTION_KEY = 'CCOOLLEE';
const SEARCH_KEY = 'SEARCH_KEY';
const URL_ENCODED_TAGS = 'URL_ENCODED_TAGS';
const FILE = Uint8ClampedArray.from('lorem ipsum'.split('').map(e => e.charCodeAt(0))).buffer;
const FILE_NAME = 'test.txt';
const MD5 = '9edb2ca32f7b57662acbc112a80cc59d';


describe('Zotero Api Client', () => {
	var lrc;
	// mock api so it never calls request(), instead
	// entire config is placed into lrc variable
	const mockRequest = async opts => {
		// console.log('mockRequest', { opts });
		lrc = opts;
		return {
			...opts,
			response: 'response' in opts && opts.response || null
		};
	};
	const api = _api(null, { executors: [mockRequest] }).api;
	
	beforeEach(() => {
		lrc = null;
	});

	describe('Accepts request parameters', () => {
		it('accepts api key', () => {
			const request = api(KEY).getConfig();
			assert.equal(request.zoteroApiKey, KEY);
		});

		it('accepts api key and optional config', () => {
			const request = api(KEY, {
				apiAuthorityPart: 'some-other-api.zotero.org'
			}).getConfig();
			assert.equal(request.zoteroApiKey, KEY);
			assert.equal(request.apiAuthorityPart, 'some-other-api.zotero.org');
		});

		it('allows configuration via multiple api() calls', () => {
			const request = api(KEY).api(null, {
				apiAuthorityPart: 'some-other-api.zotero.org',
				retry: 3,
				retryDelay: 2,
			}).api().api().getConfig();
			assert.equal(request.zoteroApiKey, KEY);
			assert.equal(request.apiAuthorityPart, 'some-other-api.zotero.org');
			assert.equal(request.retry, 3);
			assert.equal(request.retryDelay, 2);
		});

		it('allows independendly configured clients', () => {
			const myapi = api(KEY).api;
			const request1 = myapi().library('user', '1');
			const request2 = myapi().library('user', '2');
			assert.equal(request1.getConfig().zoteroApiKey, KEY);
			assert.equal(request1.getConfig().resource.library, 'u1');
			assert.equal(request2.getConfig().zoteroApiKey, KEY);
			assert.equal(request2.getConfig().resource.library, 'u2');
		});

		it('allows unauthorised requests', () => {
			const request = api().getConfig();
			assert.notProperty(request, 'authorization');
			assert.notProperty(request, 'zoteroApiKey');
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
			assert.equal(request.zoteroApiKey, KEY);
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

		it('handles api.library.publications().items().get', () => {
			api(KEY).library(LIBRARY_KEY).publications().items().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.isNull(lrc.resource.publications);
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

		it('handles api.library.settings().get', () => {
			api(KEY).library(LIBRARY_KEY).settings().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.settings);
		});

		it('handles api.library.groups().get', () => {
			api(KEY).library(LIBRARY_KEY).groups().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.groups);
		});

		it('handles api.library.collections(C).items().top().tags().get', () => {
			api(KEY)
				.library(LIBRARY_KEY)
				.collections(COLLECTION_KEY)
				.items()
				.tags()
				.get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.collections, COLLECTION_KEY);
			assert.isNull(lrc.resource.items);
			assert.isNull(lrc.resource.tags);
		});

		it('handles api.library.deleted()', () => {
			api(KEY)
				.library(LIBRARY_KEY)
				.deleted(42)
				.get();

			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.deleted);
			assert.equal(lrc.since, 42);
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

		it('handles api.library.settings().post(SE1)', () => {
			const body = { tagColors: { value: [ {
				name: "test-tag",
				color: "#FFC0CB"
			} ] } };
			api(KEY).library(LIBRARY_KEY).settings().post(body);
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.settings);
			assert.deepEqual(lrc.body, body);
		});
	});

	describe('Construct attachment requests', () => {
		it('handles api.library.items(I).attachment(Fname, F).post()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).attachment(FILE_NAME, FILE).post();
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.file);
			assert.equal(lrc.file.byteLength, FILE.byteLength);
			assert.equal(lrc.fileName, FILE_NAME);
			assert.equal(lrc.ifNoneMatch, '*');
			assert.equal(lrc.contentType, 'application/x-www-form-urlencoded');
			assert.isNull(lrc.format);
			assert.isUndefined(lrc.body);
		});

		it('handles api.library.items(I).attachment(Fname, F, Fmtime, F2md5sum).post()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).attachment(FILE_NAME, FILE, 22, MD5).post();
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.file);
			assert.equal(lrc.file.byteLength, FILE.byteLength);
			assert.equal(lrc.fileName, FILE_NAME);
			assert.equal(lrc.mtime, 22);
			assert.equal(lrc.ifMatch, MD5);
			assert.equal(lrc.contentType, 'application/x-www-form-urlencoded');
			assert.isNull(lrc.format);
			assert.isUndefined(lrc.body);
		});
		
		it('handles api.library.items(I).attachment().get()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).attachment().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.file);
			assert.isNull(lrc.format);
			assert.isUndefined(lrc.fileName);
			assert.isUndefined(lrc.file);
		});

		it('handles api.library.items(I).attachmentUrl().get()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).attachmentUrl().get();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.fileUrl);
			assert.isNull(lrc.format);
			assert.isUndefined(lrc.fileName);
			assert.isUndefined(lrc.file);
		});

		it('handles api.library.items(I).registerAttachment(FName, FSize, Fmtime, Fmd5sum).post()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).registerAttachment(FILE_NAME, 11, 22, MD5).post();
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.isNull(lrc.resource.file);
			assert.equal(lrc.fileName, FILE_NAME);
			assert.equal(lrc.fileSize, 11);
			assert.equal(lrc.mtime, 22);
			assert.equal(lrc.md5sum, MD5);
			assert.equal(lrc.uploadRegisterOnly, true);
			assert.equal(lrc.ifMatch, MD5);
			assert.equal(lrc.contentType, 'application/x-www-form-urlencoded');
			assert.isNull(lrc.format);
			assert.isUndefined(lrc.body);
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

		it('handles api.library.items(I).pretend()', () => {
			api(KEY).library(LIBRARY_KEY).items(ITEM_KEY).pretend();
			assert.equal(lrc.method, 'get');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.equal(lrc.resource.items, ITEM_KEY);
			assert.strictEqual(lrc.pretend, true);
		});

		it('handles api.library.items().pretend(post, [I1b, I2b])', () => {
			const body = [{ key: 'ITEM1111' }, { key: 'ITEM2222' }];
			api(KEY).library(LIBRARY_KEY).items().pretend('post', body, { format: 'atom' });
			assert.equal(lrc.method, 'post');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.deepEqual(lrc.body, body);
			assert.strictEqual(lrc.pretend, true);
			assert.strictEqual(lrc.format, 'atom');
		});

		it('handles api.library.items().pretend(delete, [I1, I2])', () => {
			const keysToDelete = ['ITEM1111', 'ITEM2222'];
			api(KEY).library(LIBRARY_KEY).items().pretend('delete', keysToDelete);
			assert.equal(lrc.method, 'delete');
			assert.equal(lrc.resource.library, LIBRARY_KEY);
			assert.isNull(lrc.resource.items);
			assert.deepEqual(lrc.itemKey.sort(), keysToDelete.sort());
			assert.strictEqual(lrc.pretend, true);
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
			assert.equal(configWithFoo.zoteroApiKey, KEY);
		});
	});
});