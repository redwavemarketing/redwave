/**
 * Reconciliation queries — the finance tie-out. Statement tie-out is billing:view; pay-run tie-out is
 * payrun:view (server-enforced). Read-only. Responses `never`-typed → cast. — SRS §12
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { unwrap } from '../../../lib/query/unwrap';
import type { PayRunTieOut, StatementTieOut } from '../reconciliation.types';

export function useStatementTieOut(clientId: string | undefined, payPeriodId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['reconciliation', 'statement', clientId, payPeriodId],
    queryFn: () =>
      unwrap<StatementTieOut>(
        api.GET('/v1/reconciliation/statements', { params: { query: { client_id: clientId as string, pay_period_id: payPeriodId as string } } }),
      ),
    enabled: enabled && !!clientId && !!payPeriodId,
  });
}

export function usePayRunTieOut(runId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['reconciliation', 'payrun', runId],
    queryFn: () => unwrap<PayRunTieOut>(api.GET('/v1/reconciliation/pay-runs/{id}', { params: { path: { id: runId as string } } })),
    enabled: enabled && !!runId,
  });
}
