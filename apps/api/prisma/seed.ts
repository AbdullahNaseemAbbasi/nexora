import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ==================== USERS ====================

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@nexora.dev" },
    update: {},
    create: {
      email: "admin@nexora.dev",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      emailVerified: true,
      isSuperAdmin: true,
    },
  });

  // Regular users
  const abdullah = await prisma.user.upsert({
    where: { email: "abdullah@techsoft.com" },
    update: {},
    create: {
      email: "abdullah@techsoft.com",
      passwordHash,
      firstName: "Abdullah",
      lastName: "Naseем",
      emailVerified: true,
    },
  });

  const sara = await prisma.user.upsert({
    where: { email: "sara@techsoft.com" },
    update: {},
    create: {
      email: "sara@techsoft.com",
      passwordHash,
      firstName: "Sara",
      lastName: "Ahmed",
      emailVerified: true,
    },
  });

  const bilal = await prisma.user.upsert({
    where: { email: "bilal@clothing.com" },
    update: {},
    create: {
      email: "bilal@clothing.com",
      passwordHash,
      firstName: "Bilal",
      lastName: "Khan",
      emailVerified: true,
    },
  });

  const usman = await prisma.user.upsert({
    where: { email: "usman@clothing.com" },
    update: {},
    create: {
      email: "usman@clothing.com",
      passwordHash,
      firstName: "Usman",
      lastName: "Ali",
      emailVerified: true,
    },
  });

  console.log("✅ Users created");

  // ==================== TENANTS ====================

  // Tenant 1: TechSoft Solutions
  const techSoft = await prisma.tenant.upsert({
    where: { slug: "techsoft-solutions" },
    update: {},
    create: {
      name: "TechSoft Solutions",
      slug: "techsoft-solutions",
      plan: "PRO",
    },
  });

  // Tenant 2: Ahmed Clothing Brand
  const clothing = await prisma.tenant.upsert({
    where: { slug: "ahmed-clothing" },
    update: {},
    create: {
      name: "Ahmed Clothing Brand",
      slug: "ahmed-clothing",
      plan: "FREE",
    },
  });

  console.log("✅ Tenants created");

  // ==================== TENANT MEMBERS ====================

  // TechSoft members
  await prisma.tenantMember.upsert({
    where: { userId_tenantId: { userId: abdullah.id, tenantId: techSoft.id } },
    update: {},
    create: { userId: abdullah.id, tenantId: techSoft.id, role: "ADMIN" },
  });

  await prisma.tenantMember.upsert({
    where: { userId_tenantId: { userId: sara.id, tenantId: techSoft.id } },
    update: {},
    create: { userId: sara.id, tenantId: techSoft.id, role: "MANAGER" },
  });

  // Ahmed Clothing members
  await prisma.tenantMember.upsert({
    where: { userId_tenantId: { userId: bilal.id, tenantId: clothing.id } },
    update: {},
    create: { userId: bilal.id, tenantId: clothing.id, role: "ADMIN" },
  });

  await prisma.tenantMember.upsert({
    where: { userId_tenantId: { userId: usman.id, tenantId: clothing.id } },
    update: {},
    create: { userId: usman.id, tenantId: clothing.id, role: "MEMBER" },
  });

  console.log("✅ Tenant members created");

  // ==================== PROJECTS ====================

  const project1 = await prisma.project.create({
    data: {
      tenantId: techSoft.id,
      name: "Nexora Website Redesign",
      description: "Complete redesign of the company website with modern UI",
      status: "ACTIVE",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      tenantId: techSoft.id,
      name: "Mobile App Development",
      description: "Build iOS and Android app for clients",
      status: "ACTIVE",
    },
  });

  const project3 = await prisma.project.create({
    data: {
      tenantId: clothing.id,
      name: "Summer Collection Launch",
      description: "Plan and execute summer 2026 product launch",
      status: "ACTIVE",
    },
  });

  console.log("✅ Projects created");

  // ==================== TASKS ====================

  // Project 1 tasks
  await prisma.task.createMany({
    data: [
      {
        tenantId: techSoft.id,
        projectId: project1.id,
        title: "Design new homepage mockup",
        description: "Create Figma mockup for the new homepage",
        status: "DONE",
        priority: "HIGH",
        position: 1,
      },
      {
        tenantId: techSoft.id,
        projectId: project1.id,
        title: "Implement hero section",
        description: "Code the hero section with animations",
        status: "IN_PROGRESS",
        priority: "HIGH",
        position: 2,
      },
      {
        tenantId: techSoft.id,
        projectId: project1.id,
        title: "Setup contact form backend",
        description: "Create API endpoint for contact form submissions",
        status: "TODO",
        priority: "MEDIUM",
        position: 3,
      },
      {
        tenantId: techSoft.id,
        projectId: project1.id,
        title: "SEO optimization",
        description: "Add meta tags and improve page speed",
        status: "TODO",
        priority: "LOW",
        position: 4,
      },
      {
        tenantId: techSoft.id,
        projectId: project1.id,
        title: "Write unit tests",
        description: "Test all components with Jest",
        status: "IN_REVIEW",
        priority: "MEDIUM",
        position: 5,
      },
    ],
  });

  // Project 2 tasks
  await prisma.task.createMany({
    data: [
      {
        tenantId: techSoft.id,
        projectId: project2.id,
        title: "Setup React Native project",
        description: "Initialize RN project with navigation and state management",
        status: "DONE",
        priority: "URGENT",
        position: 1,
      },
      {
        tenantId: techSoft.id,
        projectId: project2.id,
        title: "Build login screen",
        description: "Design and implement login/register screens",
        status: "IN_PROGRESS",
        priority: "HIGH",
        position: 2,
      },
      {
        tenantId: techSoft.id,
        projectId: project2.id,
        title: "Integrate push notifications",
        description: "Setup Firebase for push notifications",
        status: "TODO",
        priority: "MEDIUM",
        position: 3,
      },
    ],
  });

  // Project 3 tasks (Clothing)
  await prisma.task.createMany({
    data: [
      {
        tenantId: clothing.id,
        projectId: project3.id,
        title: "Design summer catalog",
        description: "Create product catalog for summer collection",
        status: "IN_PROGRESS",
        priority: "HIGH",
        position: 1,
      },
      {
        tenantId: clothing.id,
        projectId: project3.id,
        title: "Contact fabric suppliers",
        description: "Get quotes from 3 different fabric suppliers",
        status: "DONE",
        priority: "URGENT",
        position: 2,
      },
      {
        tenantId: clothing.id,
        projectId: project3.id,
        title: "Setup Instagram campaign",
        description: "Plan social media launch campaign",
        status: "TODO",
        priority: "HIGH",
        position: 3,
      },
      {
        tenantId: clothing.id,
        projectId: project3.id,
        title: "Setup delivery routes",
        description: "Coordinate with delivery partners",
        status: "TODO",
        priority: "MEDIUM",
        position: 4,
      },
    ],
  });

  console.log("✅ Tasks created");

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("📋 Test Accounts (password: Password123!):");
  console.log("   Super Admin : admin@nexora.dev");
  console.log("   TechSoft Admin : abdullah@techsoft.com");
  console.log("   TechSoft Manager : sara@techsoft.com");
  console.log("   Clothing Admin : bilal@clothing.com");
  console.log("   Clothing Member : usman@clothing.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
