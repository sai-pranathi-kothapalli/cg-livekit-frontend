import { ReactNode } from 'react';
import BaseLayout, { type NavItem } from './BaseLayout';

const navItems: NavItem[] = [
  { path: '/manager/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/manager/enroll-user', label: 'Enroll Candidate', icon: '👤' },
  { path: '/manager/manage-users', label: 'Manage Candidates', icon: '📋' },
  { path: '/manager/slots', label: 'Interview Slots', icon: '⏰' },
  { path: '/manager/schedule-interview', label: 'Schedule Interview', icon: '📅' },
];

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout
      navItems={navItems}
      panelTitle="Codegnan Manager Panel"
      headerSubtitle="Manage interviews and slots"
      defaultHeaderTitle="Manager Dashboard"
      roleBadge={{ label: 'Manager', bgClass: 'bg-blue-100', textClass: 'text-blue-800' }}
    >
      {children}
    </BaseLayout>
  );
}
