/* eslint-env mocha */
import fetchMock from 'fetch-mock';
import { assert } from 'chai';
import _request from '../src/request.js';
import {
	ApiResponse, DeleteResponse, ErrorResponse, FileDownloadResponse, FileUploadResponse,
	FileUrlResponse, MultiReadResponse, MultiWriteResponse, PretendResponse, RawApiResponse,
	SchemaResponse, SingleReadResponse, SingleWriteResponse,
} from '../src/response.js';

import singleGetResponseFixture from './fixtures/single-object-get-response.js';
import multiGetResponseFixture from './fixtures/multi-object-get-response.js';
import tagsResponseFixture from './fixtures/tags-data-response.js';
import searchesResponseFixture from './fixtures/searches-data-response.js';
import itemTypesDataFixture from './fixtures/item-types-data.js';
import multiMixedWriteResponseFixture from './fixtures/multi-mixed-write-response.js';
import multiSuccessWriteResponseFixture from './fixtures/multi-success-write-response.js';
import settingsReponseFixture from './fixtures/settings-response.js';
import keysCurrentResponse from './fixtures/keys-current-response.js';
import userGroupsFixture from './fixtures/user-groups-response.js';

const FILE = Uint8ClampedArray.from('lorem ipsum'.split('').map(e => e.charCodeAt(0))).buffer;
const FILE_MD5 = '80a751fde577028640c419000e33eba6';
const FILE_NAME = 'test.txt';
const NEW_FILE = Uint8ClampedArray.from('lorem dolot ipsum'.split('').map(e => e.charCodeAt(0))).buffer;
const NEW_FILE_MD5 = '0293973cad1be8dbda55d94c53069865';
const FILE_PATCH = new Uint8Array(28);
const API_KEY = 'test';

const request = async (opts) => {
	var config = await _request(opts);
	return 'response' in config && config.response || undefined;
}

