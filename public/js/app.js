// Neuron-X Client Runtime & Audio Engine
document.addEventListener("DOMContentLoaded", () => {
  initAudio();
  initTelemetry();
  initTerminal();
  initBenchmarks();
  initCalculator();
  initCodeViewer();
  initWaitlistModal();
});

/* =========================================================
   1. Native Web Audio FX Engine (Zero external audio assets)
   ========================================================= */
let audioCtx = null;
let soundEnabled = false;

function initAudio() {
  const toggleBtn = document.getElementById("soundToggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    soundEnabled = !soundEnabled;
    toggleBtn.classList.toggle("active", soundEnabled);
    toggleBtn.innerHTML = soundEnabled 
      ? `<span>🔊</span> AUDIO: ON` 
      : `<span>🔇</span> AUDIO: OFF`;
    
    if (soundEnabled) {
      playTone(660, 0.05, "sine", 0.08);
    }
  });
}

function playTone(freq, duration, type = "sine", gain = 0.05) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore audio errors
  }
}

function playKeyClick() {
  playTone(800 + Math.random() * 400, 0.02, "triangle", 0.02);
}

function playStreamTick() {
  playTone(1200 + Math.random() * 200, 0.015, "sine", 0.015);
}

/* =========================================================
   2. Live Edge Telemetry (Pings /api/status)
   ========================================================= */
async function initTelemetry() {
  const coloEl = document.getElementById("telemetryColo");
  const rayEl = document.getElementById("telemetryRay");
  const latencyEl = document.getElementById("telemetryLatency");
  const protocolEl = document.getElementById("telemetryProtocol");

  async function fetchStatus() {
    const t0 = performance.now();
    try {
      const res = await fetch("/api/status");
      const rtt = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        if (coloEl) coloEl.textContent = data.edgeNode.colo;
        if (rayEl) rayEl.textContent = data.edgeNode.rayId.slice(0, 14);
        if (latencyEl) latencyEl.textContent = `${rtt}ms`;
        if (protocolEl) protocolEl.textContent = data.edgeNode.httpProtocol || "HTTP/3";
      }
    } catch (e) {
      // Local or fallback
      if (coloEl) coloEl.textContent = "SJC";
      if (rayEl) rayEl.textContent = "local-dev";
      if (latencyEl) latencyEl.textContent = "12ms";
    }
  }

  fetchStatus();
  setInterval(fetchStatus, 30000);
}

/* =========================================================
   3. Interactive Terminal / Neural Playground
   ========================================================= */
function initTerminal() {
  const promptInput = document.getElementById("promptInput");
  const runBtn = document.getElementById("runInferenceBtn");
  const outputEl = document.getElementById("terminalOutput");
  const modelSelect = document.getElementById("modelSelect");
  const presetPills = document.querySelectorAll(".preset-pill");
  
  const statTtft = document.getElementById("statTtft");
  const statTokSec = document.getElementById("statTokSec");
  const statTokens = document.getElementById("statTokens");
  const statEdgeNode = document.getElementById("statEdgeNode");

  const presets = {
    rust: "Write an ultra low-latency Rust KV Cache with paged zero-copy blocks.",
    speculative: "Explain Neuron-X speculative decoding architecture across Cloudflare edge.",
    benchmark: "Compare P99 latency of centralized GPU clusters vs distributed edge mesh."
  };

  presetPills.forEach(pill => {
    pill.addEventListener("click", () => {
      presetPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      playKeyClick();
      const key = pill.dataset.preset;
      if (presets[key]) {
        promptInput.value = presets[key];
      }
    });
  });

  if (runBtn && promptInput && outputEl) {
    runBtn.addEventListener("click", runInference);
    promptInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        runInference();
      }
    });
  }

  let isGenerating = false;

  async function runInference() {
    if (isGenerating) return;
    const prompt = (promptInput.value || "").trim();
    if (!prompt) return;

    isGenerating = true;
    runBtn.disabled = true;
    runBtn.textContent = "GENERATING...";
    outputEl.innerHTML = "";
    playTone(440, 0.08, "sawtooth", 0.04);

    const model = modelSelect ? modelSelect.value : "neuron-x-9b-speculative";

    // Create cursor
    const cursor = document.createElement("span");
    cursor.className = "cursor-blink";
    outputEl.appendChild(cursor);

    const startTime = performance.now();
    let firstTokenReceived = false;
    let tokenCount = 0;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          model: model,
          stream: true
        })
      });

      if (!res.ok) {
        throw new Error(`Inference error: HTTP ${res.status}`);
      }

      if (statEdgeNode) {
        statEdgeNode.textContent = res.headers.get("X-Neuron-Edge-PoP") || "EDGE-SJC";
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop(); // keep last incomplete chunk

        for (const line of lines) {
          if (!line.trim()) continue;

          // Check for meta event
          if (line.includes("event: meta")) {
            const dataStr = line.split("data: ")[1];
            if (dataStr) {
              const meta = JSON.parse(dataStr);
              if (statTtft) statTtft.textContent = `${meta.ttftMs}ms`;
            }
            continue;
          }

          // Check for data line
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                const ttft = Math.round(performance.now() - startTime);
                if (statTtft) statTtft.textContent = `${ttft}ms`;
              }

              if (data.token) {
                tokenCount++;
                cursor.before(data.token);
                outputEl.scrollTop = outputEl.scrollHeight;

                const elapsedSec = (performance.now() - startTime) / 1000;
                const currentTps = (tokenCount / elapsedSec).toFixed(1);
                if (statTokSec) statTokSec.textContent = `${currentTps} tok/s`;
                if (statTokens) statTokens.textContent = tokenCount;

                if (tokenCount % 3 === 0) playStreamTick();
              }
            } catch (err) {
              // Raw text chunk fallback
              cursor.before(jsonStr);
            }
          }
        }
      }

      playTone(880, 0.1, "sine", 0.05);

    } catch (err) {
      cursor.before(`\n[Execution Error: ${err.message}]`);
    } finally {
      cursor.remove();
      isGenerating = false;
      runBtn.disabled = false;
      runBtn.textContent = "RUN EDGE INFERENCE";
    }
  }
}

