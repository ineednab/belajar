import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import type { Db, SQLValue } from '../types';

let sqlJs: Promise<SqlJsStatic> | null = null;

/** An in-memory SQLite implementing the app's `Db` interface. No SQLCipher. */
export class TestDb implements Db {
  closed = false;

  constructor(readonly raw: Database) {}

  async execAsync(source: string): Promise<void> {
    this.raw.exec(source);
  }

  async runAsync(source: string, ...params: SQLValue[]) {
    this.raw.run(source, params);
    const row = this.raw.exec('SELECT last_insert_rowid() AS id')[0];
    return { changes: this.raw.getRowsModified(), lastInsertRowId: Number(row?.values[0][0] ?? 0) };
  }

  async getFirstAsync<T>(source: string, ...params: SQLValue[]): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, ...params);
    return rows[0] ?? null;
  }

  async getAllAsync<T>(source: string, ...params: SQLValue[]): Promise<T[]> {
    const statement = this.raw.prepare(source);
    try {
      statement.bind(params);
      const rows: T[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    this.raw.exec('BEGIN');
    try {
      await task();
      this.raw.exec('COMMIT');
    } catch (error) {
      this.raw.exec('ROLLBACK');
      throw error;
    }
  }

  async closeAsync(): Promise<void> {
    this.closed = true;
    this.raw.close();
  }
}

export async function createTestDb(): Promise<TestDb> {
  sqlJs ??= initSqlJs();
  const SQL = await sqlJs;
  return new TestDb(new SQL.Database());
}
