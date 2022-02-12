const assert = require("assert");


class CloudVendor {

    constructor({ name }) {
        this.name = name;

        assert(typeof this.name === 'string');
        assert(typeof this.connect === 'function');
        assert(typeof this.info === 'function');
    }

};


module.exports = CloudVendor;