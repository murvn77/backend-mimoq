import { check } from "k6";
import { Counter } from "k6/metrics";
import http from "k6/http";

const BASE_URL = __ENV.API_URL || "https://api.example.com";
const VUS = parseInt(__ENV.VUS) || 10;
const DURATION = __ENV.DURATION || "30s";
const endpointsString =
  __ENV.ENDPOINTS || "/defaultPath1,/defaultPath2,/defaultPath3";
const delimiter = __ENV.DELIMITER || ",";

const ENDPOINTS = endpointsString.split(delimiter);

export const options = {
  thresholds: {
    //Si la taza de error es mayor al 1% el test falla
    http_req_failed: ["rate<0.01"],
    //Si la duración de la petición es mayor a 1000ms el test falla
    http_req_duration: ["p(95)<1000"],
  },
  // stages: [
  //   { duration: DURATION },
  //   { duration: DURATION },
  //   { duration: DURATION },
  // ],
  vus: VUS,
  duration: DURATION,
  // iterations: 52
};

const requestSucceed = new Counter("number_of_requests_succeded");
const requestFail = new Counter("number_of_requests_failed");
export default function () {
  for (const element of ENDPOINTS) {
    const endpoint = element;
    const res = http.get(BASE_URL + endpoint);
    check(res, {
      "is status 200": (r) => r.status === 200,
    });
    if (res.status === 200) {
      // console.log(JSON.stringify(res.json()))
      requestSucceed.add(1);
    } else {
      requestFail.add(1);
    }
  }
}
