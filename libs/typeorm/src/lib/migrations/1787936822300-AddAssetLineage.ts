import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssetLineage1787936822300 implements MigrationInterface {
  name = 'AddAssetLineage1787936822300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD "previousAssetId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "assets"
      ADD CONSTRAINT "FK_assets_previous_asset"
      FOREIGN KEY ("previousAssetId") REFERENCES "assets"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_assets_previousAssetId" ON "assets" ("previousAssetId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "IDX_assets_previousAssetId"
    `);
    await queryRunner.query(`
      ALTER TABLE "assets" DROP CONSTRAINT "FK_assets_previous_asset"
    `);
    await queryRunner.query(`
      ALTER TABLE "assets" DROP COLUMN "previousAssetId"
    `);
  }
}
