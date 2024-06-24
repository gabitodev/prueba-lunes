const Database = require('better-sqlite3');
const db = new Database('contactos.db');

module.exports = db;
