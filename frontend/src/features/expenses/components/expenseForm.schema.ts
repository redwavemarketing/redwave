/**
 * Shared schema + payload builder for the expense entry form. The km amount is NEVER built client-side
 * (server computes it) — km items send `km` (trip/total/stops, lat/lng stubbed '0'); non-km items send
 * `amount` (+ receipt where the config requires). Receipt-required is config-driven (passed in). Lives in
 * its own module so the form + nested field components share the types without a circular import.
 */
import { z } from 'zod';
import type { CreateReportBody, ExpenseItemInput, TripType } from '../expenses.types';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONEY = /^\d+(\.\d{1,2})?$/;
const KM = /^\d+(\.\d{1,6})?$/;

export interface StopValue {
  address: string;
}
export interface ItemValue {
  category: string;
  expense_date: string;
  client_id?: string;
  description: string;
  amount?: string;
  receipt_url?: string;
  trip_type?: TripType;
  total_km?: string;
  stops?: StopValue[];
}
export interface ExpenseFormValues {
  week_start: string;
  week_end: string;
  rep_id?: string;
  items: ItemValue[];
}

/** Build the zod schema; `requiresReceipt(category)` comes from the field configs (dynamic). */
export function makeExpenseSchema(requiresReceipt: (category: string) => boolean) {
  const item = z
    .object({
      category: z.string().min(1, 'Pick a category'),
      expense_date: z.string().regex(DATE, 'Date required'),
      client_id: z.string().optional(),
      description: z.string().min(1, 'Required').max(255),
      amount: z.string().optional(),
      receipt_url: z.string().optional(),
      trip_type: z.enum(['single', 'round']).optional(),
      total_km: z.string().optional(),
      stops: z.array(z.object({ address: z.string().min(1, 'Address required') })).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.category === 'km') {
        if (!val.trip_type) ctx.addIssue({ code: 'custom', path: ['trip_type'], message: 'Pick a trip type' });
        if (!val.total_km || !KM.test(val.total_km)) ctx.addIssue({ code: 'custom', path: ['total_km'], message: 'Enter the total km' });
        if (!val.stops || val.stops.length < 2) ctx.addIssue({ code: 'custom', path: ['stops'], message: 'Add at least 2 stops' });
      } else {
        if (!val.amount || !MONEY.test(val.amount)) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Enter an amount' });
        if (requiresReceipt(val.category) && !val.receipt_url) ctx.addIssue({ code: 'custom', path: ['receipt_url'], message: 'Receipt required for this category' });
      }
    });

  return z
    .object({
      week_start: z.string().regex(DATE, 'Week start required'),
      week_end: z.string().regex(DATE, 'Week end required'),
      rep_id: z.string().optional(),
      items: z.array(item).min(1, 'Add at least one item'),
    })
    .superRefine((val, ctx) => {
      // One km log per day (the server also enforces this with a 422).
      const kmDates = val.items.filter((i) => i.category === 'km').map((i) => i.expense_date);
      const dup = kmDates.find((d, i) => kmDates.indexOf(d) !== i);
      if (dup) ctx.addIssue({ code: 'custom', path: ['items'], message: `Only one km log per day (duplicate ${dup})` });
    });
}

/** Build the API payload from validated form values (km amount omitted — server computes it). */
export function buildReportBody(values: ExpenseFormValues): CreateReportBody {
  const items: ExpenseItemInput[] = values.items.map((it) => {
    const base = {
      category: it.category as ExpenseItemInput['category'],
      client_id: it.client_id || undefined,
      expense_date: it.expense_date,
      description: it.description,
    };
    if (it.category === 'km') {
      return {
        ...base,
        km: {
          trip_type: it.trip_type!,
          total_km: it.total_km!,
          // lat/lng stubbed — no geocoder in scope (§12 follow-up); the server computes the amount.
          stops: (it.stops ?? []).map((s, i) => ({ stop_order: i, address: s.address, lat: '0', lng: '0' })),
        },
      };
    }
    return { ...base, amount: it.amount!, receipt_url: it.receipt_url || undefined };
  });

  return { week_start: values.week_start, week_end: values.week_end, rep_id: values.rep_id || undefined, items };
}

/** A fresh blank item for a given category (km gets a trip type + two empty stops). */
export function blankItem(category: string, expense_date: string): ItemValue {
  if (category === 'km') {
    return { category, expense_date, description: '', trip_type: 'round', total_km: '', stops: [{ address: '' }, { address: '' }] };
  }
  return { category, expense_date, description: '', amount: '', receipt_url: undefined };
}
