import { NextResponse } from 'next/server';
import { sql, initializeDatabase } from '@/lib/db';
import { hashPin } from '@/lib/auth';

const SEED_MEMBERS = [
  { name: '은혜', color: '#E8D5C4', is_leader: true },
  { name: '준호', color: '#C4D7E0', is_leader: false },
  { name: '수진', color: '#D4E0C4', is_leader: false },
  { name: '민수', color: '#E0D4E8', is_leader: false },
  { name: '지영', color: '#E8E0C4', is_leader: false },
];

export async function GET() {
  try {
    await initializeDatabase();

    const pinHash = await hashPin('1234');

    for (const member of SEED_MEMBERS) {
      const existing = await sql`
        SELECT id FROM members WHERE name = ${member.name}
      `;
      if (existing.rows.length === 0) {
        await sql`
          INSERT INTO members (name, pin_hash, color, is_leader)
          VALUES (${member.name}, ${pinHash}, ${member.color}, ${member.is_leader})
        `;
      }
    }

    return NextResponse.json({ message: 'Database initialized and seed data inserted' });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}
