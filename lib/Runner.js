const core = require('@actions/core');
const Vultr = require("./Vultr");


const taskPath = core.getMultilineInput("task");

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
            
            let instanceID = await this.vendor.create({ ram: 1, cpu: 1, region: 'ewr' });
            core.info(`Created new server: ${instanceID}`);

            await this.vendor.destroy(instanceID);
            core.info(`Deleted server: ${instanceID}`);
        } catch (error) {
            core.setFailed(error.message);
        }
    }

};


module.exports = Runner;