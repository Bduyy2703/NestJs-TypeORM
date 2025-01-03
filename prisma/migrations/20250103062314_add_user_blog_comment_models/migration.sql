/*
  Warnings:

  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tokenOTP` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Blog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CommentsOnBlogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CommentsOnBlogs" DROP CONSTRAINT "CommentsOnBlogs_blogId_fkey";

-- DropForeignKey
ALTER TABLE "CommentsOnBlogs" DROP CONSTRAINT "CommentsOnBlogs_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerified",
DROP COLUMN "roles",
DROP COLUMN "tokenOTP",
DROP COLUMN "username";

-- DropTable
DROP TABLE "Blog";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "CommentsOnBlogs";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "Token";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "Status";
