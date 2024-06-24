const db = require('.');

const createUsersTable = async () => {
  const statement = db.prepare(`
  CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  )
  `);
  statement.run();
  console.log('Tabla de usuarios creada');
};

const createContactsTable = async () => {
  const statement = db.prepare(`
  CREATE TABLE contacts (
    contact_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id)
      REFERENCES users (user_id)
      ON DELETE CASCADE
  )
  `);
  statement.run();
  console.log('Tabla de contactos creada');
};

const createTables = async () => {
  await createUsersTable();
  await createContactsTable();
};

createTables();
