const core = require('@actions/core');
const Vultr = require("./Vultr");

class Runner {
    constructor() {
        const vendor = core.getInput('vendor') || "vultr";
        switch (vendor) {
            case "vultr":
                this.vendor = new Vultr();
            default:
                core.setFailed(`Vendor not supported: ${vendor}`);
        }
    }

    async run() {
        try {
            core.info(`Connectoed to vendor: ${this.vendor.info()}`);
        } catch (error) {
            core.setFailed(error.message);
        }
    }
};

module.exports = Runner;