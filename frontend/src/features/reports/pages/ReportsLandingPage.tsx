/**
 * ReportsLandingPage — the Reports landing hub (unblocks the previously dead "Reports" nav tab). A
 * hub-of-cards (reusing AdminHubCard) that links to whichever dashboards the caller can see (Business /
 * Operations / Team / My / Leaderboard) plus "coming soon" cards for report exports + cross-period trends.
 * Each card is shown by an access predicate over the auth state (convenience; the server enforces each
 * target — a forbidden dashboard renders its own AccessDenied). No dead nav tab for a permitted role.
 */
import { BarChart3, LayoutDashboard, LineChart, Download, Trophy, UserCircle, Users2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '../../../components/ui';
import { useAuth } from '../../../auth/useAuth';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { AdminHubCard } from '../../admin/components/AdminHubCard';
import styles from './reports.module.css';

interface ReportAccess {
  isSuperAdmin: boolean;
  roles: string[];
  repId: string | null;
  permissions: Set<string>;
}

interface ReportCard {
  title: string;
  description: string;
  icon: ReactNode;
  to?: string;
  show: (a: ReportAccess) => boolean;
}

const canReport = (a: ReportAccess) => a.permissions.has('reports:view');
const isAdmin = (a: ReportAccess) => a.isSuperAdmin || a.roles.includes('Admin');

const CARDS: ReportCard[] = [
  {
    title: 'Business dashboard',
    description: 'Company-wide revenue, payout, and margin (Super Admin only).',
    icon: <LayoutDashboard size={20} />,
    to: '/dashboards/business',
    show: (a) => a.isSuperAdmin,
  },
  {
    title: 'Operations dashboard',
    description: 'Admin queues and operational health across the platform.',
    icon: <BarChart3 size={20} />,
    to: '/dashboards/admin',
    show: isAdmin,
  },
  {
    title: 'Team dashboard',
    description: 'Roster performance and approvals for your team.',
    icon: <Users2 size={20} />,
    to: '/dashboards/manager',
    show: (a) => canReport(a) && (isAdmin(a) || a.roles.includes('Manager')),
  },
  {
    title: 'My dashboard',
    description: 'Your sales, commission, holdback, and tier progress.',
    icon: <UserCircle size={20} />,
    to: '/dashboards/rep',
    show: (a) => !!a.repId,
  },
  {
    title: 'Leaderboard',
    description: 'Company-wide activation rankings (counts only — never money).',
    icon: <Trophy size={20} />,
    to: '/dashboards/leaderboard',
    show: canReport,
  },
  {
    title: 'Report exports',
    description: 'Scheduled and on-demand report exports.',
    icon: <Download size={20} />,
    show: () => true,
  },
  {
    title: 'Cross-period trends',
    description: 'Revenue, payout, and activation trends over time.',
    icon: <LineChart size={20} />,
    show: () => true,
  },
];

export default function ReportsLandingPage() {
  const { isSuperAdmin, roles, repId, permissions } = useAuth();
  const access: ReportAccess = { isSuperAdmin, roles, repId, permissions };
  const visible = CARDS.filter((c) => c.show(access));
  // A "coming soon" card always passes show(); gate the page on whether any LINKED report is reachable.
  const hasLinked = visible.some((c) => c.to);

  if (!hasLinked && !canReport(access)) {
    return <AccessDenied message="Viewing reports requires the reports view permission." />;
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Reports" subtitle="Dashboards and reporting. You see only the views your role permits." />
      <div className={styles.grid}>
        {visible.map((c) => (
          <AdminHubCard key={c.title} title={c.title} description={c.description} icon={c.icon} to={c.to} />
        ))}
      </div>
    </div>
  );
}
