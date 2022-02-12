const CloudVendor = require("./CloudVendor");
const VultrAPI = require('@vultr/vultr-node');


class Vultr extends CloudVendor {

    constructor() {
        super({ name: 'vultr' });
    }

    async connect() {
        const apiKey = core.getInput('api_key');
        this.vultr = VultrAPI.initialize({ apiKey });
    }

    async info() {
        return await this.vultr.account.getAccountInfo();
    }

}


module.exports = Vultr;