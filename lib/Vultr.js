const CloudVendor = require("./CloudVendor");
const VultrAPI = require('@vultr/vultr-node');

class Vultr extends CloudVendor {
    constructor() {
        super()
        this.name = 'vultr'
    }

    connect() {
        apiKey = core.getInput('api_key');
        this.vultr = VultrAPI.initialize({ apiKey });
    }

    async info () {
        await this.vultr.account.getAccountInfo()
    }
}

module.exports = Vultr;