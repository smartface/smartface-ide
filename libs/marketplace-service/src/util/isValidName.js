/**
 * Returns an object with following properties:
 * - isValid {bool}
 * - errors {string[]}
 * @param {string} name - name that will be checked 
 */
module.exports = function isValidName(name) {
    var result = {
        isValid: true,
        errors: []
    };

    if (/\d/.test(name.charAt(0)) && name.charAt(0) !== '_') {
        result.isValid = false;
        result.errors.push("name must begin with a small letter or an underscore.");
    }
    else if (!/^[a-z_][a-z0-9_]*([a-z0-9_]+)*$/.test(name)) {
        result.isValid = false;
        result.errors.push("name can contain only lowercase letters, numbers and underscore.");
    }
    return result;
};
