import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1714097701336 implements MigrationInterface {
  name = 'InitialSetup1714097701336';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "assets" (
                "id" SERIAL NOT NULL,
                "isin" character varying(50) NOT NULL,
                "symbol" character varying(50),
                "name" character varying(255) NOT NULL,
                "assetExchangeCode" character varying(50),
                "faceValue" double precision NOT NULL,
                "industry" character varying(50),
                "sector" character varying(50),
                CONSTRAINT "UQ_adc14321968e73ca3b26444f36c" UNIQUE ("isin"),
                CONSTRAINT "PK_da96729a8b113377cfb6a62439c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "exchange" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "abbreviation" character varying NOT NULL,
                CONSTRAINT "UQ_38d9819cca963bfebe00e5302f8" UNIQUE ("name", "abbreviation"),
                CONSTRAINT "PK_cbd4568fcb476b57cebd8239895" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "trading_data" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "open" double precision NOT NULL,
                "high" double precision NOT NULL,
                "low" double precision NOT NULL,
                "close" double precision NOT NULL,
                "lastPrice" double precision NOT NULL,
                "previousClose" double precision NOT NULL,
                "volume" bigint NOT NULL,
                "turnover" double precision NOT NULL,
                "totalTrades" integer,
                "assetExchangeId" integer,
                CONSTRAINT "UQ_d09147975848a5d6acbd65d3a0e" UNIQUE ("date", "assetExchangeId"),
                CONSTRAINT "PK_e2dc47f2c072c491710bf997109" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "asset_exchange" (
                "id" SERIAL NOT NULL,
                "assetId" integer,
                "exchangeId" integer,
                CONSTRAINT "UQ_35a085d033767e92d957b3c92c3" UNIQUE ("assetId", "exchangeId"),
                CONSTRAINT "PK_7b1798c8ec6843971061a3208ad" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "delivery_data" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "deliveryQuantity" integer,
                "deliveryPercentage" integer,
                "assetExchangeId" integer,
                CONSTRAINT "UQ_85107d5b1a4952f5ab2d96709ba" UNIQUE ("date", "assetExchangeId"),
                CONSTRAINT "PK_9a17a5fbddaca467af6b59c14aa" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "trading_data"
            ADD CONSTRAINT "FK_d7d64e2e052e4312dd41551f036" FOREIGN KEY ("assetExchangeId") REFERENCES "asset_exchange"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "asset_exchange"
            ADD CONSTRAINT "FK_9f520b83d4c501d2fa34b30c3ed" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "asset_exchange"
            ADD CONSTRAINT "FK_f384144c492cc368c4621e2d85a" FOREIGN KEY ("exchangeId") REFERENCES "exchange"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "delivery_data"
            ADD CONSTRAINT "FK_df64a5eb621b3849fdc07770931" FOREIGN KEY ("assetExchangeId") REFERENCES "asset_exchange"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "delivery_data" DROP CONSTRAINT "FK_df64a5eb621b3849fdc07770931"
        `);
    await queryRunner.query(`
            ALTER TABLE "asset_exchange" DROP CONSTRAINT "FK_f384144c492cc368c4621e2d85a"
        `);
    await queryRunner.query(`
            ALTER TABLE "asset_exchange" DROP CONSTRAINT "FK_9f520b83d4c501d2fa34b30c3ed"
        `);
    await queryRunner.query(`
            ALTER TABLE "trading_data" DROP CONSTRAINT "FK_d7d64e2e052e4312dd41551f036"
        `);
    await queryRunner.query(`
            DROP TABLE "delivery_data"
        `);
    await queryRunner.query(`
            DROP TABLE "asset_exchange"
        `);
    await queryRunner.query(`
            DROP TABLE "trading_data"
        `);
    await queryRunner.query(`
            DROP TABLE "exchange"
        `);
    await queryRunner.query(`
            DROP TABLE "assets"
        `);
  }
}
