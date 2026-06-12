-- CreateTable
CREATE TABLE "operation_records" (
    "id" TEXT NOT NULL,
    "actor_profile_id" TEXT NOT NULL,
    "operation_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response_status" INTEGER,
    "response_body" JSONB,
    "conflict_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "operation_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operation_records_created_at_idx" ON "operation_records"("created_at");

-- CreateIndex
CREATE INDEX "operation_records_actor_profile_id_idx" ON "operation_records"("actor_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "operation_records_actor_profile_id_operation_id_key" ON "operation_records"("actor_profile_id", "operation_id");

-- AddForeignKey
ALTER TABLE "operation_records" ADD CONSTRAINT "operation_records_actor_profile_id_fkey" FOREIGN KEY ("actor_profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
