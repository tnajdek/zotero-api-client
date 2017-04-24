'use strict';

import item from './item';
import collection from './collection';
import search from './search';
import tag from './tag';

export default libraryKey => {
	item.bind({
		...this,
		libraryKey
	})
	collection.bind({
		...this,
		libraryKey
	})
	search.bind({
		...this,
		libraryKey
	})
	tag.bind({
		...this,
		libraryKey
	})
}