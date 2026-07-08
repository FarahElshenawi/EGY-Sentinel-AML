/**
 * App layout — wraps all /app/* routes with the sidebar.
 * Marketing routes (/, /product, etc.) use the (marketing) layout instead.
 */
import Sidebar from '@/components/organisms/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)' }}>
        {children}
      </div>
    </div>
  );
}
