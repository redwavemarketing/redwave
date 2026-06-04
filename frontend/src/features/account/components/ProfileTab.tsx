/**
 * ProfileTab — view the profile + edit HR fields AS A REQUEST (never a live write — SRS AUTH-011). On save
 * the changed fields POST a profile_change_request (pending); the live profile is unchanged and a pending
 * banner appears until a reviewer approves. While a change is pending the form is disabled (one request at
 * a time). Reuses the playbook: TanStack Query + RHF+zod + FormField + DataState + toast. Tokens only.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar, Badge, Button, FormField, Input, useToast } from '../../../components/ui';
import { DataState } from '../../../components/data/DataState';
import { useApiErrorToast } from '../../../lib/api/apiError';
import { useAccountProfile } from '../api/useAccount';
import { useRequestProfileChange } from '../api/useAccountMutations';
import { PendingChangeBanner } from './PendingChangeBanner';
import type { AccountProfile, ProfileChangeRequestBody } from '../account.types';
import styles from './account.module.css';

const schema = z.object({
  full_name: z.string().min(1, 'Required').max(150),
  phone: z.string().max(50).optional(),
  avatar_url: z.string().max(1024).optional(),
});
type FormValues = z.infer<typeof schema>;

function ProfileEditForm({ profile }: { profile: AccountProfile }) {
  const { toast } = useToast();
  const onError = useApiErrorToast();
  const req = useRequestProfileChange();

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name,
      phone: profile.phone ?? '',
      avatar_url: profile.avatar_url ?? '',
    },
  });
  const errors = formState.errors;

  const onSubmit = (values: FormValues) => {
    // Submit ONLY the fields that actually changed (the backend needs ≥1).
    const body: ProfileChangeRequestBody = {};
    if (values.full_name !== profile.full_name) body.full_name = values.full_name;
    if ((values.phone ?? '') !== (profile.phone ?? '')) body.phone = values.phone ?? '';
    if ((values.avatar_url ?? '') !== (profile.avatar_url ?? '')) body.avatar_url = values.avatar_url ?? '';

    if (Object.keys(body).length === 0) {
      toast({ title: 'No changes to submit', tone: 'info' });
      return;
    }
    req.mutate(body, {
      onSuccess: () =>
        toast({
          title: 'Submitted for review',
          description: 'Your profile updates once a reviewer approves — it is not changed live.',
          tone: 'success',
        }),
      onError,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className={styles.help}>
        Editing your name, phone, or avatar creates a <strong>change request</strong> — it is reviewed before
        it applies, so your live profile won&rsquo;t change until then. (Your theme, by contrast, applies
        instantly — see Preferences.)
      </p>
      <FormField label="Full name" required error={errors.full_name?.message}>
        <Input {...register('full_name')} />
      </FormField>
      <FormField label="Phone" error={errors.phone?.message}>
        <Input {...register('phone')} placeholder="(204) 555-0123" />
      </FormField>
      <FormField label="Avatar URL" error={errors.avatar_url?.message} help="A link to an image (file upload is coming later).">
        <Input {...register('avatar_url')} placeholder="https://…" />
      </FormField>
      <div className={styles.actions}>
        <Button variant="primary" type="submit" loading={req.isPending}>
          Submit for review
        </Button>
      </div>
    </form>
  );
}

export function ProfileTab() {
  const q = useAccountProfile();
  return (
    <DataState isLoading={q.isLoading} isError={q.isError} isEmpty={false} onRetry={() => q.refetch()}>
      {q.data && (
        <div className={styles.stack}>
          <div className={styles.header}>
            <Avatar name={q.data.full_name} src={q.data.avatar_url} size="lg" />
            <div className={styles.identity}>
              <span className={styles.name}>{q.data.full_name}</span>
              <span className={styles.email}>{q.data.email}</span>
            </div>
            <Badge tone={q.data.status === 'active' ? 'success' : 'muted'}>
              {q.data.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {q.data.change_pending && q.data.pending_request ? (
            <>
              <PendingChangeBanner request={q.data.pending_request} />
              <p className={styles.help}>You can submit another change once this one is reviewed.</p>
            </>
          ) : (
            <ProfileEditForm profile={q.data} />
          )}
        </div>
      )}
    </DataState>
  );
}
