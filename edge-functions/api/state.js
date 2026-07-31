const STATE_KEY = "owner_state";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async function onRequest({ request }) {
  if (request.method === "GET") {
    const value = await APP_DATA.get(STATE_KEY, { type: "json" });
    return json({
      state: value?.state ?? null,
      updatedAt: value?.updatedAt ?? null,
    });
  }

  if (request.method === "PUT") {
    let state;
    try {
      state = await request.json();
    } catch {
      return json({ error: "无效数据" }, 400);
    }

    if (!state || typeof state !== "object" || Array.isArray(state)) {
      return json({ error: "无效数据" }, 400);
    }

    const updatedAt = Date.now();
    await APP_DATA.put(STATE_KEY, JSON.stringify({ state, updatedAt }));
    return json({ ok: true, updatedAt });
  }

  return json({ error: "Method not allowed" }, 405);
}
