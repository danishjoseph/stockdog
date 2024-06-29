import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateToBigInt1714099179945 implements MigrationInterface {
  name = 'UpdateToBigInt1714099179945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "delivery_data" DROP COLUMN "deliveryQuantity"
        `);
    await queryRunner.query(`
            ALTER TABLE "delivery_data"
            ADD "deliveryQuantity" bigint
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "delivery_data" DROP COLUMN "deliveryQuantity"
        `);
    await queryRunner.query(`
            ALTER TABLE "delivery_data"
            ADD "deliveryQuantity" integer
        `);
  }
}
