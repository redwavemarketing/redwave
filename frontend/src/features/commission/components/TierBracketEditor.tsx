/**
 * TierBracketEditor — the 4-tier bracket grid (the custom piece). STORAGE + CONTIGUITY VALIDATION ONLY —
 * it never determines which tier a count falls into (#5: the engine owns tiering). A `useFieldArray` of
 * brackets (tier_number, min, max + "open top" toggle, rate); the live contiguity error (mirroring the
 * backend `validateTierBrackets`) is computed by the parent and shown here, blocking submit. A read-only
 * preview echoes the resulting ranges. Tokens only.
 */
import { Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Banner, Button, IconButton, Input, MoneyInput, Switch } from '../../../components/ui';
import { money } from '../../../lib/format/money';
import { blankBracket, type TierFormValues } from './tierForm';
import styles from './commission.module.css';

export function TierBracketEditor({ error }: { error: string | null }) {
  const { control, register } = useFormContext<TierFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'tiers' });
  const tiers = useWatch({ control, name: 'tiers' }) ?? [];

  return (
    <div>
      <div className={styles.bracketHead}>
        <span>Tier</span>
        <span>Min tally</span>
        <span>Max tally</span>
        <span>Rate / activation</span>
        <span />
      </div>
      <div className={styles.brackets}>
        {fields.map((f, i) => (
          <div className={styles.bracketRow} key={f.id}>
            <Input aria-label={`Tier number ${i + 1}`} inputMode="numeric" {...register(`tiers.${i}.tier_number`)} />
            <Input aria-label={`Min tally ${i + 1}`} inputMode="numeric" placeholder="0" {...register(`tiers.${i}.min_count`)} />
            <Controller
              control={control}
              name={`tiers.${i}.open`}
              render={({ field }) => (
                <span className={styles.openCell}>
                  <Input
                    aria-label={`Max tally ${i + 1}`}
                    inputMode="numeric"
                    placeholder={field.value ? '∞' : 'e.g. 6'}
                    disabled={field.value}
                    {...register(`tiers.${i}.max_count`)}
                  />
                  <Switch aria-label={`Open top ${i + 1}`} checked={field.value} onCheckedChange={field.onChange} label="Open" />
                </span>
              )}
            />
            <MoneyInput aria-label={`Rate ${i + 1}`} {...register(`tiers.${i}.rate_per_activation`)} placeholder="0.00" />
            <IconButton
              label={`Remove tier ${i + 1}`}
              icon={<Trash2 size={15} />}
              variant="outline"
              size="sm"
              disabled={fields.length <= 1}
              onClick={() => remove(i)}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-2)' }}>
        <Button variant="tertiary" size="sm" type="button" leftIcon={<Plus size={14} />} onClick={() => append(blankBracket())}>
          Add tier
        </Button>
      </div>

      {error ? (
        <Banner tone="warning" title="Fix the schedule">
          {error}
        </Banner>
      ) : (
        <div className={styles.preview}>
          {[...tiers]
            .map((t, i) => ({ t, i }))
            .sort((a, b) => Number(a.t.min_count) - Number(b.t.min_count))
            .map(({ t, i }) => (
              <div className={styles.previewRow} key={i}>
                <span>
                  Tier {t.tier_number || '—'}: <span className="mono">{t.min_count || '0'}</span>–
                  <span className="mono">{t.open ? '∞' : t.max_count || '?'}</span> activations
                </span>
                <span className="mono">{money(t.rate_per_activation)} each</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
