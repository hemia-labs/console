import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781912406582 implements MigrationInterface {
    name = 'Migration1781912406582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."audit_event_status" AS ENUM('success', 'failure')`);
        await queryRunner.query(`CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_subject" character varying(255), "actor_source" character varying(40) NOT NULL, "action" character varying(180) NOT NULL, "resource" character varying(120) NOT NULL, "resource_id" character varying(255), "status" "public"."audit_event_status" NOT NULL, "http_method" character varying(12) NOT NULL, "route" character varying(500) NOT NULL, "hemia_id_path" character varying(500), "hemia_id_request_id" character varying(255), "metadata" jsonb NOT NULL DEFAULT '{}', "error_code" character varying(80), "error_message" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_hemia_id_request_id" ON "audit_events"  ("hemia_id_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_status" ON "audit_events"  ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_action" ON "audit_events"  ("action") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_resource_resource_id" ON "audit_events"  ("resource", "resource_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_actor_subject" ON "audit_events"  ("actor_subject") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_events_created_at" ON "audit_events"  ("created_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_actor_subject"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_resource_resource_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_action"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_events_hemia_id_request_id"`);
        await queryRunner.query(`DROP TABLE "audit_events"`);
        await queryRunner.query(`DROP TYPE "public"."audit_event_status"`);
    }

}
