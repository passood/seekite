import { sql } from '@vercel/postgres';

export { sql };

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL UNIQUE,
      pin_hash VARCHAR(255) NOT NULL,
      color VARCHAR(20) NOT NULL,
      is_leader BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(200) NOT NULL,
      bible_ref VARCHAR(100) NOT NULL,
      bible_text TEXT NOT NULL,
      question TEXT,
      worship_date DATE NOT NULL,
      created_by UUID REFERENCES members(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      member_id UUID REFERENCES members(id),
      content TEXT NOT NULL,
      reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
      member_id UUID REFERENCES members(id),
      type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(message_id, member_id, type)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS read_status (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
      member_id UUID REFERENCES members(id),
      last_read_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(topic_id, member_id)
    )
  `;
}
