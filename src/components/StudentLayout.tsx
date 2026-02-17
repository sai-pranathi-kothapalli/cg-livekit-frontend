import { ReactNode } from 'react';
import BaseLayout, { type NavItem } from './BaseLayout';

const navItems: NavItem[] = [
  { path: '/student/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/student/my-interviews', label: 'My Interviews', icon: '📅' },
  { path: '/student/overall-analysis', label: 'Overall Analysis', icon: '📈' },
  { path: '/student/application-form', label: 'Resume', icon: '📄' },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <BaseLayout
      navItems={navItems}
      panelTitle="Codegnan Student Portal"
      headerSubtitle="Welcome to your student portal"
      defaultHeaderTitle="Student Dashboard"
      logoLinkTo="/student/dashboard"
    >
      {children}
    </BaseLayout>
  );
}
