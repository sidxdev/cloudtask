const core = require('@actions/core');
const Vultr = require("./Vultr");


class Runner {

    constructor() {
        const vendor = core.getInput('vendor');
        switch (vendor) {
            case "vultr":
                this.vendor = new Vultr();
                break;
            default:
                throw new Error(`Vendor not supported: ${vendor}`);
        }
        core.info(`Vendor selected: ${vendor}`);
    }

    async run() {
        try {
            await this.vendor.connect();
            core.info(`Connected to vendor: ${await this.vendor.info()}`);
        } catch (error) {
            core.setFailed(error.message);
        }
    }

};


module.exports = Runner;