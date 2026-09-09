import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeBseTurnover1788935844838 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE trading_data td
            SET turnover = td.turnover / 100000
            FROM asset_exchange ae
            JOIN exchange e ON e.id = ae."exchangeId"
            WHERE td."assetExchangeId" = ae.id
              AND e.abbreviation = 'BSE'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE trading_data td
            SET turnover = td.turnover * 100000
            FROM asset_exchange ae
            JOIN exchange e ON e.id = ae."exchangeId"
            WHERE td."assetExchangeId" = ae.id
              AND e.abbreviation = 'BSE'
        `);
    }

}
