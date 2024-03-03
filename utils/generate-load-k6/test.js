import { describe } from 'https://jslib.k6.io/functional/0.0.3/index.js';
import { Httpx, Request, Get, Post } from 'https://jslib.k6.io/httpx/0.0.2/index.js';
import { randomIntBetween, randomItem } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";
import { Counter } from 'k6/metrics';

// export let options = {
//   thresholds: {
//     checks: [{threshold: 'rate == 1.00', abortOnFail: true}],
//   },
//   vus: 100,
//   duration: '1m',
//   iterations: 200
// };

const USERNAME = `user${randomIntBetween(1, 100000)}@example.com`; 
const PASSWORD = 'superCroc2023';
let myCounter = new Counter('Dropped_iterations');
let session = new Httpx({baseURL: 'https://test-api.k6.io'});

export default function testSuite() {

  describe('01. Fetch public crocs', (t) => {
    let responses = session.batch([
      new Get('/public/crocodiles/1/'),
      new Get('/public/crocodiles/2/'),
      new Get('/public/crocodiles/3/'),
      new Get('/public/crocodiles/4/'),
    ], {
      tags: {name: 'PublicCrocs'},
    });

    responses.forEach(response => {
      t.expect(response.status).as("response status").toEqual(200)
        .and(response).toHaveValidJson()
        .and(response.json('age')).as('croc age').toBeGreaterThan(7);
    });
  })

  describe(`02. Create a test user ${USERNAME}`, (t) => {

    let resp = session.post(`/user/register/`, {
      first_name: 'Crocodile',
      last_name: 'Owner',
      username: USERNAME,
      password: PASSWORD,
    });

    t.expect(resp.status).as("status").toEqual(201)
      .and(resp).toHaveValidJson();
  })

  describe(`03. Authenticate the new user ${USERNAME}`, (t) => {

    let resp = session.post(`/auth/token/login/`, {
      username: USERNAME,
      password: PASSWORD
    });

    t.expect(resp.status).as("Auth status").toBeBetween(200, 204)
      .and(resp).toHaveValidJson()
      .and(resp.json('access')).as("auth token").toBeTruthy();

    let authToken = resp.json('access');
    session.addHeader('Authorization', `Bearer ${authToken}`);

  })

  describe('04. Create a new crocodile', (t) => {
    let payload = {
      name: `Croc Name`,
      sex: randomItem(["M", "F"]),
      date_of_birth: '2023-01-25',
    };

    let resp = session.post(`/my/crocodiles/`, payload);

    t.expect(resp.status).as("Croc creation status").toEqual(201)
      .and(resp).toHaveValidJson();

    session.newCrocId=resp.json('id');
  })

  describe('05. Update the croc', (t) => {
    let payload = {
      name: `New name`,
    };

    let resp = session.patch(`/my/crocodiles/${session.newCrocId}/`, payload);

    t.expect(resp.status).as("Croc patch status").toEqual(200)
      .and(resp).toHaveValidJson()
      .and(resp.json('name')).as('name').toEqual('New name');

    let resp1 = session.get(`/my/crocodiles/${session.newCrocId}/`);

  })

  describe('06. Delete the croc', (t) => {

    let resp = session.delete(`/my/crocodiles/${session.newCrocId}/`);

    t.expect(resp.status).as("Croc delete status").toEqual(204);
  });
}