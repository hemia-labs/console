import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1781912406582 implements MigrationInterface {
    name = 'Migration1781912406582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."audit_event_status" AS ENUM('success', 'failure'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

        if (!(await queryRunner.hasTable('audit_events'))) {
            await queryRunner.query(`CREATE TABLE "audit_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_subject" character varying(255), "actor_source" character varying(40) NOT NULL, "action" character varying(180) NOT NULL, "resource" character varying(120) NOT NULL, "resource_id" character varying(255), "status" "public"."audit_event_status" NOT NULL, "http_method" character varying(12) NOT NULL, "route" character varying(500) NOT NULL, "hemia_id_path" character varying(500), "hemia_id_request_id" character varying(255), "metadata" jsonb NOT NULL DEFAULT '{}', "error_code" character varying(80), "error_message" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_910f64d901a5c3e9878f0d4a407" PRIMARY KEY ("id"))`);
        } else {
            await this.addColumn(queryRunner, 'actor_subject', 'character varying(255)');
            await this.addColumn(queryRunner, 'actor_source', `character varying(40) NOT NULL DEFAULT 'legacy'`);
            await this.addColumn(queryRunner, 'action', `character varying(180) NOT NULL DEFAULT 'legacy'`);
            await this.addColumn(queryRunner, 'resource', 'character varying(120)');
            await this.addColumn(queryRunner, 'resource_id', 'character varying(255)');
            await this.addColumn(queryRunner, 'status', `"public"."audit_event_status" NOT NULL DEFAULT 'success'`);
            await this.addColumn(queryRunner, 'http_method', `character varying(12) NOT NULL DEFAULT 'LEGACY'`);
            await this.addColumn(queryRunner, 'route', `character varying(500) NOT NULL DEFAULT '/legacy'`);
            await this.addColumn(queryRunner, 'hemia_id_path', 'character varying(500)');
            await this.addColumn(queryRunner, 'hemia_id_request_id', 'character varying(255)');
            await this.addColumn(queryRunner, 'metadata', `jsonb NOT NULL DEFAULT '{}'`);
            await this.addColumn(queryRunner, 'error_code', 'character varying(80)');
            await this.addColumn(queryRunner, 'error_message', 'character varying(500)');

            if (await queryRunner.hasColumn('audit_events', 'actor_id')) {
                await queryRunner.query(`UPDATE "audit_events" SET "actor_subject" = "actor_id" WHERE "actor_subject" IS NULL`);
            }
            if (await queryRunner.hasColumn('audit_events', 'resource_type')) {
                await queryRunner.query(`UPDATE "audit_events" SET "resource" = "resource_type" WHERE "resource" IS NULL`);
            }
            await queryRunner.query(`UPDATE "audit_events" SET "resource" = 'legacy' WHERE "resource" IS NULL`);
            await queryRunner.query(`UPDATE "audit_events" SET "metadata" = '{}' WHERE "metadata" IS NULL`);
            await queryRunner.query(`ALTER TABLE "audit_events" ALTER COLUMN "resource" SET NOT NULL`);
            await queryRunner.query(`ALTER TABLE "audit_events" ALTER COLUMN "metadata" SET NOT NULL`);
        }

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_hemia_id_request_id" ON "audit_events" ("hemia_id_request_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_status" ON "audit_events" ("status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_action" ON "audit_events" ("action")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_resource_resource_id" ON "audit_events" ("resource", "resource_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_actor_subject" ON "audit_events" ("actor_subject")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_events_created_at" ON "audit_events" ("created_at")`);
    }

    private async addColumn(queryRunner: QueryRunner, name: string, definition: string): Promise<void> {
        if (!(await queryRunner.hasColumn('audit_events', name))) {
            await queryRunner.query(`ALTER TABLE "audit_events" ADD COLUMN "${name}" ${definition}`);
        }
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