/* =========================================================
   4. Global Latency Benchmark Matrix
   ========================================================= */
async function initBenchmarks() {
  const container = document.getElementById("matrixRows");
  if (!container) return;

  try {
    const res = await fetch("/api/benchmark");
    if (!res.ok) throw new Error("Benchmark fetch failed");
    const data = await res.json();
    renderBenchmarks(data.benchmarks);
  } catch (e) {
    // Fallback static benchmarks
    renderBenchmarks([
      { region: "North America (San Jose)", code: "SJC", traditionalCloudMs: 78, neuronXEdgeMs: 8, speedup: "9.7x" },
      { region: "Europe (Frankfurt)", code: "FRA", traditionalCloudMs: 142, neuronXEdgeMs: 11, speedup: "12.9x" },
      { region: "Asia East (Tokyo)", code: "NRT", traditionalCloudMs: 178, neuronXEdgeMs: 14, speedup: "12.7x" },
      { region: "South Asia (Chennai/Mumbai)", code: "MAA", traditionalCloudMs: 215, neuronXEdgeMs: 9, speedup: "23.8x" },
      { region: "Southeast Asia (Singapore)", code: "SIN", traditionalCloudMs: 195, neuronXEdgeMs: 12, speedup: "16.2x" },
      { region: "South America (São Paulo)", code: "GRU", traditionalCloudMs: 220, neuronXEdgeMs: 18, speedup: "12.2x" }
    ]);
  }

  function renderBenchmarks(list) {
    container.innerHTML = list.map(item => `
      <div class="matrix-row">
        <div>
          <strong>${item.region}</strong>
          <span style="color: var(--text-muted); font-size: 0.72rem; margin-left: 6px;">[${item.code}]</span>
        </div>
        <div>
          <span style="color: var(--thermal-orange);">${item.traditionalCloudMs}ms</span>
          <div class="latency-bar-wrap">
            <div class="latency-bar-fill red" style="width: ${Math.min(100, (item.traditionalCloudMs / 250) * 100)}%;"></div>
          </div>
        </div>
        <div>
          <span style="color: var(--phosphor-green); font-weight: 700;">${item.neuronXEdgeMs}ms</span>
          <div class="latency-bar-wrap">
            <div class="latency-bar-fill green" style="width: ${Math.max(5, (item.neuronXEdgeMs / 250) * 100)}%;"></div>
          </div>
        </div>
        <div style="color: var(--electric-cyan); font-weight: 700; text-align: right;">
          ${item.speedup}
        </div>
      </div>
    `).join("");
  }
}

/* =========================================================
   5. Interactive Unit Economics / TCO Calculator
   ========================================================= */
