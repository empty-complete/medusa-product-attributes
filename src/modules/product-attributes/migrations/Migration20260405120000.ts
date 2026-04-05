import { Migration } from "@mikro-orm/migrations"

export class Migration20260405120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "category_custom_attribute" (
        "id" text NOT NULL,
        "key" text NOT NULL,
        "type" text NOT NULL DEFAULT 'text',
        "label" text NOT NULL DEFAULT '',
        "unit" text NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "category_id" text NOT NULL,
        "is_standard" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "category_custom_attribute_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_category_custom_attribute_category_id"
        ON "category_custom_attribute" ("category_id")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_category_custom_attribute_deleted_at"
        ON "category_custom_attribute" ("deleted_at")
        WHERE "deleted_at" IS NOT NULL;
    `)

    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_custom_attribute" (
        "id" text NOT NULL,
        "product_id" text NOT NULL,
        "value" text NOT NULL,
        "value_numeric" integer NULL,
        "value_file" text NULL,
        "category_custom_attribute_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "product_custom_attribute_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "product_custom_attribute_category_custom_attribute_id_foreign"
          FOREIGN KEY ("category_custom_attribute_id")
          REFERENCES "category_custom_attribute" ("id")
          ON UPDATE CASCADE ON DELETE CASCADE
      );
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_product_id"
        ON "product_custom_attribute" ("product_id")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_category_custom_attribute_id"
        ON "product_custom_attribute" ("category_custom_attribute_id")
        WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_custom_attribute_deleted_at"
        ON "product_custom_attribute" ("deleted_at")
        WHERE "deleted_at" IS NOT NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_custom_attribute" CASCADE;`)
    this.addSql(`DROP TABLE IF EXISTS "category_custom_attribute" CASCADE;`)
  }
}
