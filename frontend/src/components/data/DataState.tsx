/**
 * DataState — the reusable loading / error / empty wrapper for data-bound views (§7). Defaults to the
 * Table states (skeleton / error+retry / empty), but accepts custom nodes for non-table screens. Every
 * later screen routes its query's `isLoading`/`isError`/empty through this so states are consistent.
 */
import type { ReactNode } from 'react';
import { TableEmpty, TableError, TableSkeleton } from '../ui';

export interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  errorMessage?: ReactNode;
  /** Override the default skeleton (e.g. for a non-table layout). */
  loadingNode?: ReactNode;
  /** Override the default empty state. */
  emptyNode?: ReactNode;
  children: ReactNode;
}

export function DataState({
  isLoading,
  isError,
  isEmpty = false,
  onRetry,
  errorMessage,
  loadingNode,
  emptyNode,
  children,
}: DataStateProps) {
  if (isLoading) {
    return <>{loadingNode ?? <TableSkeleton rows={5} columns={5} />}</>;
  }
  if (isError) {
    return <TableError message={errorMessage ?? 'Failed to load. Please retry.'} onRetry={onRetry} />;
  }
  if (isEmpty) {
    return <>{emptyNode ?? <TableEmpty message="Nothing here yet." />}</>;
  }
  return <>{children}</>;
}
