import { MigrationInterface, QueryRunner } from "typeorm";

export class CorporateAction1787899265979 implements MigrationInterface {
    name = 'CorporateAction1787899265979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."corporate_action_type_enum" AS ENUM('SPLIT', 'BONUS', 'RIGHTS', 'DIVIDEND')
        `);
        await queryRunner.query(`
            CREATE TABLE "corporate_action" (
                "id" SERIAL NOT NULL,
                "type" "public"."corporate_action_type_enum" NOT NULL,
                "effectiveDate" date NOT NULL,
                "oldFaceValue" double precision,
                "newFaceValue" double precision,
                "bonusNumerator" integer,
                "bonusDenominator" integer,
                "description" character varying(255),
                "recordDate" date,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "assetId" integer NOT NULL,
                CONSTRAINT "UQ_5f9a6ef3ac1b1574f84f40a38c4" UNIQUE ("assetId", "effectiveDate", "type"),
                CONSTRAINT "PK_4861def1567e381ad0f19c12ef6" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "corporate_action"
            ADD CONSTRAINT "FK_20cd0b37752f4288a1c8f7eec51" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "corporate_action" DROP CONSTRAINT "FK_20cd0b37752f4288a1c8f7eec51"
        `);
        await queryRunner.query(`
            DROP TABLE "corporate_action"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."corporate_action_type_enum"
        `);
    }

}
