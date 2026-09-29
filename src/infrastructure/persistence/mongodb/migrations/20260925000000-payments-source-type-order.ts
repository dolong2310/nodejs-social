import type { Db } from 'mongodb';

export async function up({ context: db }: { context: Db }): Promise<void> {
  await db.collection('payments').updateMany({ source_type: 'example' }, { $set: { source_type: 'order' } });
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  await db.collection('payments').updateMany({ source_type: 'order' }, { $set: { source_type: 'example' } });
}
