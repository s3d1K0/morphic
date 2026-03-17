import { db } from '.'

export type DbInstance = typeof db
export type TxInstance = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * No-op RLS wrapper for local deployment.
 * Executes callback directly with the db instance.
 */
export async function withRLS<T>(
  _userId: string,
  callback: (tx: TxInstance) => Promise<T>
): Promise<T> {
  return await db.transaction(async tx => {
    return await callback(tx)
  })
}

/**
 * No-op optional RLS wrapper for local deployment.
 */
export async function withOptionalRLS<T>(
  _userId: string | null,
  callback: (tx: TxInstance | DbInstance) => Promise<T>
): Promise<T> {
  return callback(db)
}
