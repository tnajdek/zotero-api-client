// Client-side validation of Zotero API resource/method combinations.
import { resourcesSpecs } from './request.js';

// Whitelist of valid resource-combination signatures mapped to the HTTP methods each accepts.
// A "signature" is the set of resource keys present (see resourcesSpecs), in resourcesSpecs
// order, joined by '/'. A key-bearing resource that carries a value gets a '*' suffix (e.g.
// 'collections*' is a specific collection, 'collections' is the listing); `library` is always
// keyed and is written without the marker.
const validResourceMethods = {
	// Library-independent
	'itemTypes': 'GET',
	'itemFields': 'GET',
	'creatorFields': 'GET',
	'itemTypeFields': 'GET',
	'itemTypeCreatorTypes': 'GET',
	'template': 'GET',
	'schema': 'GET',
	'verifyKeyAccess': 'GET',
	// Collections
	'library/collections': 'GET POST DELETE',
	'library/collections*': 'GET PUT PATCH DELETE',
	'library/collections/top': 'GET',
	'library/collections*/subcollections': 'GET',
	'library/collections*/items': 'GET POST',
	'library/collections*/items/top': 'GET',
	'library/collections*/items*': 'DELETE', // remove an item from a collection
	'library/collections*/tags': 'GET',
	'library/collections*/items/tags': 'GET',
	'library/collections*/items/top/tags': 'GET',
	// Items
	'library/items': 'GET POST DELETE',
	'library/items*': 'GET PUT PATCH DELETE',
	'library/items/top': 'GET',
	'library/items/trash': 'GET',
	'library/items*/children': 'GET',
	'library/items/tags': 'GET',
	'library/items*/tags': 'GET',
	'library/items/top/tags': 'GET',
	'library/items/trash/tags': 'GET',
	// Item files
	'library/items*/file': 'GET POST PATCH',
	'library/items*/fileUrl': 'GET',
	// Searches
	'library/searches': 'GET POST DELETE',
	'library/searches*': 'GET PUT PATCH DELETE',
	// Tags
	'library/tags': 'GET DELETE',
	'library/tags*': 'GET',
	// Settings
	'library/settings': 'GET POST DELETE',
	'library/settings*': 'GET PUT DELETE',
	// Other library-scoped
	'library/groups': 'GET',
	'library/deleted': 'GET',
	'library/fulltextIndex': 'GET',
	// My Publications
	'library/publications/items': 'GET',
	'library/publications/items*': 'GET',
	'library/publications/items/top': 'GET',
	'library/publications/items/tags': 'GET',
	'library/publications/items*/children': 'GET',
	'library/publications/items*/file': 'GET',
};

const makeResourceSignature = resource => {
	const segments = [];
	for (let spec of resourcesSpecs) {
		if (spec.name in resource) {
			const keyed = spec.isKeyResource && spec.name !== 'library' && resource[spec.name];
			segments.push(keyed ? `${spec.name}*` : spec.name);
		}
	}
	return segments.join('/');
};

// Throws if the resource/method combination is not a recognised Zotero API endpoint.
// Callers can bypass this via the `skipValidation` config option.
const validateRequest = (resource, method) => {
	const signature = makeResourceSignature(resource || {});
	const httpMethod = (method || 'get').toUpperCase();
	const allowedMethods = validResourceMethods[signature];
	if (!allowedMethods) {
		throw new Error(`Invalid Zotero API request: "${signature || '(empty)'}" is not a recognized endpoint.`);
	}
	if (!allowedMethods.split(' ').includes(httpMethod)) {
		throw new Error(`Invalid Zotero API request: ${httpMethod} is not supported on "${signature}" (allowed: ${allowedMethods.split(' ').join(', ')}).`);
	}
};

export { validateRequest };
