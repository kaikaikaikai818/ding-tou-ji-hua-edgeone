import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { appStates } from "../../../db/schema";

function userKey(request: Request) {
  return request.headers.get("oai-authenticated-user-email") ?? "owner";
}

export async function GET(request: Request) {
  const db = await getDb();
  const [row] = await db.select().from(appStates).where(eq(appStates.userKey, userKey(request))).limit(1);
  return Response.json({ state: row ? JSON.parse(row.payload) : null, updatedAt: row?.updatedAt ?? null });
}

export async function PUT(request: Request) {
  const payload = await request.json();
  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "无效数据" }, { status: 400 });
  }
  const key = userKey(request);
  const updatedAt = Date.now();
  const db = await getDb();
  await db.insert(appStates).values({ userKey: key, payload: JSON.stringify(payload), updatedAt })
    .onConflictDoUpdate({ target: appStates.userKey, set: { payload: JSON.stringify(payload), updatedAt } });
  return Response.json({ ok: true, updatedAt });
}