function initCalculator() {
  const tokenSlider = document.getElementById("tokensSlider");
  const tokenLabel = document.getElementById("tokenSliderValue");
  const cloudCostEl = document.getElementById("cloudCostValue");
  const neuronCostEl = document.getElementById("neuronCostValue");
  const savingsPctEl = document.getElementById("savingsPct");
  const monthlySavingsEl = document.getElementById("monthlySavings");

  if (!tokenSlider) return;

  function update() {
    const millions = parseFloat(tokenSlider.value);
    tokenLabel.textContent = millions >= 1000 
      ? `${(millions / 1000).toFixed(1)}B Tokens/mo` 
      : `${millions}M Tokens/mo`;

    // Pricing formulas:
    // Traditional Dedicated Cloud GPU Cluster (e.g. 4x H100 with idle provisioning waste):
    // Minimum base $3,200/mo + $4.80 per million tokens
    const traditional = Math.round(3200 + millions * 4.8);

    // Neuron-X Serverless Edge Mesh:
    // $0 base, pure usage: $0.85 per million tokens (FP8 Quantized Mesh)
    const neuron = Math.round(millions * 0.85);

    const savings = traditional - neuron;
    const savingsPercent = Math.round((savings / traditional) * 100);

    if (cloudCostEl) cloudCostEl.textContent = `$${traditional.toLocaleString()}`;
    if (neuronCostEl) neuronCostEl.textContent = `$${neuron.toLocaleString()}`;
    if (savingsPctEl) savingsPctEl.textContent = `${savingsPercent}% Cost Reduction`;
    if (monthlySavingsEl) monthlySavingsEl.textContent = `$${savings.toLocaleString()}`;
  }

  tokenSlider.addEventListener("input", () => {
    update();
    playKeyClick();
  });
  update();
}

/* =========================================================
   6. Multi-language SDK Viewer & Copy Snippets
   ========================================================= */
function initCodeViewer() {
  const tabs = document.querySelectorAll(".code-tab");
  const codeContent = document.getElementById("sdkCodeContent");
  const copyBtn = document.getElementById("copyCodeBtn");

  const snippets = {
    curl: `curl https://neuron-x.tech/api/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nx_live_demo_key" \\
  -d '{
    "model": "neuron-x-9b-speculative",
    "prompt": "Synthesize a zero-copy tensor pipeline in C++",
    "stream": true,
    "temperature": 0.2
  }'`,

    ts: `import { NeuronXClient } from "@neuron-x/sdk";

// Initialize Edge Client with automatic PoP Anycast routing
const client = new NeuronXClient({
  apiKey: process.env.NEURON_X_API_KEY,
  edgeRegion: "auto" // Automatically chooses lowest RTT edge
});

const stream = await client.inference.stream({
  model: "neuron-x-9b-speculative",
  prompt: "Synthesize a zero-copy tensor pipeline in C++",
  temperature: 0.2
});

for await (const chunk of stream) {
  process.stdout.write(chunk.token);
  // Telemetry: chunk.edgeColo, chunk.ttftMs
}`,

    python: `import os
import asyncio
from neuron_x import AsyncNeuronX

async def main():
    client = AsyncNeuronX(api_key=os.environ["NEURON_X_API_KEY"])
    
    stream = await client.inference.stream(
        model="neuron-x-9b-speculative",
        prompt="Synthesize a zero-copy tensor pipeline in C++",
        speculative_routing=True
    )
    
    async for chunk in stream:
        print(chunk.token, end="", flush=True)

asyncio.run(main())`
  };

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      playKeyClick();
      const lang = tab.dataset.lang;
      if (snippets[lang] && codeContent) {
        codeContent.textContent = snippets[lang];
      }
    });
  });

  if (copyBtn && codeContent) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeContent.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "COPIED!";
        playTone(900, 0.05, "sine", 0.06);
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      });
    });
  }
}

/* =========================================================
   7. Waitlist & API Key Provisioning Modal
   ========================================================= */
function initWaitlistModal() {
  const modal = document.getElementById("waitlistModal");
  const openBtns = document.querySelectorAll(".open-waitlist-btn");
  const closeBtn = document.getElementById("closeModalBtn");
  const form = document.getElementById("waitlistForm");
  const resultBox = document.getElementById("waitlistResult");
  const apiKeyDisplay = document.getElementById("generatedApiKey");

  openBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (modal) modal.classList.add("active");
      playKeyClick();
    });
  });

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("waitlistEmail").value;
      const teamSize = document.getElementById("waitlistTeam").value;
      const submitBtn = form.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      submitBtn.textContent = "PROVISIONING SANDBOX...";
      playTone(520, 0.06, "sine", 0.05);

      try {
        const res = await fetch("/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, teamSize })
        });

        const data = await res.json();
        if (res.ok) {
          form.style.display = "none";
          resultBox.style.display = "block";
          if (apiKeyDisplay) apiKeyDisplay.textContent = data.apiKey;
          playTone(880, 0.15, "triangle", 0.08);
        } else {
          alert(data.error || "Submission failed");
        }
      } catch (err) {
        alert("Failed to submit. Please verify network.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "REQUEST IMMEDIATE ACCESS";
      }
    });
  }
}
