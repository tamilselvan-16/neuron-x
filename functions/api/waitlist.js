export async function onRequestPost(context) {
  const { request } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  try {
    const data = await request.json().catch(() => ({}));
    const email = (data.email || "").trim().toLowerCase();
    const teamSize = data.teamSize || "1-10";
    const useCase = data.useCase || "Edge Inference API";

    if (!email || !email.includes("@") || !email.includes(".")) {
      return new Response(JSON.stringify({ error: "Invalid email address format." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Generate simulated cryptographic development token
    const rawBytes = new Uint8Array(16);
    crypto.getRandomValues(rawBytes);
    const keySuffix = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const apiKey = `nx_live_${keySuffix}`;

    const queuePosition = Math.floor(Math.random() * 45) + 12;

    return new Response(JSON.stringify({
      success: true,
      message: "Priority edge sandbox credentials provisioned.",
      email: email,
      apiKey: apiKey,
      tier: "Early Infrastructure Access (Tier-0)",
      queuePosition: queuePosition,
      allocatedCredits: "$250.00 (50M Tokens)",
      edgeEndpoint: "https://neuron-x.tech/api/generate",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
