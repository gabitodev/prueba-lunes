const contactsRouter = require('express').Router();
const db = require('../db');
const REGEX_NAME = /^[A-Z][a-z]*[ ][A-Z][a-z]*$/;
const REGEX_NUMBER = /^[0](212|412|414|424|416|426)[0-9]{7}$/;

contactsRouter.post('/', async (req, res) => {
  try {
    // 1. Obtener el nombre y telefono del body
    const { name, phone } = req.body;

    // 1.1 Verificar que el nombre y la telefono son correctos
    if (!REGEX_NAME.test(name)) {
      return res.status(400).json({
        error: 'El nombre es invalido',
      });
    } else if (!REGEX_NUMBER.test(phone)) {
      return res.status(400).json({
        error: 'El telefono es invalido',
      });
    }

    // 2. Crear el nuevo contacto
    const statement = db.prepare(`
    INSERT INTO contacts (name, phone, user_id)
    VALUES (?, ?, ?)
    RETURNING *
  `);

    const contact = statement.get(name, phone, req.userId);

    // 4. Enviar la respuesta
    return res.status(201).json(contact);
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'El nombre de usuario ya existe',
      });
    }
    return res.status(500).json({ error: 'Hubo un error' });
  }
});

contactsRouter.put('/:id', async (req, res) => {
  try {
    // 1. Obtener el nombre y telefono del body
    const { name, phone } = req.body;

    // 1.1 Verificar que el nombre y la telefono son correctos
    if (!REGEX_NAME.test(name)) {
      return res.status(400).json({
        error: 'El nombre es invalido',
      });
    } else if (!REGEX_NUMBER.test(phone)) {
      return res.status(400).json({
        error: 'El telefono es invalido',
      });
    }

    // 2. Actualizar el contacto
    const statement = db.prepare(`
    UPDATE contacts
    SET 
      name = ?,
      phone = ?
    WHERE contact_id = ? AND user_id = ?
    RETURNING *
  `);
    const contact = statement.get(name, phone, req.params.id, req.userId);

    if (!contact) {
      return res.status(403).json({
        error: 'No tiene los permisos',
      });
    }

    // 4. Enviar la respuesta
    return res.status(200).json(contact);
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'Numero duplicado',
      });
    }
    return res.status(500).json({ error: 'Hubo un error' });
  }
});

contactsRouter.delete('/:id', async (req, res) => {
  try {
    // 2. Actualizar el contacto
    const statement = db.prepare(`
    DELETE FROM contacts
    WHERE contact_id = ? AND user_id = ?
  `);
    const { changes } = statement.run(req.params.id, req.userId);

    if (!changes) {
      return res.status(400).json({
        error: 'El contacto no existe',
      });
    }

    // 4. Enviar la respuesta
    return res.status(200).json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.log('ERROR', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'Numero duplicado',
      });
    }
    return res.status(500).json({ error: 'Hubo un error' });
  }
});

module.exports = contactsRouter;
