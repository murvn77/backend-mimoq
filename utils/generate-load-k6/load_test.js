import { check } from "k6";
import { Counter } from "k6/metrics";
import http from "k6/http";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

const BASE_URL = __ENV.API_URL || "https://api.example.com";
// const VUS = parseInt(__ENV.VUS) || 10;
const stringVUS = __ENV.VUS || 10;
const stringDURATIONS = __ENV.DURATION || "30s";
const endpointsString =
  __ENV.ENDPOINTS || "/defaultPath1,/defaultPath2,/defaultPath3";
const delimiter = __ENV.DELIMITER || ",";
const ARCHIVO = __ENV.SUMMARY || 'summary.html';
const VUS = stringVUS.split(delimiter);
const DURATIONS = stringDURATIONS.split(delimiter);
const ENDPOINTS = endpointsString.split(delimiter);
const STAGES = [];
for (let i = 0; i < VUS.length; i++) {
  const duration = DURATIONS[i];
  const target = parseInt(VUS[i]);
  // console.log('targets', target)
  // console.log('duration', duration)
  STAGES.push({ duration, target });
}
const stages = STAGES;
// console.log('stages', stages);
export const options = {
  // thresholds: {
  //   //Si la taza de error es mayor al 1% el test falla
  //   http_req_failed: ["rate<0.01"],
  //   //Si la duración de la petición es mayor a 1000ms el test falla
  //   http_req_duration: ["p(95)<1000"],
  // },
  stages: stages
  // stages: [
  //   { duration: "30s", target: 30 },
  //   { duration: DURATION, target: VUS },
  //   { duration: "15s", target: 5 },
  //   { duration: "10s", target: 0 },
  // ],
  // vus: VUS,
  // duration: DURATION,
  // iterations: 52
};
const requestTotal= new Counter("number_of_requests");
const requestSucceed = new Counter("number_of_requests_succeded");
const requestFail = new Counter("number_of_requests_failed");
export default function () {
  // for (let i = 0; i < ENDPOINTS.length; i++) {
  //   const endpoint = ENDPOINTS[i];
  //   const res = http.get(BASE_URL + endpoint);
  //   check(res, {
  //     "is status 200": (r) => r.status === 200,
  //   });
  //   if (res.status === 200) {
  //     // console.log(JSON.stringify(res.json()))
  //     requestSucceed.add(1);
  //   } else {
  //     requestFail.add(1);
  //   }
  // }
  const requests = ENDPOINTS.map((endpoint) => {
    // console.log("ANTES DE END",endpoint,"DESPUES DE END")
    return [
      "GET",
      `${BASE_URL}${endpoint}`,
      null,
      { tags: { name: "Stress_Test" } },
    ];
  });

  const responses = http.batch(requests);

  for (let i = 0; i < responses.length; i++) {
    const res = responses[i];

    if (res.status === 200) {
      requestSucceed.add(1);
    } else {
      requestFail.add(1);
    }
    requestTotal.add(1);
  }
}

export function handleSummary(data) {
  const summary = `${ARCHIVO}`;
  console.log(`${ARCHIVO}`)
  return {
    [summary]: htmlReport(data),
  };
}
  // const responses = http.batch([
  //   ['GET', 'https://test.k6.io', null, { tags: { ctype: 'html' } }],
  //   ['GET', 'https://test.k6.io/style.css', null, { tags: { ctype: 'css' } }],
  //   ['GET', 'https://test.k6.io/images/logo.png', null, { tags: { ctype: 'images' } }],
  // ]);
