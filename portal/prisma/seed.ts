import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type AssignmentStatus } from "@prisma/client";

const prisma = new PrismaClient();
const PASSWORD = "Passw0rd!Demo";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // Clean existing domain rows so seed is repeatable
  await prisma.activityLog.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.certificateRequest.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.mentorNote.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.extensionRequest.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.mentorAccessGrant.deleteMany();
  await prisma.internProfile.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.hRProfile.deleteMany();
  await prisma.user.deleteMany();

  // 1 Admin
  const adminUser = await prisma.user.create({
    data: { role: "ADMIN", username: "admin@beat.local", email: "admin@beat.local", passwordHash },
  });

  // 1 HR Manager
  const hrUser = await prisma.user.create({
    data: { role: "HR", username: "hr@beat.local", email: "hr@beat.local", passwordHash },
  });
  await prisma.hRProfile.create({ data: { userId: hrUser.id, name: "Hannah HR" } });

  // 2 Mentors
  const m1User = await prisma.user.create({
    data: { role: "MENTOR", username: "mentor1@beat.local", email: "mentor1@beat.local", passwordHash },
  });
  const m1 = await prisma.mentorProfile.create({
    data: {
      userId: m1User.id,
      name: "Maya Mentor",
      phone: "+91 90000 00001",
      workStartTime: "09:00",
      workEndTime: "17:30",
    },
  });

  const m2User = await prisma.user.create({
    data: { role: "MENTOR", username: "mentor2@beat.local", email: "mentor2@beat.local", passwordHash },
  });
  const m2 = await prisma.mentorProfile.create({
    data: {
      userId: m2User.id,
      name: "Noah Mentor",
      phone: "+91 90000 00002",
      workStartTime: "10:00",
      workEndTime: "18:30",
    },
  });

  // 2 Reusable Projects
  const proj1 = await prisma.project.create({
    data: {
      title: "E-Commerce Customer Churn & Retention Analytics",
      toolsUsed: ["PYTHON", "SQL", "TABLEAU"],
      instructions:
        "1. Extract customer cohort tables via SQL.\n2. Build a churn classification model in Python.\n3. Deliver an interactive retention dashboard in Tableau.",
      dataSourceText: "PostgreSQL replica: analytics.beat.local:5432/ecommerce",
      createdByMentorId: m1.id,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      title: "Financial Revenue Forecasting & KPI Executive Deck",
      toolsUsed: ["EXCEL", "POWER_BI", "SQL"],
      instructions:
        "1. Consolidate multi-region revenue ledgers.\n2. Build rolling 12-month forecast in Excel & Power BI.\n3. Present executive findings.",
      dataSourceText: "REST API: https://api.beat.local/v1/finance-ledgers",
      createdByMentorId: m2.id,
    },
  });

  // 5 Interns with varied states
  const internSpecs = [
    { name: "Aarav Sharma", email: "intern1@beat.local", qual: "M.Sc. Data Science", mentorId: m1.id },
    { name: "Diya Nair", email: "intern2@beat.local", qual: "B.Tech Computer Science", mentorId: m1.id },
    { name: "Rohan Verma", email: "intern3@beat.local", qual: "MBA Business Analytics", mentorId: m1.id },
    { name: "Sneha Patel", email: "intern4@beat.local", qual: "B.Sc. Statistics", mentorId: m2.id },
    { name: "Karthik Menon", email: "intern5@beat.local", qual: "MCA", mentorId: null },
  ];

  const interns = [];
  for (const spec of internSpecs) {
    const u = await prisma.user.create({
      data: { role: "INTERN", username: spec.email, email: spec.email, passwordHash },
    });
    const p = await prisma.internProfile.create({
      data: {
        userId: u.id,
        name: spec.name,
        email: spec.email,
        phone1: "+91 98888 11111",
        address: "Kochi, Kerala",
        educationalQualification: spec.qual,
        source: "DIRECT",
        mentorId: spec.mentorId,
      },
    });
    interns.push({ user: u, profile: p });
  }

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000);

  // Create assignments covering all 8 statuses:
  // ASSIGNED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, REVISION_REQUIRED, RESUBMITTED, COMPLETED, OVERDUE
  const assignmentConfigs: {
    internIdx: number;
    projectId: string;
    status: AssignmentStatus;
    dueOffset: number;
    score?: number;
  }[] = [
    { internIdx: 0, projectId: proj1.id, status: "COMPLETED", dueOffset: -5, score: 95 },
    { internIdx: 0, projectId: proj2.id, status: "SUBMITTED", dueOffset: 4 },
    { internIdx: 1, projectId: proj1.id, status: "REVISION_REQUIRED", dueOffset: 3, score: 68 },
    { internIdx: 1, projectId: proj2.id, status: "RESUBMITTED", dueOffset: 6 },
    { internIdx: 2, projectId: proj1.id, status: "OVERDUE", dueOffset: -3 },
    { internIdx: 2, projectId: proj2.id, status: "IN_PROGRESS", dueOffset: 5 },
    { internIdx: 3, projectId: proj2.id, status: "UNDER_REVIEW", dueOffset: 2 },
    { internIdx: 4, projectId: proj1.id, status: "ASSIGNED", dueOffset: 7 },
  ];

  const createdAssignments = [];
  for (const cfg of assignmentConfigs) {
    const a = await prisma.projectAssignment.create({
      data: {
        projectId: cfg.projectId,
        internId: interns[cfg.internIdx].profile.id,
        assignedDate: daysFromNow(-14),
        dueDate: daysFromNow(cfg.dueOffset),
        status: cfg.status,
        score: cfg.score ?? null,
      },
    });
    createdAssignments.push(a);
  }

  // Submissions & evaluations for realistic history
  const sub1 = await prisma.submission.create({
    data: { assignmentId: createdAssignments[0].id, version: 1, note: "Completed notebook and Tableau link" },
  });
  await prisma.evaluation.create({
    data: {
      assignmentId: createdAssignments[0].id,
      submissionId: sub1.id,
      score: 95,
      feedback: "Outstanding feature engineering and executive storytelling.",
      decision: "COMPLETED",
      evaluatedById: m1User.id,
    },
  });

  // Overdue assignment has a pending extension request
  await prisma.extensionRequest.create({
    data: {
      assignmentId: createdAssignments[4].id,
      reason: "University semester exam overlap; requesting 5 extra days.",
      requestedDate: daysFromNow(5),
      status: "PENDING",
    },
  });

  // Scheduled presentation for Intern 1
  await prisma.presentation.create({
    data: {
      internId: interns[0].profile.id,
      assignmentId: createdAssignments[0].id,
      scheduledAt: daysFromNow(2),
      googleMeetLink: "https://meet.google.com/beat-demo-review",
      status: "SCHEDULED",
      createdById: m1User.id,
    },
  });

  // Immutable dated mentor note
  await prisma.mentorNote.create({
    data: {
      internId: interns[0].profile.id,
      mentorId: m1.id,
      content: "Demonstrated strong command of SQL window functions and cohort retention charts.",
    },
  });

  // Internships: Intern 1 has a COMPLETED internship with a PENDING CertificateRequest awaiting HR approval
  const completedInternship = await prisma.internship.create({
    data: {
      internId: interns[0].profile.id,
      startDate: daysFromNow(-60),
      endDate: now,
      completionDate: now,
      completedByMentorId: m1.id,
      status: "CERTIFICATE_PENDING",
    },
  });
  await prisma.certificateRequest.create({
    data: {
      internshipId: completedInternship.id,
      status: "PENDING",
    },
  });

  // Interns 2..5 have ONGOING internships
  for (let idx = 1; idx < interns.length; idx++) {
    await prisma.internship.create({
      data: {
        internId: interns[idx].profile.id,
        startDate: daysFromNow(-30),
        status: "ONGOING",
      },
    });
  }

  await prisma.certificateTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_SEEDED",
      entityType: "System",
      metadata: { interns: 5, mentors: 2, projects: 2, assignments: 8 },
    },
  });

  console.log(`Seed complete! Password for all accounts: ${PASSWORD}`);
}

main().finally(() => prisma.$disconnect());
