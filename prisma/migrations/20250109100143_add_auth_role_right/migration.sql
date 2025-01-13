/*
  Warnings:

  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "roles",
ADD COLUMN     "roleId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Right" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10),
    "name" VARCHAR(10),
    "createdDate" TIMESTAMP(3),
    "createdBy" VARCHAR(50),
    "updatedDate" TIMESTAMP(3),
    "updatedBy" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Right_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleRight" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "rightId" INTEGER NOT NULL,
    "createdDate" TIMESTAMP(3),
    "createdBy" VARCHAR(50),
    "updatedDate" TIMESTAMP(3),
    "updatedBy" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RoleRight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Object" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10),
    "name" VARCHAR(10),
    "createdDate" TIMESTAMP(3),
    "createdBy" VARCHAR(50),
    "updatedDate" TIMESTAMP(3),
    "updatedBy" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Object_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightObject" (
    "id" SERIAL NOT NULL,
    "rightId" INTEGER NOT NULL,
    "objectId" INTEGER NOT NULL,
    "createYn" BOOLEAN NOT NULL DEFAULT true,
    "readYn" BOOLEAN NOT NULL DEFAULT true,
    "updateYn" BOOLEAN NOT NULL DEFAULT false,
    "deleteYn" BOOLEAN NOT NULL DEFAULT true,
    "executeYn" BOOLEAN NOT NULL DEFAULT true,
    "createdDate" TIMESTAMP(3),
    "createdBy" VARCHAR(50),
    "updatedDate" TIMESTAMP(3),
    "updatedBy" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RightObject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Object_code_key" ON "Object"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRight" ADD CONSTRAINT "RoleRight_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleRight" ADD CONSTRAINT "RoleRight_rightId_fkey" FOREIGN KEY ("rightId") REFERENCES "Right"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightObject" ADD CONSTRAINT "RightObject_rightId_fkey" FOREIGN KEY ("rightId") REFERENCES "Right"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RightObject" ADD CONSTRAINT "RightObject_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Object"("id") ON DELETE CASCADE ON UPDATE CASCADE;
