require('dotenv').config();

const Runner = require('./lib/Runner');

const runner = new Runner();
runner.run();