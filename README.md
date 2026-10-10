# Neuron-X (neuron-x.tech)
### The Distributed Tensor Mesh for Real-Time Edge Intelligence

Neuron-X is a high-throughput, edge-native neural inference engine designed to eliminate the physical network transit penalties inherent to centralized hyperscaler GPU clusters (AWS, GCP, Azure).

By coupling speculative token drafting with Cloudflare's global Anycast edge network (310+ cities worldwide), Neuron-X terminates TLS at the user's nearest Point of Presence (PoP) and delivers **sub-15ms Time-To-First-Token (TTFT)**.

* **Live Cloudflare Site**: [https://neuron-x.pages.dev](https://neuron-x.pages.dev)
* **Custom Domain (Configured)**: [https://neuron-x.tech](https://neuron-x.tech) (and `https://www.neuron-x.tech`)
* **GitHub Repository**: [https://github.com/tamilselvan-16/neuron-x](https://github.com/tamilselvan-16/neuron-x)

---

## 1. Domain & DNS Analysis for `neuron-x.tech`

An authoritative DNS reconnaissance on `neuron-x.tech` reveals the following current DNS topology:

### Assigned Cloudflare Nameservers (Ready):
* **`annalise.ns.cloudflare.com`**
* **`nicolas.ns.cloudflare.com`**

### Active DNS Records Configured on Cloudflare:
| Type | Name | Content / Target | Proxy |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` | `neuron-x.pages.dev` | **Proxied (Orange Cloud)** |
| **CNAME** | `www` | `neuron-x.pages.dev` | **Proxied (Orange Cloud)** |
| **MX** | `@` | `mx.zoho.in` (Priority 10) | DNS Only |
| **MX** | `@` | `mx2.zoho.in` (Priority 20) | DNS Only |
| **MX** | `@` | `mx3.zoho.in` (Priority 50) | DNS Only |
| **TXT** | `@` | `zoho-verification=...` & `v=spf1 ...` | DNS Only |

### SOA (Start of Authority) Record:
* **Primary Server**: `tech-domains.mercury.orderbox-dns.com`
* **Administrator Email**: `rahultech72216.gmail.com`
* **Default TTL**: `38400` seconds (approx. 10.6 hours)
* **Serial**: `2026071307`
* **Current A/AAAA Record**: None currently pointing to any active web server.
* **Registrar / DNS Provider**: Radix / LogicBoxes OrderBox DNS platform (commonly used by ResellerClub, BigRock, Namecheap, and direct Radix .tech registrar portals).

---

## 2. Cloudflare Migration & Name Server Transfer Procedure

To achieve zero-downtime migration and activate Cloudflare's Anycast edge caching, DDoS protection, and Pages/Workers hosting:

### Step 1: Add Domain to Cloudflare
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Click **+ Add a Domain** and enter `neuron-x.tech`.
3. Choose the **Free** plan (or Pro if using enterprise features).
4. Cloudflare will scan existing records.

### Step 2: Note Assigned Cloudflare Name Servers
Cloudflare will assign two unique Anycast name servers (e.g., `amy.ns.cloudflare.com` and `charlie.ns.cloudflare.com`).

### Step 3: Update Name Servers at the Registrar
1. Log in to the registrar where `neuron-x.tech` was purchased (where the OrderBox DNS panel is managed).
2. Go to **Domain Management** -> **Name Servers**.
3. Select **Custom Nameservers** and replace the existing `tech-domains.*.orderbox-dns.com` addresses with the two Cloudflare nameservers provided in Step 2.
4. Save the changes. Propagation typically completes within 10 to 60 minutes.

### Step 4: Configure DNS Records in Cloudflare
Once active in Cloudflare:
| Type | Name | Content / Target | Proxy Status |
| :--- | :--- | :--- | :--- |
| **CNAME** | `@` (root) | `neuron-x.pages.dev` | Proxied (Orange Cloud) |
| **CNAME** | `www` | `neuron-x.pages.dev` | Proxied (Orange Cloud) |

### Step 5: Recommended Cloudflare Edge Settings
* **SSL/TLS Encryption Mode**: `Full (Strict)`
* **Always Use HTTPS**: Enabled
* **HTTP/3 (with QUIC)**: Enabled
* **Brotli Compression**: Enabled
* **Early Hints**: Enabled

---

## 3. Architecture & Antislop Philosophy

This website was built rejecting generic AI SaaS tropes (no purple-blue gradient spheres, no generic 3-card templates, no meaningless marketing buzzwords).

### Core Features:
1. **Live Neural Inference Terminal**:
   - Interactive model selection (`Neuron-X 9B Speculative`, `TensorMesh-Coder-V2`, `Neuron-X Dense-70B`).
   - True streaming token output via Server-Sent Events (SSE).
   - Real-time TTFT, tokens/sec ticker, and active edge PoP telemetry.
2. **Global Latency Benchmark Matrix**:
   - Empirical roundtrip comparison across 8 global edge nodes (`SJC`, `FRA`, `NRT`, `SIN`, `MAA`, `GRU`, `LHR`, `SYD`) vs centralized US-East cloud.
3. **Interactive TCO / Unit Economics Calculator**:
   - Real-time dynamic calculation comparing dedicated H100 GPU cluster waste against serverless edge mesh.
4. **Developer Integration & Multi-language SDK**:
   - Interactive code viewer for `cURL`, `TypeScript (Cloudflare Workers)`, and `Python`.
5. **Early Access & Sandbox Key Provisioning**:
   - Instant sandbox key generation (`nx_live_...`) with validated priority queue assignment.
6. **Web Audio Synthesizer**:
   - Native browser Web Audio API mechanical sound effects with mute toggle.

---

## 4. Cloudflare Edge API Endpoints

The project uses Cloudflare Pages Functions located in `/functions/api/`:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Returns live edge telemetry (visitor PoP, CF Ray ID, RTT, system load). |
| `/api/generate` | `POST` | Streams AI completions via SSE or JSON with telemetry headers. |
| `/api/benchmark` | `GET` | Delivers real-time latency matrix data across global regions. |
| `/api/waitlist` | `POST` | Validates developer registration and issues test API tokens. |

---

## 5. Local Development & Deployment

### Run Locally:
```bash
# Run automated tests
npm test

# Run local Cloudflare Pages preview with Functions
npx wrangler pages dev public
```

### Deploy to Cloudflare Pages:
```bash
# Authenticate wrangler (one-time)
npx wrangler login

# Deploy public assets and edge functions
npx wrangler pages deploy public --project-name=neuron-x
```

### GitHub Repository Setup via `gh`:
```bash
# Authenticate GitHub CLI
gh auth login

# Create and push repository
gh repo create neuron-x --public --source=. --push
```

---

## License
MIT &copy; 2026 Neuron-X Technologies
