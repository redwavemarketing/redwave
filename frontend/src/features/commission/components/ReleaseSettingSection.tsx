/**
 * ReleaseSettingSection — the PROPOSED holdback-release setting (SRS §17). It is **store-only and sticky**
 * (NOT effective-dated): the UI just persists the free-form `release_rule`; Pay Run/Redwave interprets which
 * cycle the 30% releases into. Shown with a ProposedChip + an explicit note so it's never read as final.
 */
import { useForm } from 'react-hook-form';
import { Button, Card, FormField, Input, ProposedChip, useToast } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useCan } from '../../../auth/useCan';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useReleaseSetting } from '../api/useCommission';
import { useSetRelease } from '../api/useCommissionMutations';
import styles from './commission.module.css';

export function ReleaseSettingSection() {
  const canEdit = useCan('commission:edit');
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const q = useReleaseSetting();
  const set = useSetRelease();

  const { register, handleSubmit } = useForm<{ release_rule: string }>({
    values: { release_rule: q.data?.release_rule ?? '' },
  });

  const onSubmit = (values: { release_rule: string }) => {
    if (!values.release_rule.trim()) return;
    set.mutate(
      { release_rule: values.release_rule.trim() },
      { onSuccess: () => toast({ title: 'Release rule saved', tone: 'success' }), onError },
    );
  };

  return (
    <Card title="Holdback release" actions={<ProposedChip />}>
      <DataState isLoading={q.isLoading} isError={q.isError} isEmpty={false} onRetry={() => q.refetch()}>
        <div className={styles.form}>
          <div className={styles.proposedRow}>
            <span>Current rule:</span>
            <span className={styles.releaseValue}>{q.data?.release_rule || 'not set'}</span>
          </div>
          <p className={styles.note}>
            <strong>Proposed (SRS §17) — stored only.</strong> The UI just persists this rule; Pay Run /
            Redwave decides which cycle each period&rsquo;s 30% holdback releases into. Not effective-dated.
          </p>
          {canEdit && (
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
              <FormField label="Release rule" help="Free-form, e.g. next_cycle_after_30_days.">
                <Input {...register('release_rule')} placeholder="next_cycle_after_30_days" />
              </FormField>
              <div className={styles.footer}>
                <Button variant="primary" type="submit" loading={set.isPending}>
                  Save rule
                </Button>
              </div>
            </form>
          )}
        </div>
      </DataState>
    </Card>
  );
}
