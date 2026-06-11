import { check, sleep } from 'k6';
import http from 'k6/http';

const baseUrl = __ENV.LOAD_BASE_URL ?? 'http://127.0.0.1:4000';
const email = __ENV.LOAD_TEST_EMAIL;
const password = __ENV.LOAD_TEST_PASSWORD;

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<500'],
  },
};

export function setup() {
  if (!email || !password) {
    throw new Error('LOAD_TEST_EMAIL and LOAD_TEST_PASSWORD are required');
  }

  const loginResponse = http.post(
    `${baseUrl}/api/v1/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (loginResponse.status !== 200) {
    throw new Error(`Login failed: ${String(loginResponse.status)}`);
  }

  const body = loginResponse.json();
  return { accessToken: body.accessToken };
}

export default function authenticatedRead(data) {
  const headers = {
    Authorization: `Bearer ${data.accessToken}`,
    'Content-Type': 'application/json',
  };

  const me = http.get(`${baseUrl}/api/v1/users/me`, { headers });
  check(me, { 'users/me 200': (response) => response.status === 200 });

  const dashboard = http.get(`${baseUrl}/api/v1/analytics/dashboard`, { headers });
  check(dashboard, {
    'dashboard 200': (response) => response.status === 200,
  });

  sleep(0.5);
}
