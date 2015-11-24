/*
 * Utility functions
 */


'use strict';
var utilities = module.exports = {};		
				
		
/**
	* does an object have any of its own properties
	*
	* @param  {Object} obj
	* @return {Boolean}
	*/
utilities.hasProperties = function( obj ) {
	var key;
	for(key in obj) {
		if( obj.hasOwnProperty( key ) ) {
			return true;
		}
	}
	return false;
}


utilities.deleteEmptyProperties = function( obj ) {
	var key;
	for(key in obj) {
		if( obj.hasOwnProperty( key )) {
			// delete properties undefined values
			if(obj[key] === undefined || obj[key] === null){
				delete obj[key];
			}
			// delete array with no values
			if(Array.isArray(obj[key]) && obj[key].length === 0){
				delete obj[key];
			}
		}
	}
	return obj;
}