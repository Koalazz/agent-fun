import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard basePath={process.env.BASE_PATH || ''} />;
}
