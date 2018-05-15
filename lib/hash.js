// Code from https://github.com/darkskyapp/string-hash
// License http://creativecommons.org/publicdomain/zero/1.0/

/**
 * creates a number based hash from a str
 * this is for diff strings and not cryptography
 *
 * @param  {String} str
 * @return {Int}
 */
module.exports = function (str) {

    let hash = 5381;
    let i = str.length;
    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
};
