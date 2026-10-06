import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArtworks1791313192906 implements MigrationInterface {
  name = 'CreateArtworks1791313192906';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."artwork_type" AS ENUM('painting', 'sculpture', 'photography', 'drawing', 'print', 'digital')`,
    );
    await queryRunner.query(
      `CREATE TABLE "artworks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" character varying(99) NOT NULL, "artist" character varying(50) NOT NULL, "type" "public"."artwork_type" NOT NULL, "price" numeric(12,2) NOT NULL, "availability" boolean NOT NULL DEFAULT true, "image_url" character varying(2048), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "artworks_price_positive" CHECK ("price" > 0), CONSTRAINT "PK_e452ea65fb5958274badfe245de" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "artworks_artist_idx" ON "artworks"  ("artist") `);
    await queryRunner.query(`CREATE INDEX "artworks_type_idx" ON "artworks"  ("type") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."artworks_type_idx"`);
    await queryRunner.query(`DROP INDEX "public"."artworks_artist_idx"`);
    await queryRunner.query(`DROP TABLE "artworks"`);
    await queryRunner.query(`DROP TYPE "public"."artwork_type"`);
  }
}
