const core = require('@actions/core');
const CloudVendor = require("./CloudVendor");
const VultrAPI = require('@vultr/vultr-node');
const { waitUntil } = require('async-wait-until');
const { generateKeyPair } = require('crypto');
const sshpk = require('sshpk');
const { NodeSSH } = require('node-ssh')

const ssh = new NodeSSH();


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

    async exec(scriptPath, { host, privateKey }) {
        await ssh.connect({
            host,
            username: 'root',
            privateKey
        });

        return ssh.execCommand('git clone https://github.com/sidxdev/cloudtask-examples', { cwd: '~' });
    }

    async create({ ram = 1, cpu = 1, region, sshkey_id = [] }) {
        const plan = `vc2-${cpu}c-${ram}gb`;

        // create ssh key
        await this.createSSHKey();

        // create instance
        const { instance } = await this.vultr.instances.createInstance({
            region,
            plan,
            os_id: '517',
            tag: 'cloudtask',
            sshkey_id
        });

        // Wait up to 5min for activation
        await waitUntil(async () => {
            let status = await this.get(instance.id);
            core.info(`Waiting for server activation. Status ${status.instance.power_status} & ${status.instance.server_status}...`);
            return status.instance.power_status === 'running' && status.instance.server_status === 'ok';
        }, {
            timeout: 600000,
            intervalBetweenAttempts: 30000
        });

        return instance;
    }

    async get(id) {
        return this.vultr.instances.getInstance({ 'instance-id': id });
    }

    async getAll() {
        return await this.vultr.instances.listInstances();
    }

    async destroy(id) {
        await this.deleteSSHKey();
        return this.vultr.instances.deleteInstance({ 'instance-id': id });
    }

    async destroyAll() {
        let { instances } = await this.getAll();
        instances.forEach(async ({ id }) => await this.destroy(id))
    }

    async createSSHKey() {
        return new Promise((resolve, reject) => {
            generateKeyPair('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, async (err, publicKey, privateKey) => {
                if (err) {
                    reject(err)
                }

                const pemKey = sshpk.parseKey(publicKey, 'pem');
                const identity = pemKey.toString('ssh');

                let { ssh_key } = await this.vultr.sshKeys.createSshKey({
                    name: 'cloudtask',
                    ssh_key: identity
                });

                const pemPrivateKey = sshpk.parsePrivateKey(privateKey, 'pem');
                privateKey = pemPrivateKey.toString('ssh');

                resolve({
                    id: ssh_key.id, public: identity, privateKey
                });
            });
        })
    }

    async deleteSSHKey(id) {
        return await this.vultr.sshKeys.deleteSshKey({ 'ssh-key-id': id });
    }

}


module.exports = Vultr;