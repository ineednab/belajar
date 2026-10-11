/**
 * The subset of expo-sqlite's `SQLiteDatabase` the app relies on. Depending on this instead of
 * expo-sqlite directly lets migrations and repositories run against an in-memory SQLite in
 * Node tests (see `__tests__/test-db.ts`).
 */
export type SQLValue = string | number | null;

export interface Db {
  execAsync(source: string): Promise<void>;
  runAsync(
    source: string,
    ...params: SQLValue[]
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(source: string, ...params: SQLValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SQLValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}
