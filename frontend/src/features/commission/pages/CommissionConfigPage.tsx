/**
 * CommissionConfigPage — the REP-commission config (SRS §7), SEPARATE from Clients (#3). A stacked page of
 * sections, each reusing the shared EffectiveDatedTable (#10): tier schedule (contiguity-validated bracket
 * editor; storage only, #5), flat rates (internet excluded), holdback split (100% check), the PROPOSED
 * holdback-release setting, and incentives (per_activation; target_based deferred). `commission:view` to
 * see; edit actions gated `commission:edit`; the server enforces (§5). 403 → AccessDenied.
 */
import { PageHeader } from '../../../components/ui';
import { useCan } from '../../../auth/useCan';
import { AccessDenied } from '../../dashboards/components/AccessDenied';
import { TierSchedulesSection } from '../components/TierSchedulesSection';
import { FlatRatesSection } from '../components/FlatRatesSection';
import { HoldbackSplitSection } from '../components/HoldbackSplitSection';
import { ReleaseSettingSection } from '../components/ReleaseSettingSection';
import { IncentivesSection } from '../components/IncentivesSection';
import styles from '../components/commission.module.css';

export default function CommissionConfigPage() {
  const canView = useCan('commission:view');
  if (!canView) {
    return <AccessDenied message="Viewing commission config requires the commission view permission." />;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Commission Configuration"
        subtitle="The rep-commission stream — tiers, flat rates, holdback, and incentives. Effective-dated; changes apply prospectively."
      />
      <TierSchedulesSection />
      <FlatRatesSection />
      <HoldbackSplitSection />
      <ReleaseSettingSection />
      <IncentivesSection />
    </div>
  );
}
