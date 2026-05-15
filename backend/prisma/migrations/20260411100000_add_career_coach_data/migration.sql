-- CreateTable
CREATE TABLE "CareerCoachData" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerCoachData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CareerCoachData_userId_key" ON "CareerCoachData"("userId");

-- CreateIndex
CREATE INDEX "CareerCoachData_userId_idx" ON "CareerCoachData"("userId");

-- AddForeignKey
ALTER TABLE "CareerCoachData" ADD CONSTRAINT "CareerCoachData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
