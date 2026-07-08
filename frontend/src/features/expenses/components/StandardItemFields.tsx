/**
 * StandardItemFields — the non-km item sub-form: date + amount (MoneyInput) + description + receipt. The
 * receipt is REQUIRED when the category config says so (config-driven, EXP-003); the server is the real
 * gate. The Client tag is a COMMON field (lifted to ExpenseItemRow so km items get it too). Uses the form
 * context. Tokens only.
 */
import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker, FormField, Input, MoneyInput } from '../../../components/ui';
import { ReceiptField } from './ReceiptField';
import type { ExpenseFormValues } from './expenseForm.schema';
import styles from './expenses.module.css';

export function StandardItemFields({
  index,
  requiresReceipt,
}: {
  index: number;
  requiresReceipt: boolean;
}) {
  const { control, register, formState } = useFormContext<ExpenseFormValues>();
  const itemErrors = formState.errors.items?.[index];

  return (
    <>
      <div className={styles.itemGrid}>
        <Controller
          control={control}
          name={`items.${index}.expense_date`}
          render={({ field }) => (
            <FormField label="Date" required error={itemErrors?.expense_date?.message}>
              <DatePicker value={field.value ?? ''} onChange={field.onChange} invalid={!!itemErrors?.expense_date} aria-label="Expense date" />
            </FormField>
          )}
        />
        <FormField label="Amount" required error={itemErrors?.amount?.message}>
          <MoneyInput {...register(`items.${index}.amount`)} placeholder="0.00" />
        </FormField>
      </div>

      <FormField label="Description" required error={itemErrors?.description?.message}>
        <Input placeholder="Lunch with client" {...register(`items.${index}.description`)} />
      </FormField>

      <Controller
        control={control}
        name={`items.${index}.receipt_url`}
        render={({ field, fieldState }) => (
          <FormField
            label="Receipt"
            required={requiresReceipt}
            error={fieldState.error?.message}
            help={requiresReceipt ? 'Mandatory for this category.' : 'Optional.'}
          >
            <ReceiptField value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />
    </>
  );
}
