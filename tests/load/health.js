import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = __ENV.LOAD_BASE_URL ?? 'http://127.0.0.1:4000';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
  },
};

export default function healthLoad() {
  const health = http.get(`${baseUrl}/health`);
  check(health, {
    'health status 200': (response) => response.status === 200,
  });

  const root = http.get(`${baseUrl}/api/v1`);
  check(root, {
    'api root reachable': (response) => response.status === 200,
  });

  sleep(0.2);
}
