import AdminAuthProvider from '../../components/AdminAuthProvider';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
