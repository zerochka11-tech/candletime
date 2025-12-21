import { Metadata } from 'next';
import AdminGuard from '../components/AdminGuard';
import { ToastContainer } from '@/components/admin/Toast';

export const metadata: Metadata = {
  title: 'Админ-панель: Настройки | CandleTime',
  description: 'Управление настройками сайта CandleTime',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Админ-панель: Настройки
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Управление настройками и функциями сайта
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
      <ToastContainer />
    </AdminGuard>
  );
}

