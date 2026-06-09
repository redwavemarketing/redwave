/**
 * Edit a single expense item. — SRS EXP-006/007
 * The full item content is re-submitted and REPLACES the item's fields (km log/stops re-derived).
 * Who may edit is gated in the service: pre-approval requires `expenses:edit`; once approved, only a
 * Super Admin may edit (EXP-007).
 */
import { ExpenseItemInput } from './expense-item.input';

export class UpdateExpenseItemDto extends ExpenseItemInput {}
