-- CreateTable
CREATE TABLE "public"."TemplateSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TemplateSuggestion_userId_idx" ON "public"."TemplateSuggestion"("userId");

-- CreateIndex
CREATE INDEX "TemplateSuggestion_status_idx" ON "public"."TemplateSuggestion"("status");

-- AddForeignKey
ALTER TABLE "public"."TemplateSuggestion" ADD CONSTRAINT "TemplateSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