describe('ZoteroJS request', () => {
	beforeEach(() => {
		fetchMock.config.overwriteRoutes = false;
		fetchMock.catch(request => {
			throw (new Error(`A request to ${request} was not expected`));
		});
	});

	afterEach(() => fetchMock.restore());

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

		it('should get schema', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/schema',
				{ version: 26, itemTypes: [], meta: {}, csl: {}, locales: {}, }
			);

			return request({
				resource: {
					schema: null
				}
			}).then(response => {
				assert.instanceOf(response, SchemaResponse);
				assert.strictEqual(response.getResponseType(), 'SchemaResponse');
				assert.strictEqual(response.getData().version, 26);
				assert.strictEqual(response.getVersion(), 26);
				assert.isNull(response.getLinks());
				assert.isNull(response.getMeta());
			});
		})

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

		it('should get annotation template', () => {
			fetchMock.mock(
				url => {
					return url.startsWith('https://api.zotero.org/items/new') &&
						[
							['itemType', 'annotation'],
							['annotationType', 'highlight']
						].every(([q, v]) => url.match(new RegExp(`\\b${q}=${v}\\b`)));
				}, {
				itemType: 'annotation',
				annotationType: 'highlight'
			}
			);

			return request({
				resource: {
					template: null
				},
				itemType: 'annotation',
				annotationType: 'highlight'
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getData().itemType, 'annotation');
				assert.strictEqual(Object.keys(response.getData()).length, 2);
			});
		});
	});

	describe('Item read requests', () => {
		it('should get a single item', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/X42A7DEE',
				{
					headers: { 'Last-Modified-Version': 1 },
					body: singleGetResponseFixture
				}
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
				assert.strictEqual(response.getVersion(), 1);
				assert.strictEqual(Object.keys(response.getLinks()).length, 2);
				assert.strictEqual(response.getData().key, 'X42A7DEE');
			});
		});

		it('should get /top items from a user library', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/top'));
				assert.strictEqual(opts.method, 'GET');
				return true;
			}, {
				headers: {
					'Last-Modified-Version': 1337,
					'Total-Results': 15,
					'Link': '<https://api.zotero.org/users/475425/items/top?start=15>; rel="next", <https://api.zotero.org/users/475425/items/top?start=150>; rel="last", <https://www.zotero.org/users/475425/items/top>; rel="alternate"'
				},
				body: multiGetResponseFixture
			});

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
				assert.strictEqual(response.getVersion(), 1337);
				assert.strictEqual(response.getMeta().length, 15);
				assert.deepEqual(response.getRelLinks(), {
					next: 'https://api.zotero.org/users/475425/items/top?start=15',
					last: 'https://api.zotero.org/users/475425/items/top?start=150',
					alternate: 'https://www.zotero.org/users/475425/items/top'
				});
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
					let parsedUrl = new URL(url);
					parsedUrl = parsedUrl.search.slice(1);
					parsedUrl = parsedUrl.split('&');
					if (!parsedUrl.includes('sort=title')) {
						return false;
					}
					if (!parsedUrl.includes('direction=asc')) {
						return false;
					}
					if (!parsedUrl.includes('limit=50')) {
						return false;
					}
					if (!parsedUrl.includes('start=25')) {
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
					let parsedUrl = new URL(url);
					parsedUrl = parsedUrl.search.slice(1);
					parsedUrl = parsedUrl.split('&');
					if (!parsedUrl.includes('itemKey=N7W92H48')) {
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

		it('should handle multiple response with missing headers', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/top'));
				assert.strictEqual(opts.method, 'GET');
				return true;
			}, {
				headers: {},
				body: multiGetResponseFixture
			});

			return request({
				resource: {
					library: 'u475425',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.deepEqual(response.getRelLinks(), {});
				assert.isNull(response.getTotalResults());
				assert.isNull(response.getVersion());
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

		it('should get individual keys from settings', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/settings/tagColors',
				settingsReponseFixture.tagColors
			);

			return request({
				resource: {
					library: 'u475425',
					settings: 'tagColors',
				}
			}).then(response => {
				assert.instanceOf(response, SingleReadResponse);
				assert.strictEqual(response.getResponseType(), 'SingleReadResponse');
				assert.lengthOf(response.getData().value, 2);
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

		it('should get deleted content', () => {
			const responseRaw = {
				'collections': [],
				'items': ['AABBCCDD'],
				'searches': [],
				'tags': [],
				'settings': []
			};

			fetchMock.once(
				/https:\/\/api.zotero.org\/users\/475425\/?.*?since=42/i,
				responseRaw
			);

			return request({
				resource: {
					library: 'u475425',
					deleted: null,
				},
				since: 42
			}).then(response => {
				assert.instanceOf(response, SingleReadResponse);
				assert.strictEqual(response.getResponseType(), 'SingleReadResponse');
				assert.deepEqual(response.getData(), responseRaw);
			});
		});

		it('should only return url and config if pretend = true', () => {
			return request({
				resource: {
					library: 'u475425',
					collections: 'N7W92H48',
					items: null,
					top: null,
				},
				start: 100,
				limit: 50,
				ifUnmodifiedSinceVersion: 42,
				pretend: true
			}).then(response => {
				assert.instanceOf(response, PretendResponse);
				assert.strictEqual(response.getResponseType(), 'PretendResponse');
				assert.isNull(response.getVersion());
				const { url, fetchConfig } = response.getData();
				assert.include(url, 'https://api.zotero.org/users/475425/collections/N7W92H48/items/top')
				assert.include(url, 'format=json')
				assert.include(url, 'start=100')
				assert.include(url, 'limit=50')
				assert.strictEqual(fetchConfig.method, 'GET');
				assert.strictEqual(fetchConfig.headers['If-Unmodified-Since-Version'], 42);
			});
		});

		it('should verify key access', () => {
			fetchMock.mock(
				'begin:https://api.zotero.org/keys/current',
				keysCurrentResponse
			);

			return request({
				resource: { verifyKeyAccess: null }
			}).then(response => {
				assert.instanceOf(response, ApiResponse);
				assert.strictEqual(response.getResponseType(), 'ApiResponse');
				assert.deepEqual(response.getData(), keysCurrentResponse);
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
					assert.strictEqual(opts.headers['Zotero-Schema-Version'], 29);
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
				'ifUnmodifiedSinceVersion': 1,
				'contentType': 'c',
				'zoteroSchemaVersion': 29
			});
		});

		it('should not include unnecessary headers', () => {
			fetchMock.mock(
				(url, opts) => {
					assert.property(opts, 'headers');
					assert.notProperty(opts.headers, 'Authorization');
					assert.notProperty(opts.headers, 'Zotero-Write-Token');
					assert.notProperty(opts.headers, 'If-Modified-Since-Version');
					assert.notProperty(opts.headers, 'If-Unmodified-Since-Version');
					assert.notProperty(opts.headers, 'Content-Type');
					assert.notProperty(opts.headers, 'Zotero-Schema-Version');
					return true;
				}, {}
			);

			return request({
				resource: {
					schema: null,
				},
			});
		});

		it('should include query params in the request', () => {
			fetchMock.mock(
				url => {
					return [
						'collectionKey', 'content', 'direction', 'format', 'include', 'includeTrashed',
						'itemKey', 'itemType', 'limit', 'q', 'qmode', 'searchKey', 'since', 'sort',
						'start', 'style', 'tag'
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
				includeTrashed: 'includeTrashed',
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
				assert.isNull(error.getVersion());
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
				assert.property(response.raw, 'body');
				assert.strictEqual(response.raw.bodyUsed, false);
			});
		});

		it('should retry request on error if configured to do so', async () => {
			fetchMock.mock('begin:https://api.zotero.org/users/475425/items/top', {
				status: 500,
				body: 'Nope'
			}, { repeat: 2 });
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/top',
				multiGetResponseFixture,
				{ repeat: 1 }
			);

			return request({
				retry: 2,
				resource: {
					library: 'u475425',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.options.retryCount, 2);
			});
		}, 4000) // timeout 4s: first retry after 1 sec, second after further 2 sec, 1 sec for everything else

		it('should retry request on error immediately configured to do so', async () => {
			fetchMock.mock('begin:https://api.zotero.org/users/475425/items/top', {
				status: 500,
				body: 'Nope'
			}, { repeat: 5 });
			fetchMock.mock(
				'begin:https://api.zotero.org/users/475425/items/top',
				multiGetResponseFixture,
				{ repeat: 1 }
			);

			return request({
				retry: 6,
				retryDelay: 0,
				resource: {
					library: 'u475425',
					items: null,
					top: null
				}
			}).then(response => {
				assert.instanceOf(response, MultiReadResponse);
				assert.strictEqual(response.getResponseType(), 'MultiReadResponse');
				assert.strictEqual(response.options.retryCount, 5);
			});
		})
	});

	describe('Item write & delete requests', () => {
		it('should post a single item', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items'));
				assert.strictEqual(opts.method, 'POST');
				assert.propertyVal(opts.headers, 'Content-Type', 'application/json');
				return true;
			}, {
				headers: {
					'Last-Modified-Version': 1337
				},
				body: multiSuccessWriteResponseFixture
			});

			const item = {
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
				assert.strictEqual(response.getVersion(), 1337);
				assert.strictEqual(response.getData()[0].key, 'AZBCAADA');
				assert.strictEqual(response.getData()[0].title, 'My Amazing Book');
				assert.strictEqual(response.getData()[0].itemType, 'book');
				assert.strictEqual(response.getData()[0].version, 1337);
				assert.deepEqual(response.getLinks()[0], null);
				assert.deepEqual(response.getMeta()[0], null);
			});
		});

		it('should use new data from successful write response', () => {
			const item = {
				'version': 0,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			fetchMock.post((url) => {
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

		it('should accept response with new data but no meta or links', async () => {
			const item = {
				'version': 0,
				'itemType': 'book',
				'title': 'My Amazing Book'
			};

			fetchMock.post((url) => {
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
							}
						}
					}
				}
			});

			const response = await request({
				method: 'post',
				body: [item],
				resource: {
					library: 'u475425',
					items: null
				}
			});
			assert.instanceOf(response, MultiWriteResponse);
			assert.strictEqual(response.getResponseType(), 'MultiWriteResponse');
			assert.isOk(response.isSuccess());
			assert.strictEqual(response.getData()[0].key, 'AZBCAADA');
			assert.strictEqual(response.getData()[0].title, 'My Amazing Book');
			assert.isNull(response.getMeta()[0]);
			assert.isNull(response.getLinks()[0]);
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

			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items'));
				assert.strictEqual(opts.method, 'POST');
				assert.propertyVal(opts.headers, 'Content-Type', 'application/json');
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
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
				assert.strictEqual(opts.method, 'PUT');
				assert.propertyVal(opts.headers, 'Content-Type', 'application/json');
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
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
				assert.strictEqual(opts.method, 'PATCH');
				assert.propertyVal(opts.headers, 'Content-Type', 'application/json');
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
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
				assert.strictEqual(opts.method, 'DELETE');
				assert.notProperty(opts.headers, 'Content-Type');
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
			fetchMock.mock((url, opts) => {
				assert.strictEqual(opts.method, 'DELETE');
				let parsedUrl = new URL(url);
				parsedUrl = parsedUrl.search.slice(1);
				parsedUrl = parsedUrl.split('&');
				assert.isOk(parsedUrl.includes('itemKey=ABCD1111%2CABCD2222%2CABCD3333'));
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

		it('should post updated library settings', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/settings'));
				assert.strictEqual(opts.method, 'POST');
				assert.equal(opts.body, JSON.stringify(newSettings));
				return true;
			}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 3483
				}
			});

			const newSettings = {
				tagColors: {
					value: [{
						"name": "test-tag",
						"color": "#ffcc00"
					}]
				}
			};

			return request({
				method: 'post',
				body: newSettings,
				resource: {
					library: 'u475425',
					settings: null
				}
			}).then(response => {
				assert.instanceOf(response, SingleWriteResponse);
				assert.strictEqual(response.getResponseType(), 'SingleWriteResponse');
				assert.strictEqual(response.response.status, 204);
			});
		});

		it('should put individual updated keys into library settings', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/settings/tagColors'));
				assert.strictEqual(opts.method, 'PUT');
				assert.equal(opts.body, JSON.stringify(newSettings));
				return true;
			}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 3483
				}
			});

			const newSettings = {
				value: [{
					"name": "test-tag",
					"color": "#ffcc00"
				}]
			};

			return request({
				method: 'put',
				body: newSettings,
				resource: {
					library: 'u475425',
					settings: 'tagColors'
				}
			}).then(response => {
				assert.instanceOf(response, SingleWriteResponse);
				assert.strictEqual(response.getResponseType(), 'SingleWriteResponse');
				assert.strictEqual(response.response.status, 204);
			});
		});

		it('should delete individual keys from library settings', () => {
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/settings/tagColors'));
				assert.strictEqual(opts.method, 'DELETE');
				return true;
			}, {
				status: 204,
				headers: {
					'Last-Modified-Version': 1234
				}
			});

			return request({
				method: 'delete',
				resource: {
					library: 'u475425',
					settings: 'tagColors'
				}
			}).then(response => {
				assert.instanceOf(response, DeleteResponse);
				assert.strictEqual(response.getVersion(), 1234);
				assert.strictEqual(response.response.status, 204);
				assert.isNull(response.raw);
			});
		});

		it('should override default headers based on config', () => {
			fetchMock.mock(
				(url, opts) => {
					assert.property(opts, 'headers');
					assert.strictEqual(opts.method, 'PUT');
					assert.strictEqual(opts.headers['Content-Type'], 'text-plain');
					return true;
				}, {}
			);

			return request({
				method: 'put',
				body: '',
				resource: {
					library: 'u475425',
					settings: 'test'
				},
				'contentType': 'text-plain'
			});
		});
	});

	describe('Failing write & delete requests', () => {
		it('should throw ErrorResponse for error post responses', () => {
			fetchMock.mock((url, opts) => {
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
			fetchMock.mock((url, opts) => {
				assert.isOk(url.startsWith('https://api.zotero.org/users/475425/items/ABCD1111'));
				assert.strictEqual(opts.method, 'PUT');
				return true;
			}, {
				headers: {
					'Last-Modified-Version': 41
				},
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
				assert.strictEqual(error.getVersion(), 41);
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
			zoteroApiKey: API_KEY
		};

		let filePatchFullRequest = {
			method: 'post',
			resource: {
				library: 'u475425',
				items: 'ABCD1111',
				file: null
			},
			format: null,
			file: NEW_FILE,
			ifMatch: FILE_MD5, // old file's md5
			body: undefined,
			fileName: FILE_NAME,
			contentType: 'application/x-www-form-urlencoded',
			zoteroApiKey: API_KEY
		};

		let filePatchPartialRequest = {
			method: 'patch',
			resource: {
				library: 'u475425',
				items: 'ABCD1111',
				file: null
			},
			format: null,
			file: NEW_FILE,
			ifMatch: FILE_MD5, // old file's md5
			body: undefined,
			fileName: FILE_NAME,
			contentType: 'application/x-www-form-urlencoded',
			filePatch: FILE_PATCH,
			algorithm: 'xdelta',
			zoteroApiKey: API_KEY
		};
		it('should upload a new file', () => {
			let counter = 0;
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', (url, options) => {
				var config = options.body.split('&').reduce(
					(acc, val) => {
						acc[val.split('=')[0]] = val.split('=')[1];
						return acc
					}, {}
				);
				switch (counter++) {
					case 0:
						// first request: upload authorization
						assert.propertyVal(config, 'md5', FILE_MD5);
						assert.propertyVal(config, 'filename', FILE_NAME);
						assert.propertyVal(config, 'filesize', FILE.byteLength.toString());
						assert.property(config, 'mtime');
						return {
							'url': 'https://storage.zotero.org',
							'contentType': 'text/plain',
							'prefix': 'some prefix',
							'suffix': 'some suffix',
							'uploadKey': 'some key',
						};
					case 1:
						// final request: register upload
						assert.propertyVal(config, 'upload', 'some key');
						return {
							status: 204,
							headers: {
								'Last-Modified-Version': 42
							}
						};
					default:
						throw (new Error(`This is ${counter + 1} request to ${url}. Only expected 2 requests.`));
				}
			});
			// second request: upload file to storage
			fetchMock.once('https://storage.zotero.org', (url, options) => {
				assert.strictEqual(counter, 1);
				assert.strictEqual(options.body.byteLength, 33);
				return {
					status: 201
				};
			});
			return request({ ...fileUploadRequest }).then(response => {
				assert.instanceOf(response, FileUploadResponse);
				assert.strictEqual(response.getResponseType(), 'FileUploadResponse');
				assert.strictEqual(response.getVersion(), 42);
				assert.isNotOk(response.getData().exists);
			});
		});

		it('should update a file, using partial upload', () => {
			let counter = 0;
			fetchMock.mock('begin:https://api.zotero.org/users/475425/items/ABCD1111/file', (url, options) => {
				const config = (counter === 0 || counter == 2) && options.body.split('&').reduce(
					(acc, val) => {
						acc[val.split('=')[0]] = val.split('=')[1];
						return acc
					}, {}
				);
				const parsedUrl = new URL(url);
				assert.strictEqual(options.headers['Zotero-API-Key'], API_KEY);
				switch (counter++) {
					case 0:
						// first request: upload authorization
						assert.strictEqual(options.method, 'POST');
						assert.strictEqual(options.headers['If-Match'], FILE_MD5);
						assert.strictEqual(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
						assert.propertyVal(config, 'md5', NEW_FILE_MD5);
						assert.propertyVal(config, 'filename', FILE_NAME);
						assert.propertyVal(config, 'filesize', NEW_FILE.byteLength.toString());
						assert.property(config, 'mtime');
						return {
							headers: {
								'Last-Modified-Version': 42
							},
							body: {
								'url': 'https://storage.zotero.org',
								'contentType': 'text/plain',
								'prefix': 'some prefix',
								'suffix': 'some suffix',
								'uploadKey': 'some key',
							}
						};
					case 1:
						// second (last) request: upload file patch
						assert.strictEqual(options.method, 'PATCH');
						assert.strictEqual(parsedUrl.searchParams.get('algorithm'), 'xdelta');
						assert.strictEqual(parsedUrl.searchParams.get('upload'), 'some key');
						assert.strictEqual(options.headers['If-Match'], FILE_MD5);
						assert.strictEqual(options.body.byteLength, 28); // xdelta patch size
						return {
							status: 204
						};
					default:
						throw (new Error(`Counted ${counter} requests to ${url}. Only expected 2 requests.`));
				}
			});
			return request(filePatchPartialRequest).then(response => {
				assert.instanceOf(response, FileUploadResponse);
				assert.strictEqual(response.getResponseType(), 'FileUploadResponse');
				assert.strictEqual(response.getVersion(), 42);
				assert.isNotOk(response.getData().exists);
			});
		});

		it('should update a file, using full upload', () => {
			let counter = 0;
			fetchMock.mock('https://api.zotero.org/users/475425/items/ABCD1111/file', (url, options) => {
				var config = options.body.split('&').reduce(
					(acc, val) => {
						acc[val.split('=')[0]] = val.split('=')[1];
						return acc
					}, {}
				);
				switch (counter++) {
					case 0:
						// first request: upload authorization
						assert.strictEqual(options.method, 'POST');
						assert.strictEqual(options.headers['If-Match'], FILE_MD5);
						assert.strictEqual(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
						assert.propertyVal(config, 'md5', NEW_FILE_MD5);
						assert.propertyVal(config, 'filename', FILE_NAME);
						assert.propertyVal(config, 'filesize', NEW_FILE.byteLength.toString());
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
							status: 204,
							headers: {
								'Last-Modified-Version': 42
							}
						};
					default:
						throw (new Error(`Counted ${counter} requests to ${url}. Only expected 2 requests.`));
				}
			});
			fetchMock.once('https://storage.zotero.org', (url, options) => {
				assert.strictEqual(counter, 1);
				assert.strictEqual(options.body.byteLength, NEW_FILE.byteLength + 'some prefix'.length + 'some suffix'.length);
				return {
					status: 201
				};
			});
			return request({ ...filePatchFullRequest }).then(response => {
				assert.instanceOf(response, FileUploadResponse);
				assert.strictEqual(response.getResponseType(), 'FileUploadResponse');
				assert.strictEqual(response.getVersion(), 42);
				assert.isNotOk(response.getData().exists);
			});
		});

		it('should handle { exists: 1 } response in stage 1', () => {
			fetchMock.once('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				headers: {
					'Last-Modified-Version': 42,
				},
				body: { exists: 1 }
			});
			return request({ ...fileUploadRequest })
				.then(response => {
					assert.instanceOf(response, FileUploadResponse);
					assert.strictEqual(response.getVersion(), 42);
					assert.isOk(response.getData().exists);
				});
		});
		it('should detect invalid config: body and file', () => {
			return request({
				...fileUploadRequest,
				body: 'should not be here'
			}).then(() => {
				throw new Error('fail');
			}).catch(error => {
				assert.instanceOf(error, Error);
				assert.match(error.toString(), /Cannot use both "file" and "body" in a single request./);
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

		let fileRegisterRequest = {
			method: 'post',
			resource: {
				library: 'u475425',
				items: 'ABCD1111',
				file: null
			},
			body: undefined,
			contentType: 'application/x-www-form-urlencoded',
			fileName: FILE_NAME,
			fileSize: 424242,
			format: null,
			md5sum: '9edb2ca32f7b57662acbc112a80cc59d',
			mtime: 12345,
			uploadRegisterOnly: true,
		};

		it('should only attempt to register file if requested', () => {
			fetchMock.once('https://api.zotero.org/users/475425/items/ABCD1111/file', (url, options) => {
				assert.strictEqual(options.body, 'md5=9edb2ca32f7b57662acbc112a80cc59d&filename=test.txt&filesize=424242&mtime=12345');
				return {
					headers: {
						'Last-Modified-Version': 42,
					},
					body: { exists: 1 }
				};
			});

			return request({ ...fileRegisterRequest })
				.then(response => {
					assert.instanceOf(response, FileUploadResponse);
					assert.strictEqual(response.getVersion(), 42);
					assert.isOk(response.getData().exists);
				});
		});

		it('should handle error if attempting to register file that does not exist', () => {
			fetchMock.once('https://api.zotero.org/users/475425/items/ABCD1111/file', {
				'url': 'https://storage.zotero.org',
				'contentType': 'text/plain',
				'prefix': 'some prefix',
				'suffix': 'some suffix',
				'uploadKey': 'some key',
			});
			return request({ ...fileRegisterRequest })
				.then(() => {
					throw new Error('fail');
				}).catch(error => {
					assert.instanceOf(error, ErrorResponse);
					assert.strictEqual(error.message, 'API did not recognize provided file meta.');
					assert.strictEqual(error.reason, 'Attempted to register existing file, but API did not recognize provided file meta.');
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
			fetchMock.get('https://api.zotero.org/users/475425/items/ABCD1111/file/view/url', {
				status: 200,
				headers: {
					contentType: 'text/plain'
				},
				body: 'https://files.zotero.org/some-file\n'
			});
			return request({
				method: 'get',
				format: null,
				resource: {
					library: 'u475425',
					items: 'ABCD1111',
					fileUrl: null
				}
			}).then(response => {
				assert.instanceOf(response, FileUrlResponse);
				assert.strictEqual(response.getResponseType(), 'FileUrlResponse');
				assert.strictEqual(response.getData(), 'https://files.zotero.org/some-file');
				assert.isNull(response.getVersion());
			});
		});
	})

	describe('Configuration', () => {
		it('should honor api configuration', () => {
			fetchMock.mock('begin:app://some-other-api.zotero.org:123/prefix/users/475425/items/ABCD1111', 200);
			return request({
				method: 'get',
				resource: {
					library: 'u475425',
					items: 'ABCD1111'
				},
				apiAuthorityPart: 'some-other-api.zotero.org:123',
				apiPath: 'prefix/',
				apiScheme: 'app'
			}).then(() => {
				assert.isOk(fetchMock.done());
			});
		});
	});
});