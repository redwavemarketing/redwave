/**
 * ClientFormModal — create or edit a client (RHF+zod, the playbook). Soft-deactivate is a separate row
 * action (not this form). A duplicate client_code → 409, surfaced as a toast. Tokens only.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, FormField, Input, Modal, Select, Switch, useToast } from '../../../components/ui';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useCreateClient, useUpdateClient } from '../api/useClientMutations';
import type { Client } from '../clients.types';
import styles from './clients.module.css';

export type ClientFormState = { mode: 'create' } | { mode: 'edit'; client: Client } | null;

const schema = z.object({
  client_code: z.string().min(1, 'Required').max(50),
  name: z.string().min(1, 'Required').max(150),
  market: z.enum(['CA', 'US']),
  supplies_mpu_id: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const MARKET_OPTIONS = [
  { value: 'CA', label: 'Canada (CA)' },
  { value: 'US', label: 'United States (US)' },
];

export function ClientFormModal({ state, onClose }: { state: ClientFormState; onClose: () => void }) {
  const open = state !== null;
  const editing = state?.mode === 'edit' ? state.client : null;
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const create = useCreateClient();
  const update = useUpdateClient();

  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      client_code: editing?.client_code ?? '',
      name: editing?.name ?? '',
      market: editing?.market ?? 'CA',
      supplies_mpu_id: editing?.supplies_mpu_id ?? false,
    },
  });
  const errors = formState.errors;

  const onSubmit = (values: FormValues) => {
    if (editing) {
      update.mutate(
        { id: editing.id, body: values },
        { onSuccess: () => { toast({ title: 'Client updated', tone: 'success' }); onClose(); }, onError },
      );
    } else {
      create.mutate(values, {
        onSuccess: (c) => { toast({ title: 'Client created', description: c.client_code, tone: 'success' }); onClose(); },
        onError,
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} title={editing ? 'Edit client' : 'Create client'}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Client code" required error={errors.client_code?.message} help="Unique — never reused.">
          <Input {...register('client_code')} placeholder="VF" />
        </FormField>
        <FormField label="Name" required error={errors.name?.message}>
          <Input {...register('name')} placeholder="Valley Fiber" />
        </FormField>
        <Controller
          control={control}
          name="market"
          render={({ field }) => (
            <FormField label="Market" required error={errors.market?.message}>
              <Select options={MARKET_OPTIONS} value={field.value} onValueChange={field.onChange} />
            </FormField>
          )}
        />
        <Controller
          control={control}
          name="supplies_mpu_id"
          render={({ field }) => (
            <Switch label="Supplies per-house MPU IDs" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
        <div className={styles.footer}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={create.isPending || update.isPending}>
            {editing ? 'Save changes' : 'Create client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
