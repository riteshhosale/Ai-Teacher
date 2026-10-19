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

test("CORS allows the configured production frontend origin", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://ai-teacher-seven-jade.vercel.app" },
  });

  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://ai-teacher-seven-jade.vercel.app"
  );
});

test("CORS rejects arbitrary Vercel preview origins", async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://untrusted-preview.vercel.app" },
  });

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("learning profile update endpoint is mounted and requires authentication", async () => {
  const response = await fetch(`${baseUrl}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ learningGoal: "Learn safely" }),
  });
  assert.equal(response.status, 401);
});

test("auth endpoints validate empty registration and login bodies", async () => {
  const register = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(register.status, 400);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(login.status, 400);
});

test("protected learning feature APIs reject requests without a token", async () => {
  const endpoints = [
    "/api/material/upload",
    "/api/lesson/generate",
    "/api/adaptive/evaluate",
    "/api/rag/ask",
    "/api/assessment/report",
    "/api/speech/generate",
    "/api/realtime/session",
    "/api/video/generate",
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 401, `${endpoint} should require authentication`);
  }
});
