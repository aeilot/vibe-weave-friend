-- CreateTable
CREATE TABLE "AIGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personality" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGroupMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GroupMessage" ADD COLUMN "aiMemberId" TEXT,
ADD COLUMN "senderType" TEXT NOT NULL DEFAULT 'user',
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AIGroupMember_groupId_idx" ON "AIGroupMember"("groupId");

-- CreateIndex
CREATE INDEX "AIGroupMember_role_idx" ON "AIGroupMember"("role");

-- CreateIndex
CREATE INDEX "GroupMessage_senderType_idx" ON "GroupMessage"("senderType");

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_aiMemberId_fkey" FOREIGN KEY ("aiMemberId") REFERENCES "AIGroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGroupMember" ADD CONSTRAINT "AIGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
