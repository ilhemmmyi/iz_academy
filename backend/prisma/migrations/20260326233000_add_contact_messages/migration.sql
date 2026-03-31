CREATE TABLE IF NOT EXISTS "ContactMessage" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "replyMessage" TEXT,
  "repliedAt" TIMESTAMP(3),
  "repliedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactMessage_email_idx" ON "ContactMessage"("email");
CREATE INDEX IF NOT EXISTS "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_repliedById_idx" ON "ContactMessage"("repliedById");

ALTER TABLE "ContactMessage"
ADD CONSTRAINT "ContactMessage_repliedById_fkey"
FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;