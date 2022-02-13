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
        let instance, ssh_key;
        
        try {
            await this.vendor.connect();
            core.info(`Connected to vendor: ${await this.vendor.info()}`);
            
            ssh_key = await this.vendor.createSSHKey();
            core.info(`Created ssh public identity: ${ssh_key.public}`);

            instance = await this.vendor.create({ ram: 1, cpu: 1, region: 'ewr', sshkey_id: [ssh_key.id] });
            core.info(`Created new server: ${instance.id}`);

            core.info(`Starting task.`)
            let taskRun = await this.vendor.exec(taskPath, { privateKey: ssh_key.privateKey, host: instance.main_ip });
            core.info('STDOUT: ' + taskRun.stdout)
            core.info('STDERR: ' + taskRun.stderr)
            core.info(`Task completed.`);

            await this.vendor.destroy(instance.id);
            core.info(`Deleted server: ${instance.id}`);

            await this.vendor.deleteSSHKey(ssh_key.id);
            core.info(`Deleted SSH Key: ${ssh_key.id}`);
        } catch (error) {
            if (instance) {
                await this.vendor.destroy(instance.id);
                core.info(`Deleted server: ${instance.id}`);
            }
            if (ssh_key) {
                await this.vendor.deleteSSHKey(ssh_key.id);
                core.info(`Deleted SSH Key: ${ssh_key.id}`);
            }
            core.setFailed(error.message);
        }

        return process.exit();
    }

};


module.exports = Runner;