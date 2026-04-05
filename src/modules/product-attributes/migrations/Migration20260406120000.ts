import { Migration } from "@mikro-orm/migrations"

export class Migration20260406120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "attribute_preset" (
        "id" text NOT NULL,
        "key" text NOT NULL,
        "label" text NOT NULL,
        "type" text NOT NULL DEFAULT 'text',
        "unit" text NULL,
        "description" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "attribute_preset_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_attribute_preset_deleted_at"
        ON "attribute_preset" ("deleted_at")
        WHERE "deleted_at" IS NOT NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "attribute_preset" CASCADE;`)
  }
}
