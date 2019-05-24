/* eslint-env mocha */
'use strict';

const URL = require('url');
const fetchMock = require('fetch-mock');
const { assert } = require('chai');
const _request = require('../src/request');

const FILE = Uint8ClampedArray.from('lorem ipsum'.split('').map(e => e.charCodeAt(0))).buffer;
const FILE_MD5 = '80a751fde577028640c419000e33eba6';
const FILE_NAME = 'test.txt';
const FILE_SIZE = FILE.byteLength;
const {
	ApiResponse,
	DeleteResponse,
	ErrorResponse,
	FileDownloadResponse,
	FileUploadResponse,
	FileUrlResponse,
	MultiReadResponse,
	MultiWriteResponse,
	RawApiResponse,
	SingleReadResponse,
	SingleWriteResponse,
} = require('../src/response.js');
const singleGetResponseFixture = require('./fixtures/single-object-get-response.json');
const multiGetResponseFixture = require('./fixtures/multi-object-get-response.json');
const tagsResponseFixture = require('./fixtures/tags-data-response.json');
const searchesResponseFixture = require('./fixtures/searches-data-response.json');
const itemTypesDataFixture = require('./fixtures/item-types-data.json');
const multiMixedWriteResponseFixture = require('./fixtures/multi-mixed-write-response.json');
const multiSuccessWriteResponseFixture = require('./fixtures/multi-success-write-response.json');
const settingsReponseFixture = require('./fixtures/settings-response.json');
const userGroupsFixture = require('./fixtures/user-groups-response.json');

const request = async (opts) => {
	var config = await _request(opts);
	return 'response' in config && config.response || undefined;
}

