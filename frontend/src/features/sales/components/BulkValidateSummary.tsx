/** Shows a warning Banner listing the sales a batch-validate could NOT validate (e.g. not Entered). */
import { Banner } from '../../../components/ui';
import type { BulkValidateResult } from '../sales.types';

export function BulkValidateSummary({ result }: { result: BulkValidateResult }) {
  if (result.failed === 0) return null;
  const reasons = result.results
    .filter((r) => !r.ok)
    .map((r) => r.error)
    .filter(Boolean)
    .slice(0, 4)
    .join('; ');
  return (
    <Banner tone="warning" title={`${result.validated} validated · ${result.failed} skipped`}>
      {reasons || 'Some selected sales were not in an Entered state.'}
    </Banner>
  );
}
