import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appStates = sqliteTable("app_states", {
  userKey: text("user_key").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
