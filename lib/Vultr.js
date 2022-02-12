const core = require('@actions/core');
const CloudVendor = require("./CloudVendor");
const VultrAPI = require('@vultr/vultr-node');
const { waitUntil } = require('async-wait-until');


class Vultr extends CloudVendor {

    constructor() {
        super({ name: 'vultr' });
    }

    async connect() {
        const apiKey = core.getInput('api_key');
        this.vultr = VultrAPI.initialize({ apiKey });
    }

    async info() {
        let info = await this.vultr.account.getAccountInfo();
        return `[Name] ${info.account.name} [Email] ${info.account.email}`;
    }

    async create({ ram = 1, cpu = 1, region }) {
        const plan = `vc2-${cpu}c-${ram}gb`;

        // create instance
        const { instance } = await this.vultr.instances.createInstance({
            region,
            plan,
            os_id: '517',
            tag: 'cloudtask'
        });

        // Wait up to 5min for activation
        await waitUntil(async () => {
            let status = await this.get(instance.id);
            core.info(`Waiting for server activation. Status ${status.instance.power_status}...`);
            return status.instance.power_status === 'running';
        }, {
            timeout: 300000,
            intervalBetweenAttempts: 30000
        });

        return instance.id;
    }

    async get(id) {
        return this.vultr.instances.getInstance({ 'instance-id': id });
    }

    async destroy(id) {
        return this.vultr.instances.deleteInstance({ 'instance-id': id });
    }

    async destroyAll() {
        let { instances } = await this.vultr.instances.listInstances();
        instances.forEach(async ({ id }) => await this.destroy(id))
    }

}


module.exports = Vultr;