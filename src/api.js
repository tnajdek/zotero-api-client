import request from './request.js';

/**
 * @module zotero-api-client
 */

/**
 * Wrapper function creates closure scope and calls api()
 * @return {Object} Partially configured api functions
 */
const api = function () {
	/**
	 * Entry point of the interface. Configures authentication.
	 * Can be used to configure any other properties of the api
	 * Returns a set of functions that are bound to that configuration
	 * and can be called to specify further api configuration.
	 * @param  {String} key  - Authentication key
	 * @param  {Object} opts - Optional api configuration. For a list of all
	 *                         possible properties, see documentation for
	 *                         request() function
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const api = function (key = '', opts = {}) {
		let props = {...processOpts(opts)};

		if (!('executors' in props) && (!this || !('executors' in this))) {
			props.executors = [request];
		}

		if (key) {
			props.zoteroApiKey = key;
		}

		return ef.bind(this)(props)
	}

	/**
	 * Configures which library api requests should use.
	 * @chainable
	 * @param {*} [typeOrKey] - Library key, e.g. g1234. Alternatively, if
	 *                          second parameter is present, library type i.e.
	 *                          either 'group' or 'user'
	 * @param {Number} [id]   - Only when first argument is a type, library id
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const library = function (typeOrKey, id = null) {
		let libraryKey;
		if (arguments.length > 1) {
			switch (typeOrKey.toLowerCase()) {
				case 'user':
					libraryKey = `u${id}`;
					break;
				case 'group':
					libraryKey = `g${id}`;
					break;
				default:
					throw new Error(`Unrecognized library type "${typeOrKey}"`);
			}
		} else {
			libraryKey = typeOrKey;
		}

		return efr.bind(this)({
			library: libraryKey
		})
	};

	/**
	 * Configures api to use items or a specific item
	 * Can be used in conjunction with library(), collections(), top(), trash(),
	 * children(), tags() and any execution function (e.g. get(), post())
	 * @param  {String} items - Item key, if present, configure api to point at
	 *                          this specific item
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const items = function (items = null) {
		return efr.bind(this)({
			items
		})
	};

	/**
	 * Configure api to request all item types
	 * Can only be used in conjunction with get()
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const itemTypes = function () {
		return efr.bind(this)({
			itemTypes: null
		});
	};

	/**
	 * Configure api to request all item fields
	 * Can only be used in conjunction with get()
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const itemFields = function () {
		return efr.bind(this)({
			itemFields: null
		});
	};

	/**
	 * Configure api to request localized creator fields
	 * Can only be used in conjunction with get()
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const creatorFields = function () {
		return efr.bind(this)({
			creatorFields: null
		});
	};


	/**
	 * Configure api to request schema
	 * Can only be used in conjunction with get()
	 * @returns {Object} Partially configured api functions
	 * @chainable
	 */
	const schema = function () {
		return efr.bind(this)({
			schema: null
		});
	}

	/**
	 * Configure api to request all valid fields for an item type
	 * Can only be used in conjunction with get()
	 * @param  {String} itemType - item type for which valid fields will be
	 *                             requested, e.g. 'book' or 'journalType'
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const itemTypeFields = function (itemType) {
		if (!itemType) {
			throw new Error('itemTypeFields() requires an itemType argument');
		}
		return efr.bind(this)({
			itemTypeFields: null
		}, {itemType});
	};

	/**
	 * Configure api to request valid creator types for an item type
	 * Can only be used in conjunction with get()
	 * @param  {String} itemType - item type for which valid creator types
	 *                             will be requested, e.g. 'book' or
	 *                             'journalType'
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const itemTypeCreatorTypes = function (itemType) {
		if (!itemType) {
			throw new Error('itemTypeCreatorTypes() requires an itemType argument');
		}
		return efr.bind(this)({
			itemTypeCreatorTypes: null
		}, {itemType});
	};

	/**
	 * Configure api to request template for a new item
	 * Can only be used in conjunction with get()
	 * @param  {String} itemType - item type for which template will be requested, e.g. 'book' or 'journalType'
	 * @param  {String} subType - annotationType if itemType is 'annotation' or linkMode if itemType is 'attachment'
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const template = function (itemType, subType) {
		if (!itemType) {
			throw new Error('template() requires an itemType argument');
		}
		const subTypeOpts = {};

		if (subType && itemType === 'annotation') {
			subTypeOpts.annotationType = subType;
		} else if (subType && itemType === 'attachment') {
			subTypeOpts.linkMode = subType;
		}

		return efr.bind(this)({
			template: null
		}, {itemType, ...subTypeOpts});
	};

	/**
	 * Configure api to use collections or a specific collection
	 * Can be used in conjunction with library(), items(), top(), tags() and
	 * any of the execution function (e.g. get(), post())
	 * @param  {String} collections - Collection key, if present, configure api to
	 *                          point to this specific collection
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const collections = function (collections) {
		return efr.bind(this)({
			collections: collections || null
		})
	};

	/**
	 * Configure api to use subcollections that reside underneath the specified
	 * collection.
	 * Should only be used in conjunction with both library() and collection()
	 * and any of the execution function (e.g. get(), post())
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const subcollections = function () {
		return efr.bind(this)({
			subcollections: null
		})
	};

	/**
	 * Configure api to narrow the request to only consider items filled under
	 * "My Publications"
	 * Should only be used in conjunction with both library() and items()
	 * and any of the execution function (e.g. get(), post())
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const publications = function () {
		return efr.bind(this)({
			publications: null
		})
	};
	/**
	 * Configure api to request or delete tags or request a specific tag
	 * Can be used in conjunction with library(), items(), collections() and
	 * any of the following execution functions: get(), delete() but only
	 * if the first argument is not present. Otherwise, can only be used in
	 * conjunction with get()
	 * @param  {String} tags - name of a tag to request. If present, configure
	 *                         api to request a specific tag.
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const tags = function (tags = null) {
		return efr.bind(this)({
			tags
		})
	};

	/**
	 * Configure api to use saved searches or a specific saved search
	 * Can be used in conjunction with library() and any of the execution
	 * functions
	 * @param  {String} searches - Search key, if present, configure api to point at
	 *                             this specific saved search
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const searches = function (searches = null) {
		return efr.bind(this)({
			searches: searches
		})
	};

	/**
	 * Configure api to narrow the request only to the top level items
	 * Can be used in conjunction with items() and collections() and only
	 * with conjunction with a get() execution function
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const top = function () {
		return efr.bind(this)({
			top: null
		})
	};

	/**
	 * Configure api to narrow the request only to the items in the trash
	 * Can be only used in conjunction with items() and get() execution
	 * function
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const trash = function () {
		return efr.bind(this)({
			trash: null
		})
	};

	/**
	 * Configure api to narrow the request only to the children of given
	 * item
	 * Can be only used in conjunction with items() and get() execution
	 * function
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const children = function () {
		return efr.bind(this)({
			children: null
		})
	};

	/**
	 * Configure api to request settings
	 * Can only be used in conjunction with get(), put(), post() and delete()
	 * For usage with put() and delete() a settings key must be provided
	 * For usage with post() a settings key must not be included
	 * @param  {String} settings - Settings "key", if present, configures api to point at
	 *                             this specific key within settings, e.g. `tagColors`.

	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const settings = function (settings = null) {
		return efr.bind(this)({
			settings
		});
	};

	/**
	 * Configure api to request deleted content
	 * Can only be used in conjunction with get()
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const deleted = function (since) {
		const resource = {
			...this.resource,
			deleted: null
		};

		return ef.bind(this)({since, resource});
	};

	/**
	 * Configure api to request user-accessible groups (i.e. The set of groups
	 * the current API key has access to, including public groups the key owner
	 * belongs to even if the key doesn't have explicit permissions for them.)
	 * Can only be used in conjunction with get()
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const groups = function () {
		return efr.bind(this)({
			groups: null
		});
	};

	/**
	 * Configure api to specify a local version of a given entity.
	 * When used in conjunction with the get() exec function, it will populate the
	 * If-Modified-Since-Version header.
	 * When used in conjunction with post(), put(), patch() or delete(), it will
	 * populate the If-Unmodified-Since-Version header.
	 * @param  {Number} version - local version of the entity
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const version = function (version) {
		if (typeof (version) !== 'number' || isNaN(version)) {
			throw new Error('version() requires a number argument');
		}
		return ef.bind(this)({version});
	};

	/**
	 * Configure api to upload or download an attachment file.
	 * Can be only used in conjunction with items() and post()/get()/patch().
	 * Method patch() can only be used to upload a binary patch, in this case the last two arguments
	 * must be provided.
	 * Method post() is used for full uploads. If `md5sum` is provided, it will update an existing
	 * file, otherwise it uploads a new file. The last two arguments are not used in this scenario.
	 * Method get() is used for downloads, in this case skip all arguments.
	 * Use items() to select the attachment item for which the file is uploaded/downloaded.
	 * Will populate format on download as well as Content-Type, If*Match headers in case of upload.
	 * @param {String} [fileName] - For upload: name of the file, should match values in attachment item entry
	 * @param {ArrayBuffer} [file] - New file to be uploaded
	 * @param {Number} [mtime] - New file's mtime, leave empty to assume current date/time
	 * @param {String} [md5sum] - MD5 hash of an existing file, required for uploads that update existing file
	 * @param {ArrayBuffer} patch - Binary patch, to be applied to the old file, to produce a new file
	 * @param {String} [algorithm] - Algorithm used to compute a diff: xdelta, vcdiff or bsdiff
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const attachment = function (fileName, file, mtime, md5sum, patch, algorithm) {
		let resource = {
			...this.resource,
			file: null
		};

		let bindParams = {};

		if (md5sum) {
			bindParams.ifMatch = md5sum;
			if (patch && algorithm) {
				bindParams.filePatch = patch;
				bindParams.algorithm = algorithm;
			}
		} else {
			bindParams.ifNoneMatch = '*';
		}

		if (fileName && file) {
			return ef.bind(this)({
				format: null,
				contentType: 'application/x-www-form-urlencoded',
				fileName,
				resource,
				file,
				mtime,
				...bindParams
			})
		} else {
			return ef.bind(this)({format: null, resource});
		}
	}

	/**
	 * Advanced function that will attempt to register an existing file with a given attachment item
	 * based on known file metadata. Can also be used to rename an existing file.
	 * Can be only used in conjunction with items() and post().
	 * Use items() to select the attachment item for which a file is registered.
	 * Will populate Content-Type, If-Match headers.
	 * Will fail with a ErrorResponse if API does not return "exists".
	 * @param  {String} fileName  - name of the file, should match value in the item, unless renaming
	 * @param  {Number} fileSize  - size of the existing file
	 * @param  {Number} mtime     - mtime of the existing file
	 * @param  {String} md5sum    - md5sum of the existing file
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const registerAttachment = function (fileName, fileSize, mtime, md5sum) {
		let resource = {
			...this.resource,
			file: null
		};
		if (fileName && typeof (fileSize) !== 'undefined' && typeof (mtime) !== 'undefined' && md5sum) {
			return ef.bind(this)({
				contentType: 'application/x-www-form-urlencoded',
				fileName,
				fileSize,
				format: null,
				ifMatch: md5sum,
				md5sum,
				mtime,
				resource,
				uploadRegisterOnly: true,
			})
		} else {
			throw new Error('Called registerAttachment() without specifying required parameters');
		}
	}

	/**
	 * Configure api to request a temporary attachment file url
	 * Can be only used in conjunction with items() and get()
	 * Use items() to select attachment item for which file is url is requested
	 * Will populate format, redirect
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const attachmentUrl = function () {
		let resource = {
			...this.resource,
			fileUrl: null
		};
		return ef.bind(this)({
			format: null,
			resource
		});
	}


	/**
	 * Configure api to request information on the API key.
	 * Can only be used in conjunction with get()
	 *
	 * @return {Object} Partially configured api functions
	 * @chainable
	 */
	const verifyKeyAccess = function () {
		return efr.bind(this)({
			verifyKeyAccess: null
		})
	}

	/**
	 * Execution function. Specifies that the request should use a GET method.
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return either an
	 *                   ApiResponse, SingleReadResponse or MultiReadResponse.
	 *                   Might throw Error or ErrorResponse.
	 */
	const get = function (opts) {
		return execute(prepareRequest(this, 'get', opts));
	};

	/**
	 * Execution function. Specifies that the request should use a POST method.
	 * @param  {Array} data  - An array of entities to post
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return MultiWriteResponse.
	 *                   Might throw Error or ErrorResponse
	 */
	const post = function (data, opts) {
		return execute(prepareRequest(this, 'post', opts, data));

	};

	/**
	 * Execution function. Specifies that the request should use a PUT method.
	 * @param  {Object} data - An entity to put
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return SingleWriteResponse.
	 *                   Might throw Error or ErrorResponse
	 */
	const put = function (data, opts) {
		return execute(prepareRequest(this, 'put', opts, data));
	};

	/**
	 * Execution function. Specifies that the request should use a PATCH
	 * method.
	 * @param  {Object} data - Partial entity data to patch
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return SingleWriteResponse.
	 *                   Might throw Error or ErrorResponse
	 */
	const patch = function (data, opts) {
		return execute(prepareRequest(this, 'patch', opts, data));
	};

	/**
	 * Execution function. Specifies that the request should use a DELETE
	 * method.
	 * @param  {Array} keysToDelete - An array of keys to delete. Depending on
	 *                                how api has been configured, these will
	 *                                be item keys, collection keys, search
	 *                                keys or tag names. If not present, api
	 *                                should be configured to use specific
	 *                                item, collection, saved search or settings
	 *                                key, in which case, that entity will be deleted
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return DeleteResponse.
	 *                   Might throw Error or ErrorResponse
	 */
	const del = function (keysToDelete, opts) {
		return execute(prepareRequest(this, 'delete', opts, keysToDelete));
	};

	/**
	 * Execution function. Returns current config without doing any requests.
	 * Usually used in advanced scenarios where config needs to be tweaked
	 * manually before submitted to the request method or as a debugging tool.
	 * @return {Object} current config
	 */
	const getConfig = function () {
		return this;
	};

	/**
	 * Execution function. Prepares the request but does not execute fetch(),
	 * instead returning a "pretended" response where details for the actual
	 * fetch that would have been used are included.
	 * Usually used in advanced scenarios where config needs to be tweaked
	 * manually before it is submitted to the request method or as a debugging tool.
	 * @param  {String} verb - Defines which execution function is used to prepare
	 *                         the request. Should be one of 'get', 'post', 'patch'
	 *                         'put', 'delete'. Defaults to 'get'.
	 * @param  {Object} data - This argument is passed over to the actual execution
	 *                         function. For 'get' it is ignored, for 'post', 'patch'
	 *                         and 'put' see 'data' of that execution function, for
	 *                         'delete' see 'keysToDelete'
	 * @param  {Object} opts - Optional api configuration. If duplicate,
	 *                         overrides properties already present. For a list
	 *                         of all possible properties, see documentation
	 *                         for request() function
	 * @return {Promise} A promise that will eventually return PretendResponse.
	 *                   Might throw Error or ErrorResponse
	 */
	const pretend = function (verb = 'get', data, opts) {
		return execute(prepareRequest(this, verb, {...opts, pretend: true}, data));
	};

	/**
	 * Used for extending capabilities of the library by installing plugins.
	 * In most cases plugins inject additional executors or bind api to an
	 * alternative/extended set of functions
	 * @param  {function} extend  - function that installs alternative
	 *                              or additional functionality of the api.
	 *                              It should return bound api functions,
	 *                              usually by calling arguments[0].ef()
	 * @return {Object} Extended/partially configured api functions
	 */
	const use = function (extend) {
		return extend({
			config: this,
			functions,
			ef,
			efr,
			execute
		});
	}

	const functions = {
		api, attachment, attachmentUrl, children, collections, creatorFields, delete: del, //delete is a keyword
		deleted, get, getConfig, groups, itemFields, items, itemTypeCreatorTypes, itemTypeFields,
		itemTypes, library, patch, post, pretend, publications, put, registerAttachment, schema,
		searches, settings, subcollections, tags, template, top, trash, use, verifyKeyAccess, version,
	}

	const ef = function (opts) {
		let context = {...this, ...opts};
		let enhancedFunctions = {};
		for (let fname in functions) {
			enhancedFunctions[fname] = functions[fname].bind(context)
		}

		return enhancedFunctions;
	}

	const efr = function (resource, opts) {
		resource = {...this.resource, ...resource};
		opts = {...opts, resource};
		return ef.bind(this)(opts);
	}

	const processOpts = function (opts) {
		let newOpts = {...opts};
		if ('apiScheme' in newOpts) {
			//  only alphanumeric characters and the +, -, and . allowed
			if (newOpts.apiScheme.endsWith('://')) {
				newOpts.apiScheme = newOpts.apiScheme.substring(0, newOpts.apiScheme.length - 3);
			}
			if (!newOpts.apiScheme.match(/^[a-zA-Z0-9+\-.]+$/)) {
				throw new Error('apiScheme can only contain alphanumeric characters, plus (+), minus (-), and dot (.)');
			}
		}
		if ('apiPath' in newOpts) {
			if (newOpts.apiPath.startsWith('/')) {
				newOpts.apiPath = newOpts.apiPath.substring(1);
			}
			if (newOpts.apiPath.length > 0 && !newOpts.apiPath.endsWith('/')) {
				newOpts.apiPath += '/';
			}
		}
		return newOpts;
	}

	const prepareRequest = function (config, verb, opts, body) {
		const method = verb.toLowerCase();
		let relevantSearchKey, requestConfig, keysToDelete;
		switch (method) {
			case 'get':
				requestConfig = {...config, ...processOpts(opts), method};
				if ('version' in requestConfig) {
					requestConfig['ifModifiedSinceVersion'] = requestConfig['version'];
					delete requestConfig['version'];
				}
				return requestConfig;
			case 'post':
			case 'put':
			case 'patch':
				requestConfig = {...config, ...opts, body, method};
				if ('version' in requestConfig) {
					requestConfig['ifUnmodifiedSinceVersion'] = requestConfig['version'];
					delete requestConfig['version'];
				}
				return requestConfig;
			case 'delete':
				requestConfig = {...config, ...opts, method};
				keysToDelete = body;

				if (keysToDelete && !Array.isArray(keysToDelete)) {
					throw new Error(`Called delete() with ${typeof keysToDelete}, expected an Array`);
				}

				if ('version' in requestConfig) {
					requestConfig['ifUnmodifiedSinceVersion'] = requestConfig['version'];
					delete requestConfig['version'];
				}

				if ('resource' in requestConfig && 'items' in requestConfig.resource) {
					relevantSearchKey = 'itemKey';
				} else if ('resource' in requestConfig && 'collections' in requestConfig.resource) {
					relevantSearchKey = 'collectionKey';
				} else if ('resource' in requestConfig && 'tags' in requestConfig.resource) {
					relevantSearchKey = 'tag';
				} else if ('resource' in requestConfig && 'searches' in requestConfig.resource) {
					relevantSearchKey = 'searchKey';
				} else if ('resource' in requestConfig && 'settings' in requestConfig.resource) {
					if (keysToDelete) {
						throw new Error('Arguments to delete() not supported when deleting settings');
					}
				} else {
					throw new Error('Called delete() without first specifying what to delete')
				}

				if (keysToDelete) {
					requestConfig[relevantSearchKey] = [
						...(requestConfig[relevantSearchKey] || []),
						...keysToDelete
					]
				}
				return requestConfig;
		}
	}

	const execute = async config => {
		for (let f of config.executors) {
			config = await f(config);
		}

		return config.response;
	}

	return api(...arguments);
};

export default api;
