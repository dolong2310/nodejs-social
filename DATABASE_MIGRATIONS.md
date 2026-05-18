# Database Migrations

Project nay dung Umzug de chay migration cho ca MongoDB va Postgres. App startup chi `connect` database, khong tu tao schema/index nua. Truoc khi chay app hoac seed data, phai chay migration script tuong ung voi database dang dung.

## Thu muc

```txt
src/infrastructure/persistence/mongodb/migrations/
src/infrastructure/persistence/postgres/migrations/
```

Moi file migration export `up` va co the export `down`.

MongoDB migration nhan `context` la `Db`:

```ts
import type { Db } from 'mongodb';

export async function up({ context: db }: { context: Db }): Promise<void> {
  await db.collection('users').createIndex({ email: 1 });
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  await db.collection('users').dropIndex('email_1');
}
```

Postgres migration nhan `context` la `Pool`:

```ts
import type { Pool } from 'pg';

export async function up({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;');
}

export async function down({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query('ALTER TABLE users DROP COLUMN IF EXISTS nickname;');
}
```

## Chay migration

MongoDB:

```bash
pnpm run db:migrate:mongo --env=development
```

Postgres:

```bash
pnpm run db:migrate:postgres --env=development
```

Nen chay lenh nay o local/dev/staging/prod truoc khi start app. Vi du local:

```bash
pnpm run db:migrate:postgres --env=development
pnpm run dev
```

Neu dung MongoDB:

```bash
pnpm run db:migrate:mongo --env=development
pnpm run dev
```

Staging/prod thi doi env:

```bash
pnpm run db:migrate:postgres --env=staging
pnpm run db:migrate:postgres --env=production
```

## Kiem tra migration

Xem migration chua chay:

```bash
pnpm run db:migrations:pending:mongo --env=development
pnpm run db:migrations:pending:postgres --env=development
```

Xem migration da chay:

```bash
pnpm run db:migrations:executed:mongo --env=development
pnpm run db:migrations:executed:postgres --env=development
```

MongoDB luu lich su migration trong collection `schema_migrations`. Postgres luu lich su migration trong table `schema_migrations`.

## Rollback

Rollback 1 migration moi nhat:

```bash
pnpm run db:rollback:mongo --env=development
pnpm run db:rollback:postgres --env=development
```

Rollback nhieu migration:

```bash
pnpm run db:rollback:postgres --env=development --step 2
```

Rollback ve dau:

```bash
pnpm run db:rollback:postgres --env=development --to 0
```

Can can than khi rollback staging/prod vi `down` co the xoa column, index, collection hoac table.

## Tao migration moi

MongoDB:

```bash
pnpm run db:migration:create:mongo --env=development --name add-user-last-login.ts
```

Postgres:

```bash
pnpm run db:migration:create:postgres --env=development --name add-user-last-login.ts
```

Umzug se them timestamp prefix vao ten file. Sau khi tao file, viet logic trong `up` va `down`, roi chay:

```bash
pnpm run db:migrate:postgres --env=development
```

hoac:

```bash
pnpm run db:migrate:mongo --env=development
```

## Seed data

Seed scripts khong chay migration nua. Thu tu dung la:

```bash
pnpm run db:migrate:postgres --env=development
pnpm run seed:permissions:postgres
pnpm run seed:create-admin-user:postgres
```

hoac:

```bash
pnpm run db:migrate:mongo --env=development
pnpm run seed:permissions:mongo
pnpm run seed:create-admin-user:mongo
```

## Nguyen tac viet migration

- Moi thay doi schema/index phai nam trong file migration moi.
- Khong sua migration da chay tren shared environment; tao migration moi de sua tiep.
- Dat ten migration theo hanh dong ro rang, vi du `add-posts-visibility-index.ts`.
- `up` ap dung thay doi, `down` revert thay doi neu co the.
