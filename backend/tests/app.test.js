process.env.GEMINI_API_KEY ||= "qa-test-key-for-import-only";
process.env.JWT_SECRET ||= "qa-test-jwt-secret-that-is-at-least-thirty-two-characters";

const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("../src/app");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

test("root endpoint reports the API is running", async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);
});

test("health endpoint reports its dependency state", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.ok([200, 503].includes(response.status));
  const body = await response.json();
  assert.ok(["healthy", "degraded"].includes(body.status));
  assert.equal(body.services.api, "up");
});

test("learning profile endpoint is mounted and requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/profile`);
  assert.equal(response.status, 401);
});

test("unknown API routes return 404", async () => {
  const response = await fetch(`${baseUrl}/api/qa-route-that-does-not-exist`);
  assert.equal(response.status, 404);
});
