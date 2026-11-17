-- Agent 阶段的数据库结构（Cloudflare D1，SQLite 语法）
-- 现在不用执行；等你要给 agent 加"记忆"时再跑：
--   npx wrangler d1 execute personal-site --remote --file=db/schema.sql
-- 或者把这段 SQL 贴进 Cloudflare 控制台 D1 的 Query 面板。

-- 会话
CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,
  title       TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 消息
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  tokens          INTEGER,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages (conversation_id, created_at);

-- 可选：给每个访客发一个匿名 ID，用于限流（配合 KV 更合适，这里留个记录位）
CREATE TABLE IF NOT EXISTS visitors (
  id          TEXT PRIMARY KEY,
  first_seen  INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen   INTEGER NOT NULL DEFAULT (unixepoch()),
  msg_count   INTEGER NOT NULL DEFAULT 0
);
