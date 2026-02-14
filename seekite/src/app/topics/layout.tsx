import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function TopicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect('/');
  }

  return <>{children}</>;
}
