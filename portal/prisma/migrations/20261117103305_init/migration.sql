-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'MENTOR', 'INTERN');

-- CreateEnum
CREATE TYPE "InternSource" AS ENUM ('DIRECT', 'OTHER');

-- CreateEnum
CREATE TYPE "Tool" AS ENUM ('EXCEL', 'SQL', 'POWER_BI', 'TABLEAU', 'PYTHON', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'RESUBMITTED', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ExtensionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('SCHEDULED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InternshipStatus" AS ENUM ('NOT_STARTED', 'ONGOING', 'COMPLETED', 'CERTIFICATE_PENDING', 'CERTIFICATE_APPROVED', 'CERTIFICATE_REJECTED');

-- CreateEnum
CREATE TYPE "CertificateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EvaluationDecision" AS ENUM ('COMPLETED', 'REVISION_REQUIRED');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('PROJECT_DATA', 'PROJECT_INSTRUCTIONS', 'SUBMISSION');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'LOGGED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HRProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "workStartTime" TEXT NOT NULL,
    "workEndTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorAccessGrant" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "granteeId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "educationalQualification" TEXT NOT NULL,
    "source" "InternSource" NOT NULL DEFAULT 'DIRECT',
    "mentorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "toolsUsed" "Tool"[],
    "instructions" TEXT NOT NULL,
    "dataSourceText" TEXT,
    "createdByMentorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "kind" "FileKind" NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT,
    "submissionId" TEXT,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAssignment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "note" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "decision" "EvaluationDecision" NOT NULL,
    "evaluatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionRequest" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionRequest" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "status" "ExtensionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedDate" TIMESTAMP(3),
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "googleMeetLink" TEXT NOT NULL,
    "status" "PresentationStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorNote" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "internId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "completedByMentorId" TEXT,
    "status" "InternshipStatus" NOT NULL DEFAULT 'ONGOING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateRequest" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "pdfPath" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "programTitle" TEXT NOT NULL DEFAULT 'Data Analytics Internship Program',
    "organisation" TEXT NOT NULL DEFAULT 'Beat Education',
    "bodyText" TEXT NOT NULL DEFAULT 'has successfully completed the internship program',
    "signatoryName" TEXT NOT NULL DEFAULT 'Authorised Signatory',
    "signatoryTitle" TEXT NOT NULL DEFAULT 'Director',
    "accentColor" TEXT NOT NULL DEFAULT '#4B3A9B',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "error" TEXT,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "HRProfile_userId_key" ON "HRProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorAccessGrant_ownerId_granteeId_key" ON "MentorAccessGrant"("ownerId", "granteeId");

-- CreateIndex
CREATE UNIQUE INDEX "InternProfile_userId_key" ON "InternProfile"("userId");

-- CreateIndex
CREATE INDEX "InternProfile_mentorId_idx" ON "InternProfile"("mentorId");

-- CreateIndex
CREATE INDEX "Project_createdByMentorId_idx" ON "Project"("createdByMentorId");

-- CreateIndex
CREATE INDEX "StoredFile_projectId_idx" ON "StoredFile"("projectId");

-- CreateIndex
CREATE INDEX "StoredFile_submissionId_idx" ON "StoredFile"("submissionId");

-- CreateIndex
CREATE INDEX "ProjectAssignment_internId_idx" ON "ProjectAssignment"("internId");

-- CreateIndex
CREATE INDEX "ProjectAssignment_projectId_idx" ON "ProjectAssignment"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAssignment_status_dueDate_idx" ON "ProjectAssignment"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_version_key" ON "Submission"("assignmentId", "version");

-- CreateIndex
CREATE INDEX "Evaluation_assignmentId_idx" ON "Evaluation"("assignmentId");

-- CreateIndex
CREATE INDEX "CorrectionRequest_assignmentId_idx" ON "CorrectionRequest"("assignmentId");

-- CreateIndex
CREATE INDEX "ExtensionRequest_assignmentId_idx" ON "ExtensionRequest"("assignmentId");

-- CreateIndex
CREATE INDEX "Presentation_internId_idx" ON "Presentation"("internId");

-- CreateIndex
CREATE INDEX "MentorNote_internId_idx" ON "MentorNote"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "Internship_internId_key" ON "Internship"("internId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateRequest_internshipId_key" ON "CertificateRequest"("internshipId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_requestId_key" ON "Certificate"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON "Certificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventId_recipientId_key" ON "Notification"("eventId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_eventId_recipient_key" ON "EmailLog"("eventId", "recipient");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "HRProfile" ADD CONSTRAINT "HRProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAccessGrant" ADD CONSTRAINT "MentorAccessGrant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorAccessGrant" ADD CONSTRAINT "MentorAccessGrant_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "MentorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternProfile" ADD CONSTRAINT "InternProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternProfile" ADD CONSTRAINT "InternProfile_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdByMentorId_fkey" FOREIGN KEY ("createdByMentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAssignment" ADD CONSTRAINT "ProjectAssignment_internId_fkey" FOREIGN KEY ("internId") REFERENCES "InternProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionRequest" ADD CONSTRAINT "CorrectionRequest_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_internId_fkey" FOREIGN KEY ("internId") REFERENCES "InternProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ProjectAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorNote" ADD CONSTRAINT "MentorNote_internId_fkey" FOREIGN KEY ("internId") REFERENCES "InternProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorNote" ADD CONSTRAINT "MentorNote_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_internId_fkey" FOREIGN KEY ("internId") REFERENCES "InternProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateRequest" ADD CONSTRAINT "CertificateRequest_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CertificateRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
