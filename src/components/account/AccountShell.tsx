'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AccountGw2Provider } from '@/hooks/useAccountGw2';

/** Auth + contexto GW2 compartido para todas las rutas /account. */
export default function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AccountGw2Provider>{children}</AccountGw2Provider>
    </ProtectedRoute>
  );
}
