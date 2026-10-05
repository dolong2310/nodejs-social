import type { Db } from 'mongodb';

export async function up({ context: db }: { context: Db }): Promise<void> {
  await db.collection('payments').updateMany(
    {},
    {
      $set: {
        created_by_id: null,
        updated_by_id: null,
        deleted_at: null,
        deleted_by_id: null
      }
    }
  );
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  await db.collection('payments').updateMany(
    {},
    {
      $unset: {
        created_by_id: '',
        updated_by_id: '',
        deleted_at: '',
        deleted_by_id: ''
      }
    }
  );
}
