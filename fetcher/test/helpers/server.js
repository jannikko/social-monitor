const request = require('supertest');
const app = require('../../services/app');

module.exports = request(app);