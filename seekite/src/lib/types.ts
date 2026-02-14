export interface Member {
  id: string;
  name: string;
  pin_hash: string;
  color: string;
  is_leader: boolean;
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  bible_ref: string;
  bible_text: string;
  question: string;
  worship_date: string;
  created_by: string;
  created_at: string;
  message_count?: number;
  unread_count?: number;
}

export interface Message {
  id: string;
  topic_id: string;
  member_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  member_name?: string;
  member_color?: string;
  reply_to?: Message | null;
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  message_id: string;
  member_id: string;
  type: 'heart' | 'amen' | 'pray';
  member_name?: string;
}

export interface ReadStatus {
  topic_id: string;
  member_id: string;
  last_read_at: string;
}

export interface AuthPayload {
  memberId: string;
  name: string;
  isLeader: boolean;
}
