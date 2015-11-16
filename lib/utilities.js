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