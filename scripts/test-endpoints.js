import { onRequestGet as statusHandler } from '../functions/api/status.js';
import { onRequestGet as benchmarkHandler } from '../functions/api/benchmark.js';
import { onRequestPost as generateHandler } from '../functions/api/generate.js';
import { onRequestPost as waitlistHandler } from '../functions/api/waitlist.js';

async function testAll() {
  console.log("=== Testing Neuron-X Edge Functions ===");

  // 1. Status
  const statusRes = await statusHandler({
    request: new Request("http://localhost/api/status", {
      headers: { "cf-ray": "test-ray-1234" }
    }),
    env: {}
  });
  const statusJson = await statusRes.json();
  console.log("✓ /api/status ->", statusJson.status, "| Edge Colo:", statusJson.edgeNode.colo);

  // 2. Benchmark
  const benchRes = await benchmarkHandler({
    request: new Request("http://localhost/api/benchmark"),
    env: {}
  });
  const benchJson = await benchRes.json();
  console.log("✓ /api/benchmark ->", benchJson.benchmarks.length, "regions reported.");

  // 3. Generate (JSON non-stream test)
  const genRes = await generateHandler({
    request: new Request("http://localhost/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Rust KV Cache", stream: false })
    }),
    env: {}
  });
  const genJson = await genRes.json();
  console.log("✓ /api/generate -> model:", genJson.model, "| tokens:", genJson.usage.completionTokens);

  // 4. Waitlist
  const waitRes = await waitlistHandler({
    request: new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "founder@neuron-x.tech", teamSize: "1-10" })
    }),
    env: {}
  });
  const waitJson = await waitRes.json();
  console.log("✓ /api/waitlist -> provisioned key:", waitJson.apiKey);

  console.log("=== ALL ENDPOINTS PASSED SUCCESSFULLY! ===");
}

testAll().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
