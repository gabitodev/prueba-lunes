const supertest = require('supertest');
const app = require('../app');
const { describe, test, expect } = require('@jest/globals');
const api = supertest(app);

describe('test hola mundo', () => {
  test('get /, se recibe un json', async () => {
    const response = await api.get('/').expect(200).expect('Content-Type', /json/);
    expect(response.body).toStrictEqual({ hola: 'mundo' });
  });
});
