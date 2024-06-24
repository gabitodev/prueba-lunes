const supertest = require('supertest');
const app = require('../app');
const { describe, test, expect, beforeAll } = require('@jest/globals');
const db = require('../db');
const api = supertest(app);
let user = undefined;

let contacts = [
  {
    name: 'Gabriel Garcia',
    phone: '041221110608',
  },
  {
    name: 'Pedro Garcia',
    phone: '04141229090',
  },
  {
    name: 'Alejandro Gomez',
    phone: '02125424484',
  },
];

let users = [
  {
    username: 'gabitodev1',
    password: 'hola.123',
  },
  {
    username: 'carolgar01',
    password: 'jaja.123',
  },
];

describe('test contacts endpoint /api/contacts', () => {
  describe('post', () => {
    beforeAll(() => {
      // Borra todos los usuarios
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();

      // Crear un usuario
      user = db
        .prepare(
          `
        INSERT INTO users (username, password)
        VALUES (?, ?)
        RETURNING *
      `,
        )
        .get('gabitodev1', 'Secreto.123');
    });
    test('crea un nuevo contacto cuando todo esta correcto', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Gabriel Garcia',
        phone: '04122110509',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(201)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length + 1);
      expect(response.body).toStrictEqual({
        contact_id: 1,
        name: 'Gabriel Garcia',
        phone: '04122110509',
        user_id: 1,
      });
    });
    test('no crea un contacto cuando el nombre es incorrecto', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Gabriel',
        phone: '04122110509',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(400)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
      expect(response.body).toStrictEqual({
        error: 'El nombre es invalido',
      });
    });
    test('no crea un contacto cuando el numero es incorrecto', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Gabriel Garcia',
        phone: '04122',
      };
      const response = await api
        .post('/api/contacts')
        .query({ userId: user.user_id })
        .send(newContact)
        .expect(400)
        .expect('Content-Type', /json/);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
      expect(response.body).toStrictEqual({
        error: 'El telefono es invalido',
      });
    });
    test('no crea un contacto cuando el usuario no inicio sesion', async () => {
      const contactsBefore = db.prepare('SELECT * FROM contacts').all();
      const newContact = {
        name: 'Gabriel Garcia',
        phone: '04122110509',
      };
      await api.post('/api/contacts').query({ userId: null }).send(newContact).expect(403);
      const contactsAfter = db.prepare('SELECT * FROM contacts').all();
      expect(contactsAfter.length).toBe(contactsBefore.length);
    });
  });
  describe('put', () => {
    beforeAll(() => {
      // Borra todos los usuarios
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();

      // Crear un contacto
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });

      // Crear un contacto
      contacts = contacts.map((contact) => {
        return db
          .prepare(
            `
          INSERT INTO contacts (name, phone, user_id)
          VALUES (?, ?, ?)
          RETURNING *
        `,
          )
          .get(contact.name, contact.phone, users[0].user_id);
      });
    });
    test('actualiza un contacto cuando todo esta correcto', async () => {
      const updatedParams = {
        name: 'Alejandro Perez',
        phone: '04145555555',
      };
      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: users[0].user_id })
        .send(updatedParams)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        contact_id: 1,
        name: 'Alejandro Perez',
        phone: '04145555555',
        user_id: 1,
      });
    });
    test('no actualiza cuando el numero es duplicado', async () => {
      const updatedParams = {
        name: 'Pedro Garcia',
        phone: '04141229090',
      };

      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: users[0].user_id })
        .send(updatedParams)
        .expect(409)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'Numero duplicado',
      });
    });
    test('no actualiza cuando no es el usuario', async () => {
      const updatedParams = {
        name: 'Pedro Garcia',
        phone: '04145878787',
      };

      const response = await api
        .put(`/api/contacts/${contacts[0].contact_id}`)
        .query({ userId: users[1].user_id })
        .send(updatedParams)
        .expect(403)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'No tiene los permisos',
      });
    });
  });
  describe('delete', () => {
    beforeAll(() => {
      // Borra todos los usuarios
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM contacts').run();

      // Crear un contacto
      users = users.map((user) => {
        return db
          .prepare(
            `
      INSERT INTO users (username, password)
      VALUES (?, ?)
      RETURNING *
    `,
          )
          .get(user.username, user.password);
      });

      // Crear un contacto
      contacts = contacts.map((contact) => {
        return db
          .prepare(
            `
          INSERT INTO contacts (name, phone, user_id)
          VALUES (?, ?, ?)
          RETURNING *
        `,
          )
          .get(contact.name, contact.phone, users[0].user_id);
      });
    });
    test('elimina un contacto', async () => {
      const contact = contacts[0];

      const response = await api
        .delete(`/api/contacts/${contact.contact_id}`)
        .query({ userId: users[0].user_id })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        message: 'Contacto eliminado',
      });
    });
    test('no elimina un contacto cuando el contacto no existe', async () => {
      const response = await api
        .delete(`/api/contacts/1000`)
        .query({ userId: users[0].user_id })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'El contacto no existe',
      });
    });
    test('no elimina un contacto cuando el no es del usuario', async () => {
      const response = await api
        .delete(`/api/contacts/${contacts[1].contact_id}`)
        .query({ userId: users[1].user_id })
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toStrictEqual({
        error: 'El contacto no existe',
      });
    });
  });
});
