export async function onRequestGet(context) {
  const { request } = context;
  const cf = request.cf || {};

  const benchmarks = [
    {
      region: "North America (San Jose)",
      code: "SJC",
      traditionalCloudMs: 78,
      neuronXEdgeMs: 8,
      speedup: "9.7x",
      status: "optimal"
    },
    {
      region: "Europe (Frankfurt)",
      code: "FRA",
      traditionalCloudMs: 142,
      neuronXEdgeMs: 11,
      speedup: "12.9x",
      status: "optimal"
    },
    {
      region: "Asia East (Tokyo)",
      code: "NRT",
      traditionalCloudMs: 178,
      neuronXEdgeMs: 14,
      speedup: "12.7x",
      status: "optimal"
    },
    {
      region: "Southeast Asia (Singapore)",
      code: "SIN",
      traditionalCloudMs: 195,
      neuronXEdgeMs: 12,
      speedup: "16.2x",
      status: "optimal"
    },
    {
      region: "South Asia (Chennai/Mumbai)",
      code: "MAA",
      traditionalCloudMs: 215,
      neuronXEdgeMs: 9,
      speedup: "23.8x",
      status: "optimal"
    },
    {
      region: "South America (São Paulo)",
      code: "GRU",
      traditionalCloudMs: 220,
      neuronXEdgeMs: 18,
      speedup: "12.2x",
      status: "optimal"
    },
    {
      region: "United Kingdom (London)",
      code: "LHR",
      traditionalCloudMs: 124,
      neuronXEdgeMs: 10,
      speedup: "12.4x",
      status: "optimal"
    },
    {
      region: "Oceania (Sydney)",
      code: "SYD",
      traditionalCloudMs: 245,
      neuronXEdgeMs: 17,
      speedup: "14.4x",
      status: "optimal"
    }
  ];

  return new Response(JSON.stringify({
    currentVisitorColo: cf.colo || "SJC",
    visitorCountry: cf.country || "US",
    timestamp: new Date().toISOString(),
    benchmarks: benchmarks
  }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60"
    }
  });
}
