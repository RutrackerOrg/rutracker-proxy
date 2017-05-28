'use strict';

const logger = require('winston');

logger.level = 'debug';
global.logger = logger;

module.exports = logger;
