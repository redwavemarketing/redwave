-- Product-type catalogue: turn the fixed `ProductType` enum into a configurable, behaviour-classified
-- catalogue the Super Admin can extend at runtime. Hand-authored so it applies with `prisma migrate deploy`
-- without a shadow database. All statements are transactional (no `ALTER TYPE ... ADD VALUE` here), so the
-- whole migration runs atomically.
--
-- The 4 core types keep their LOCKED commission behaviour (#5 tally / #9 greenfield); new types added later
-- are always standard_addon. Columns convert enum -> text in place (enum labels are identical strings, so the
-- conversion is value-preserving), then we add FKs to the catalogue and drop the now-unused enum.

-- 1) Behaviour classification enum.
CREATE TYPE "ProductTypeBehaviour" AS ENUM ('tiered', 'greenfield', 'standard_addon');

-- 2) The catalogue table (natural PK = key, referenced by the product_type columns).
CREATE TABLE "product_type_catalogue" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "behaviour" "ProductTypeBehaviour" NOT NULL,
    "is_system" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_type_catalogue_pkey" PRIMARY KEY ("key")
);

-- 3) Seed the 4 core types with their locked behaviour BEFORE adding FKs (so existing rows validate).
--    is_system = true: behaviour immutable, non-deletable, non-deactivatable. (bootstrap re-upserts these.)
INSERT INTO "product_type_catalogue" ("key", "label", "behaviour", "is_system", "is_active") VALUES
  ('internet',            'Internet',            'tiered',         true, true),
  ('greenfield_internet', 'Greenfield Internet', 'greenfield',     true, true),
  ('tv',                  'TV',                  'standard_addon', true, true),
  ('home_phone',          'Home Phone',          'standard_addon', true, true)
ON CONFLICT ("key") DO NOTHING;

-- 4) Convert every product_type column from the enum to text (value-preserving).
ALTER TABLE "products"              ALTER COLUMN "product_type"       TYPE TEXT USING "product_type"::text;
ALTER TABLE "sale_items"            ALTER COLUMN "product_type"       TYPE TEXT USING "product_type"::text;
ALTER TABLE "commission_flat_rates" ALTER COLUMN "product_type"       TYPE TEXT USING "product_type"::text;
ALTER TABLE "incentives"            ALTER COLUMN "scope_product_type" TYPE TEXT USING "scope_product_type"::text;

-- 5) Add FKs to the catalogue (sale_items is a frozen snapshot — NO FK, #2).
ALTER TABLE "products"
  ADD CONSTRAINT "products_product_type_fkey"
  FOREIGN KEY ("product_type") REFERENCES "product_type_catalogue"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commission_flat_rates"
  ADD CONSTRAINT "commission_flat_rates_product_type_fkey"
  FOREIGN KEY ("product_type") REFERENCES "product_type_catalogue"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "incentives"
  ADD CONSTRAINT "incentives_scope_product_type_fkey"
  FOREIGN KEY ("scope_product_type") REFERENCES "product_type_catalogue"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6) Drop the now-unused enum.
DROP TYPE "ProductType";
