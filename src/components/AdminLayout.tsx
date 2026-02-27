import { ReactNode } from 'react';
import BaseLayout, { type NavItem } from './BaseLayout';

const navItems: NavItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/system-instructions', label: 'System Instructions', icon: '📝' },
  { path: '/admin/manage-managers', label: 'Manage Managers', icon: '👔' },
  { path: '/admin/enroll-user', label: 'Enroll User', icon: '👤' },
  { path: '/admin/manage-users', label: 'Manage Users', icon: '📋' },
  { path: '/admin/slots', label: 'Interview Slots', icon: '⏰' },
  { path: '/admin/schedule-interview', label: 'Schedule Interview', icon: '📅' },
  { path: '/admin/gemini-usage', label: 'Gemini Usage', icon: '💎' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout
      navItems={navItems}
      panelTitle="Codegnan Admin Panel"
      headerSubtitle="Manage your interview platform"
      defaultHeaderTitle="Admin Dashboard"
    >
      {children}
    </BaseLayout>
  );
}