describe('ZoteroJS request', () => {
	beforeEach(() => {
			fetchMock.catch(request => {
				throw(new Error(`A request to ${request} was not expected`));
			});
		});

	afterEach(fetchMock.restore);

	describe('Meta read requests', () => {
		it('should get item types', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/itemTypes',
				itemTypesDataFixture
			);

			return request({
				resource: {
					itemTypes: null
				}
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getResponseType(), 'ApiResponse');
				assert.strictEqual(response.getData().length, 2);
				assert.isNull(response.getLinks());
				assert.isNull(response.getMeta());
			});
		});

		it('should get item template', () => {
			fetchMock.mock(
				/https:\/\/api.zotero.org\/items\/new\/?.*?itemType=book/i,
				{
					itemType: 'book',
					title: ''
				}
			);

			return request({
				resource: {
					template: null
				},
				itemType: 'book'
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getData().itemType, 'book');
				assert.strictEqual(Object.keys(response.getData()).length, 2);
			});
		});
	});

	describe('Item read requests', () => {
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
				assert.strictEqual(response.getResponseType(), 'SingleReadResponse');
				assert.strictEqual(response.getLinks().self.href, 'https://api.zotero.org/users/475425/items/X42A7DEE');
				assert.strictEqual(response.getMeta().parsedDate, '1993');
				assert.strictEqual(Object.keys(response.getLinks()).length, 2);
				assert.strictEqual(response.getData().key, 'X42A7DEE');
			});
		});

		it('should get /top items from a user library', () => {
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
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 15);
				assert.strictEqual(response.getLinks().length, 15);
				assert.strictEqual(response.getMeta().length, 15);
			});
		});

		it('should get /top items from a group library', () => {
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
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get items from the trash', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/trash',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null,
					trash: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get subcollections from the collection', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/collections/N7W92H48/collections',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					collections: 'N7W92H48',
					subcollections: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get items from the collection', () => {
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
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get /top items from the collection', () => {
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
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get items from My Publications', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/publications/items',
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					publications: null,
					items: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should get a single tag by name', () => {
			fetchMock.mock(
				/https:\/\/api\.zotero\.org\/users\/475425\/tags\?.*?tag=Fiction.*?/,
				tagsResponseFixture.slice(-1)
			);

			return request({
				resource: {
					library: 'u475425',
					tags: null
					},
				tag: 'Fiction'
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getData().length, 1);
			});
		});

		it('should get a single search', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/searches',
				searchesResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					searches: null
					},
				searchKey: 'HHF7BB4C'
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getData().length, 1);
			});
		});

		it('should handle sorting and pagination', () => {
			fetchMock.mock(
				url => {
					let parsedUrl = URL.parse(url);
					parsedUrl = parsedUrl.search.slice(1);
					parsedUrl = parsedUrl.split('&');
					if(!parsedUrl.includes('sort=title')) {
						return false;
					}
					if(!parsedUrl.includes('direction=asc')) {
						return false;
					}
					if(!parsedUrl.includes('limit=50')) {
						return false;
					}
					if(!parsedUrl.includes('start=25')) {
						return false;
					}
					return true;
				},
				multiGetResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null
					},
				sort: 'title',
				direction: 'asc',
				limit: 50,
				start: 25
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 15);
			});
		});

		it('should handle searching by itemKey', () => {
			fetchMock.mock(
				url => {
					let parsedUrl = URL.parse(url);
					parsedUrl = parsedUrl.search.slice(1);
					parsedUrl = parsedUrl.split('&');
					if(!parsedUrl.includes('itemKey=N7W92H48')) {
						return false;
					}
					return true;
				},
				[multiGetResponseFixture[0]]
			);

			return request({
				resource: {
					library: 'u475425',
					items: null
					},
				itemKey: 'N7W92H48'
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 1);
			});
		});
	});

	describe('Misc read requests', () => {
		it('should get a single search', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/searches',
				searchesResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					searches: null
					},
				searchKey: 'HHF7BB4C'
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getData().length, 1);
			});
		});

		it('should get searches', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/searches',
				searchesResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					searches: null
					}
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getData().length, 1);
			});
		});

		it('should get a set of all tags in the library', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/tags',
				tagsResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get a set of tags for top items in the library', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/top/tags',
				tagsResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null,
					top: null,
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get a set of tags for top items in a collection', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/collections/N7W92H48/items/top/tags',
				tagsResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					collections: 'N7W92H48',
					items: null,
					top: null,
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get a set of tags for trashed items', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/trash/tags',
				tagsResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null,
					trash: null,
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get a set of tags for items in "My Publications"', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/publications/items/tags',
				tagsResponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					items: null,
					publications: null,
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get a set of tags for filtered by itemsQ and itemsTag', () => {
			fetchMock.mock(
				url => { 
					assert.isOk(
						url.startsWith('https://api.zotero.org/users/475425/items/tags')
					);
					assert.include(url, "itemQ=foo");
					assert.include(url, "itemQMode=everything");
					assert.include(url, "itemTag=bar");
					assert.include(url, "itemTag=baz");
					return true;
				}, tagsResponseFixture
			);

			return request({
				itemQ: 'foo',
				itemQMode: 'everything',
				itemTag: ['bar', 'baz'],
				resource: {
					library: 'u475425',
					items: null,
					tags: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData().length, 25);
			});
		});

		it('should get settings', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/settings',
				settingsReponseFixture
			);

			return request({
				resource: {
					library: 'u475425',
					settings: null,
				}
			}).then(response => {
				assert.instanceOf(response, SingleReadResponse);
				assert.strictEqual(response.getResponseType(), 'SingleReadResponse');
				assert.lengthOf(response.getData().tagColors.value, 2);
			});
		});

		it('should get user-accessible groups', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/groups',
				userGroupsFixture
			);

			return request({
				resource: {
					library: 'u475425',
					groups: null,
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.getData()[0].id, 51240);
			});
		});
	});

	describe('Get requests with extra params', () => {
		it('should include headers in the request', () => {
			fetchMock.mock(
				(url, opts) => {
					assert.property(opts, 'headers');
					assert.strictEqual(opts.headers['Authorization'], 'a');
					assert.strictEqual(opts.headers['Zotero-Write-Token'], 'b');
					assert.strictEqual(opts.headers['If-Modified-Since-Version'], 1);
					assert.strictEqual(opts.headers['If-Unmodified-Since-Version'], 1);
					assert.strictEqual(opts.headers['Content-Type'], 'c');
					return true;
				}, {}
			);

			return request({
				resource: {
					library: 'u475425',
					items: null
				},
				'authorization': 'a',
				'zoteroWriteToken': 'b',
				'ifModifiedSinceVersion': 1,
				'ifUnmodifiedSinceVersion': 1 ,
				'contentType': 'c'
			});
		});

		it('should include query params in the request', () => {
			fetchMock.mock(
				url => { 
					return [
						'format', 'include', 'content', 'style', 'itemKey',
						'collectionKey', 'searchKey', 'itemType', 'qmode',
						'since', 'tag', 'sort', 'direction', 'limit', 'start', 'q'
					].every(qp => url.includes(`${qp}=${qp}`));
				}, {}
			);

			return request({
				resource: {
					library: 'u475425',
					items: null
				},
				collectionKey: 'collectionKey',
				content: 'content',
				direction: 'direction',
				format: 'format',
				include: 'include',
				itemKey: 'itemKey',
				itemType: 'itemType',
				limit: 'limit',
				q: 'q',
				qmode: 'qmode',
				searchKey: 'searchKey',
				since: 'since',
				sort: 'sort',
				start: 'start',
				style: 'style',
				tag: 'tag',
			});
		});

		it('should handle arrays as query params', () => {
			fetchMock.get(
				'https://api.zotero.org/users/475425/items?format=json&tag=aaa&tag=bbb',
				multiGetResponseFixture
			);
			
			return request({
				resource: {
					library: 'u475425',
					items: null
				},
				tag: ['aaa', 'bbb'],
			});
		});
	});

	describe('Failing, empty & raw response get requests', () => {
		it('should throw ErrorResponse for non ok results', () => {
			fetchMock.mock('begin:https://api.zotero.org/', {
				status: 404,
				body: 'These aren\'t the droids You are looking for'
			});

			return request({
				resource: {
					library: 'u475425',
					items: null
				}
			}).then(() => {
				throw new Error('fail');
			}).catch(async error => {
				assert.instanceOf(error, ErrorResponse);
				assert.strictEqual(error.getResponseType(), 'ErrorResponse');
				assert.strictEqual(error.message, '404: Not Found');
				assert.strictEqual(error.reason, 'These aren\'t the droids You are looking for');
				assert.strictEqual(error.response.bodyUsed, false);
			});
		});

		it('should handly empty-body 304 response', () => {
			fetchMock.mock('begin:https://api.zotero.org/', {
				status: 304,
				body: ''
			});

			return request({
				resource: {
					library: 'u475425',
					items: null
				},
				ifModifiedSinceVersion: 42
			}).then(response => {
				assert.instanceOf(response, SingleReadResponse);
				assert.strictEqual(response.getResponseType(), 'SingleReadResponse');
				assert.isNull(response.getData());
				assert.strictEqual(response.response.status, 304);
			});
		});

		it('should return raw response for non-json requests', () => {
			fetchMock.mock('begin:https://api.zotero.org/', {
				status: 200,
				body: '<xml></xml>'
			});

			return request({
				resource: {
					library: 'u475425',
					items: null
				},
				format: 'atom'
			}).then(response => {
				assert.instanceOf(response, RawApiResponse);
				assert.strictEqual(response.getResponseType(), 'RawApiResponse');
				assert.strictEqual(response.raw.status, 200);
				assert.strictEqual(response.raw.bodyUsed, false);
			});
		});

		it('should be possible to make an empty requests', () => {
			fetchMock.mock('https://api.zotero.org/', {
				status: 200,
				body: 'Nothing to see here.'
			});

			return request({
				resource: {},
				format: null
			}).then(response => {
				assert.instanceOf(response, RawApiResponse);
				assert.strictEqual(response.raw.status, 200);
				assert.strictEqual(response.raw.url, 'https://api.zotero.org/');
				assert.strictEqual(response.raw.body, 'Nothing to see here.');
				assert.strictEqual(response.raw.bodyUsed, false);
			});
		});
	});

	describe('Item write & delete requests', () => {
		it('should post a single item', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items'));
					assert.strictEqual(opts.method, 'POST');
					return true;
				}, {
				headers: {
					'Last-Modified-Version': 1337
				},
				body: multiSuccessWriteResponseFixture
			});

			const item ={
				'key': 'AZBCAADA',
				'version': 0,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			return request({
				method: 'post',
				body: [item],
				resource: {
					library: 'u475425',
					items: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiWriteResponse);
				assert.strictEqual(response.getResponseType(), 'MultiWriteResponse');
				assert.isOk(response.isSuccess());
				assert.strictEqual(response.getData()[0].key, 'AZBCAADA');
				assert.strictEqual(response.getData()[0].title, 'My Amazing Book');
				assert.strictEqual(response.getData()[0].itemType, 'book');
				assert.strictEqual(response.getData()[0].version, 1337);
			});
		});

		it('should use new data from successful write response', () => {
			const item ={
				'version': 0,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			fetchMock.post( (url) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items'));
					return true;
				}, {
				headers: {
					'Last-Modified-Version': 1337
				},
				body: {
					...multiSuccessWriteResponseFixture,
					successful: {
						"0": {
							data: {
								...item,
								version: 1337,
								key: 'AZBCAADA',
								dateAdded: "2018-07-05T09:24:36Z",
								dateModified: "2018-07-05T09:24:36Z",
								tags: [],
								relations: {}
							},
							meta: {
								parsedDate: "1987"
							},
							links: {
								self: {
									href: 'https://api.zotero.org/users/475425/items/AZBCAADA'
								}
							},
						}
					}
				}
			});
			
			return request({
				method: 'post',
				body: [item],
				resource: {
					library: 'u475425',
					items: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiWriteResponse);
				assert.strictEqual(response.getResponseType(), 'MultiWriteResponse');
				assert.isOk(response.isSuccess());
				assert.strictEqual(response.getData()[0].key, 'AZBCAADA');
				assert.strictEqual(response.getData()[0].title, 'My Amazing Book');
				assert.strictEqual(response.getData()[0].dateAdded, '2018-07-05T09:24:36Z');
				assert.strictEqual(response.getData()[0].dateModified, '2018-07-05T09:24:36Z');
				assert.strictEqual(response.getData()[0].version, 1337);
				assert.notProperty(response.getData()[0], 'meta');
				assert.strictEqual(response.getMeta()[0].parsedDate, "1987");
				assert.strictEqual(response.getLinks()[0].self.href, "https://api.zotero.org/users/475425/items/AZBCAADA");
			});
		});

		it('should post multiple items and handle mixed response', () => {
			const book = {
				'key': 'ABCD1111',
				'version': 0,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			const bug1 = {
				'key': 'ABCD4444',
				'version': 0
			}

			const paper = {
				'key': 'ABCD2222',
				'version': 0,
				'itemType': 'journalArticle',
				'title': 'My super paper'
			};

			const bug2 = {
				'key': 'ABCD5555',
				'version': 0
			}

			const unchanged = {
				'key': 'ABCD3333',
				'version': 0,
				'itemType': 'journalArticle',
				'title': 'My super paper'
			};

			const serverSideData = { 
				dateAdded: "2018-07-05T09:24:36Z",
				dateModified: "2018-07-05T09:24:36Z",
				tags: [],
				relations: {}
			};

			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items'));
					assert.strictEqual(opts.method, 'POST');
					return true;
				}, {
				headers: {
					'Last-Modified-Version': 1337
				},
				body: {
					...multiMixedWriteResponseFixture,
					"successful": {
						// add server side data to one of the responses
						"0": { 
							data: {
							...book, ...serverSideData
							},
							meta: {
								parsedDate: "1987"
							},
							links: {},
						}
					}
				}
			});

			return request({
				method: 'post',
				body: [book, bug1, paper, bug2, unchanged],
				resource: {
					library: 'u475425',
					items: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiWriteResponse);
				assert.strictEqual(response.getVersion(), 1337);
				assert.isNotOk(response.isSuccess());

				assert.strictEqual(response.getData().length, 5);
				assert.strictEqual(response.getData()[0].version, 1337); // successful
				assert.strictEqual(response.getData()[1].version, 0); // failed
				assert.strictEqual(response.getData()[4].version, 0); // unchanged

				assert.strictEqual(response.getErrors()[1].message, 'Bad input');
				assert.strictEqual(response.getErrors()[3].message, 'Bad input');

				assert.strictEqual(response.getEntityByIndex(0).dateModified, serverSideData.dateModified);
				assert.notProperty(response.getEntityByIndex(0), 'meta');
				assert.strictEqual(response.getEntityByIndex('2').key, 'ABCD2222');
				assert.strictEqual(response.getEntityByIndex(2).version, 1337);
				assert.strictEqual(response.getEntityByIndex(4).key, 'ABCD3333');
				assert.strictEqual(response.getEntityByIndex(4).version, 0);

				assert.strictEqual(response.getMeta()[0].parsedDate, "1987");
				assert.strictEqual(response.getMeta()[2], null);
				assert.deepEqual(response.getLinks()[0], {});
				assert.strictEqual(response.getLinks()[2], null);

				assert.throws(response.getEntityByIndex.bind(response, 1), /400: Bad input/);
				assert.throws(response.getEntityByIndex.bind(response, 10), /Index 10 is not present in the reponse/);
				assert.throws(response.getEntityByKey.bind(response, 'ABCD5555'), /400: Bad input/);
				assert.throws(response.getEntityByKey.bind(response, 'LORE1234'), /Key LORE1234 is not present in the request/);
			});
		});

		it('should update put a single, complete item', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
					assert.strictEqual(opts.method, 'PUT');
					return true;
				}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 42
				}
			});

			const book = {
				'key': 'ABCD1111',
				'version': 41,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			return request({
				method: 'put',
				body: book,
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				}
			}).then(response => {
				assert.instanceOf(response, SingleWriteResponse);
				assert.strictEqual(response.getResponseType(), 'SingleWriteResponse');
				assert.strictEqual(response.getVersion(), 42);
				assert.strictEqual(response.getData().version, 42);
				assert.strictEqual(response.getData().key, 'ABCD1111');
				assert.strictEqual(response.response.status, 204);
				assert.isNull(response.raw);
			});
		});

		it('should patch a single item', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
					assert.strictEqual(opts.method, 'PATCH');
					return true;
				}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 42
				}
			});

			const patch = {
				'version': 41,
				'title': 'My Amazing Book'
			};

			return request({
				method: 'patch',
				body: patch,
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				}
			}).then(response => {
				assert.instanceOf(response, SingleWriteResponse);
				assert.strictEqual(response.getVersion(), 42);
				assert.strictEqual(response.getData().version, 42);
				assert.strictEqual(response.getData().title, 'My Amazing Book');
				assert.strictEqual(response.response.status, 204);
				assert.isNull(response.raw);
			});
		});

		it('should delete a single item', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
					assert.strictEqual(opts.method, 'DELETE');
					return true;
				}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 43
				}
			});

			return request({
				method: 'delete',
				ifUnmodifiedSinceVersion: 42,
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				}
			}).then(response => {
				assert.instanceOf(response, DeleteResponse);
				assert.strictEqual(response.getResponseType(), 'DeleteResponse');
				assert.strictEqual(response.getVersion(), 43);
				assert.strictEqual(response.response.status, 204);
				assert.isNull(response.raw);
			});
		});

		it('should delete multiple items', () => {
			fetchMock.mock( (url, opts) => {
					assert.strictEqual(opts.method, 'DELETE');
					let parsedUrl = URL.parse(url);
					parsedUrl = parsedUrl.search.slice(1);
					parsedUrl = parsedUrl.split('&');
					assert.isOk(parsedUrl.includes('itemKey=ABCD1111,ABCD2222,ABCD3333'));
					return true;
				}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 100
				}
			});

			return request({
				method: 'delete',
				ifUnmodifiedSinceVersion: 99,
				itemKey: ['ABCD1111', 'ABCD2222', 'ABCD3333'],
				resource: {
					library: 'u475425'
				}
			}).then(response => {
				assert.instanceOf(response, DeleteResponse);
				assert.strictEqual(response.getVersion(), 100);
				assert.strictEqual(response.response.status, 204);
				assert.isNull(response.raw);
			});
		});
	});

	describe('Failing write & delete requests', () => {
		it('should throw ErrorResponse for error post responses', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
					assert.strictEqual(opts.method, 'PUT');
					return true;
				}, {
				status: 400,
				body: 'Uploaded data must be a JSON array'
			});

			return request({
				method: 'put',
				body: {},
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				}
			}).then(() => {
				throw new Error('fail');
			}).catch(error => {
				assert.instanceOf(error, ErrorResponse);
				assert.strictEqual(error.message, '400: Bad Request');
				assert.strictEqual(error.reason, 'Uploaded data must be a JSON array');
			})
		});

		it('should throw ErrorResponse for error put responses', () => {
			fetchMock.mock( (url, opts) => {
					assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
					assert.strictEqual(opts.method, 'PUT');
					return true;
				}, {
				status: 412,
				body: 'Item has been modified since specified version (expected 42, found 41)'
			});

			return request({
				method: 'put',
				body: {},
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				}
			}).then(() => {
				throw new Error('fail');
			}).catch(error => {
				assert.instanceOf(error, ErrorResponse);
				assert.strictEqual(error.message, '412: Precondition Failed');
				assert.strictEqual(error.reason, 'Item has been modified since specified version (expected 42, found 41)');
			})
		});

		it('should forward previous response if present (play nicely with other executors)', () => {
			const previousResponse = new ApiResponse({ foo: 'bar' }, {}, {});
			return request({
				method: 'get',
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				},
				response: previousResponse
			}).then(response => {
				assert.strictEqual(response.getData().foo, 'bar');
			});
		});
	});

	describe('File upload', () => {
		let fileUploadRequest = {
			method: 'post',
			resource: {
				library: 'u475425',
				items: 'ABCD1111',
				file: null
			},
			format: null,
			file: FILE,
			body: undefined,
			fileName: FILE_NAME,
			contentType: 'application/x-www-form-urlencoded',
		};
		it('should perform 3-step file upload procedure ', () => {
			let counter = 0; 
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', (url, options) => {
				var config = options.body.split('&').reduce(
					(acc, val) => { 
						acc[val.split('=')[0]] = val.split('=')[1];
						return acc
					}, {}
				);
				switch(counter++) {
					case 0:
						assert.propertyVal(config, 'md5', FILE_MD5);
						assert.propertyVal(config, 'filename', FILE_NAME);
						assert.propertyVal(config, 'filesize', FILE_SIZE.toString());
						assert.property(config, 'mtime');
						return {
							'url': 'https://storage.zotero.org',
							'contentType': 'text/plain',
							'prefix': 'some prefix',
							'suffix': 'some suffix',
							'uploadKey': 'some key',
						};
					case 1:
						assert.propertyVal(config, 'upload', 'some key');
						return {
							status: 204
						};
					default:
						throw(new Error(`This is ${counter + 1} request to ${url}. Only expected 2 requests.`));
				}
			});
			fetchMock.once('https://storage.zotero.org', (url, options) => {
				assert.strictEqual(counter, 1);
				assert.strictEqual(options.body.byteLength, 33);
				return {
					status: 201
				};
			});
			return request({ ...fileUploadRequest }).then(response => {
				assert.strictEqual(response.getResponseType(), 'FileUploadResponse');
				assert.instanceOf(response, FileUploadResponse);
				assert.isNotOk(response.getData().exists);
			});
		});
		it('should handle { exists: 1 } response in stage 1', () => {
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				exists: 1
			});
			return request({ ...fileUploadRequest })
				.then(response => {
					assert.instanceOf(response, FileUploadResponse);
					assert.isOk(response.getData().exists);
				});
		});
		it('should detect invalid config', () => {
			return request({
				...fileUploadRequest,
				body: 'should not be here'
			}).then(() => {
				throw new Error('fail');
			}).catch(error => {
				assert.instanceOf(error, Error);
				assert.include(error.toString(), 'Cannot use both');
			})
		});
		it('should handle error reponse in stage 1', () => {
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				status: 409,
				body: 'The target library is locked.'
			});
			return request({ ...fileUploadRequest })
				.then(() => {
					throw new Error('fail');
				}).catch(error => {
					assert.instanceOf(error, ErrorResponse);
					assert.strictEqual(error.message, 'Upload stage 1: 409: Conflict');
					assert.strictEqual(error.reason, 'The target library is locked.');
				});
		});
		it('should handle error reponse in stage 2', () => {
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				'url': 'https://storage.zotero.org',
				'contentType': 'text/plain',
				'prefix': 'some prefix',
				'suffix': 'some suffix',
				'uploadKey': 'some key',
			});
			fetchMock.once('https://storage.zotero.org', {
				status: 400,
				body: 'Something wrong'
			});
			return request({ ...fileUploadRequest })
				.then(() => {
					throw new Error('fail');
				}).catch(error => {
					assert.instanceOf(error, ErrorResponse);
					assert.strictEqual(error.message, 'Upload stage 2: 400: Bad Request');
					assert.strictEqual(error.reason, 'Something wrong');
				});
		});
		it('should handle error reponse in stage 3', () => {
			let counter = 0;
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', () => {
				return counter++ == 0 ? {
					'url': 'https://storage.zotero.org',
					'contentType': 'text/plain',
					'prefix': 'some prefix',
					'suffix': 'some suffix',
					'uploadKey': 'some key',
				} : {
					status: 412,
					body: 'The file has changed remotely since retrieval'
				}
			});
			fetchMock.once('https://storage.zotero.org', {
				status: 201
			});
			return request({ ...fileUploadRequest })
				.then(() => {
					throw new Error('fail');
				}).catch(error => {
					assert.instanceOf(error, ErrorResponse);
					assert.strictEqual(error.message, 'Upload stage 3: 412: Precondition Failed');
					assert.strictEqual(error.reason, 'The file has changed remotely since retrieval');
				});
		});
	});
	describe("File download", () => {
		it('should download a file', () => {
			fetchMock.get('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				headers: {
					contentType: 'text/plain'
				},
				body: 'lorem ipsum'
			});
			return request({
				method: 'get',
				format: null,
				resource: {
					library: 'u475425',
					items: 'ABCD1111',
					file: null
				}
			}).then(response => {
				assert.instanceOf(response, FileDownloadResponse);
				assert.strictEqual(response.getResponseType(), 'FileDownloadResponse');
				assert.strictEqual(response.getData().byteLength, 11);
				assert.strictEqual(
					Array.from(
						(new Uint8ClampedArray(response.getData())))
							.map(b => String.fromCharCode(b))
							.join(''),
					'lorem ipsum'
				);
			});
		});
		it('should obtain a temporary, authorised file url', () => {
			fetchMock.get('https://api.zotero.org/users/475425/items/ABCD1111/file/view', {
				status: 302,
				headers: {
					'Location': 'https://files.zotero.org/some-file'
				}
			});
			return request({
				method: 'get',
				format: null,
				redirect: 'manual',
				resource: {
					library: 'u475425',
					items: 'ABCD1111',
					fileUrl: null
				}
			}).then(response => {
				assert.instanceOf(response, FileUrlResponse);
				assert.strictEqual(response.getResponseType(), 'FileUrlResponse');
				assert.strictEqual(response.getData(), 'https://files.zotero.org/some-file');
			});
		});
	})
});