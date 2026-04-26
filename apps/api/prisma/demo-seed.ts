import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const hoursAgo = (h: number) => {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d;
};

async function main() {
  console.log("🌱 Seeding Loom demo data...\n");

  // ============ IDEMPOTENCY GUARD ============
  // Re-running this seed creates NEW tenant IDs which makes browser localStorage
  // stale (causing 403 errors). Skip if demo data already exists.
  const existing = await prisma.tenant.findUnique({ where: { slug: "apex-digital-agency" } });
  if (existing && !process.argv.includes("--force")) {
    console.log("✅ Demo data already exists — IDs preserved.\n");
    console.log("📋 Login Accounts (password: Demo@2026!):");
    console.log("   👑 sarah.mitchell@nexora-demo.com    (Admin in Apex, Member in GreenLeaf)");
    console.log("   👨 alex.chen@nexora-demo.com         (Manager in Apex)");
    console.log("   👨 james.wilson@nexora-demo.com      (Member in Apex)");
    console.log("   👩 priya.sharma@nexora-demo.com      (Admin in GreenLeaf)\n");
    console.log("To force fresh re-seed (will change IDs):");
    console.log("   pnpm --filter @nexora/api exec ts-node prisma/demo-seed.ts -- --force\n");
    return;
  }

  // ============ USERS ============
  const passwordHash = await bcrypt.hash("Demo@2026!", 12);

  const sarah = await prisma.user.upsert({
    where: { email: "sarah.mitchell@nexora-demo.com" },
    update: { passwordHash, firstName: "Sarah", lastName: "Mitchell", emailVerified: true },
    create: { email: "sarah.mitchell@nexora-demo.com", passwordHash, firstName: "Sarah", lastName: "Mitchell", emailVerified: true },
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex.chen@nexora-demo.com" },
    update: { passwordHash, firstName: "Alex", lastName: "Chen", emailVerified: true },
    create: { email: "alex.chen@nexora-demo.com", passwordHash, firstName: "Alex", lastName: "Chen", emailVerified: true },
  });

  const james = await prisma.user.upsert({
    where: { email: "james.wilson@nexora-demo.com" },
    update: { passwordHash, firstName: "James", lastName: "Wilson", emailVerified: true },
    create: { email: "james.wilson@nexora-demo.com", passwordHash, firstName: "James", lastName: "Wilson", emailVerified: true },
  });

  const priya = await prisma.user.upsert({
    where: { email: "priya.sharma@nexora-demo.com" },
    update: { passwordHash, firstName: "Priya", lastName: "Sharma", emailVerified: true },
    create: { email: "priya.sharma@nexora-demo.com", passwordHash, firstName: "Priya", lastName: "Sharma", emailVerified: true },
  });

  console.log("✅ 4 demo users ready");

  // ============ CLEAN PREVIOUS DEMO DATA ============
  await prisma.tenant.deleteMany({ where: { slug: { in: ["apex-digital-agency", "greenleaf-tech"] } } });
  console.log("🧹 Cleaned previous demo tenants");

  // ============ TENANT 1: Apex Digital Agency ============
  const apex = await prisma.tenant.create({
    data: {
      name: "Apex Digital Agency",
      slug: "apex-digital-agency",
      plan: "FREE",
      members: {
        create: [
          { userId: sarah.id, role: "ADMIN" },
          { userId: alex.id, role: "MANAGER" },
          { userId: james.id, role: "MEMBER" },
        ],
      },
      labels: {
        create: [
          { name: "Design", color: "#a855f7" },
          { name: "Development", color: "#3b82f6" },
          { name: "Marketing", color: "#ec4899" },
          { name: "Bug", color: "#ef4444" },
          { name: "Research", color: "#10b981" },
        ],
      },
    },
    include: { labels: true },
  });

  const lblDesign = apex.labels.find((l) => l.name === "Design")!;
  const lblDev = apex.labels.find((l) => l.name === "Development")!;
  const lblMarketing = apex.labels.find((l) => l.name === "Marketing")!;
  const lblResearch = apex.labels.find((l) => l.name === "Research")!;

  // ============ PROJECT 1: Q2 Brand Refresh ============
  const proj1 = await prisma.project.create({
    data: {
      tenantId: apex.id,
      name: "Q2 Brand Refresh",
      description: "Complete rebrand for Q2 2026 launch — logo, colors, typography, web assets",
      tasks: {
        create: [
          { tenantId: apex.id, title: "Conduct competitor brand audit", status: "DONE", priority: "HIGH", position: 1, estimate: 3, description: "Audit top 5 competitors' branding, document findings in Notion." },
          { tenantId: apex.id, title: "Define new brand guidelines doc", status: "IN_REVIEW", priority: "HIGH", position: 2, estimate: 5, dueDate: addDays(5), description: "Draft 30-page brand guidelines covering tone, voice, visual identity." },
          { tenantId: apex.id, title: "Design new logo concepts (3 variations)", status: "IN_PROGRESS", priority: "URGENT", position: 3, estimate: 8, dueDate: addDays(3), description: "Create 3 distinct logo directions: minimalist wordmark, abstract symbol, lettermark." },
          { tenantId: apex.id, title: "Refresh color palette and typography", status: "IN_PROGRESS", priority: "MEDIUM", position: 4, estimate: 5, dueDate: addDays(7) },
          { tenantId: apex.id, title: "Create brand asset library in Figma", status: "TODO", priority: "MEDIUM", position: 5, estimate: 8, dueDate: addDays(14) },
          { tenantId: apex.id, title: "Update website with new branding", status: "TODO", priority: "HIGH", position: 6, estimate: 13, dueDate: addDays(21) },
          { tenantId: apex.id, title: "Design new business cards & email signatures", status: "TODO", priority: "LOW", position: 7, estimate: 2, dueDate: addDays(30) },
        ],
      },
    },
    include: { tasks: true },
  });

  // Assignments + labels + comments for Project 1 — Sarah is heavily involved
  for (const task of proj1.tasks) {
    const titleLower = task.title.toLowerCase();
    const assignmentData: { taskId: string; userId: string }[] = [];
    const labelData: { taskId: string; labelId: string }[] = [];

    // Sarah (project owner) is assigned to most tasks
    if (task.status !== "DONE") {
      assignmentData.push({ taskId: task.id, userId: sarah.id });
    }
    // Alex collaborates on design/logo work
    if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
      assignmentData.push({ taskId: task.id, userId: alex.id });
    }
    if (titleLower.includes("logo") || titleLower.includes("design") || titleLower.includes("color") || titleLower.includes("figma") || titleLower.includes("business cards")) {
      labelData.push({ taskId: task.id, labelId: lblDesign.id });
    }
    if (titleLower.includes("audit")) labelData.push({ taskId: task.id, labelId: lblResearch.id });
    if (titleLower.includes("website")) labelData.push({ taskId: task.id, labelId: lblDev.id });

    if (assignmentData.length) await prisma.taskAssignment.createMany({ data: assignmentData });
    if (labelData.length) await prisma.taskLabel.createMany({ data: labelData });
  }

  const logoTask = proj1.tasks.find((t) => t.title.includes("logo"))!;
  await prisma.taskComment.createMany({
    data: [
      { taskId: logoTask.id, userId: sarah.id, content: "Targeting a minimalist wordmark — should feel timeless, not trendy. Avoid gradients." },
      { taskId: logoTask.id, userId: alex.id, content: "Agreed. I'll have 3 concepts ready by Friday with mood boards." },
      { taskId: logoTask.id, userId: james.id, content: "Can we also explore a monogram option? Could work well for favicon and app icon." },
    ],
  });

  console.log(`✅ Project 1: ${proj1.name} (${proj1.tasks.length} tasks, with comments)`);

  // ============ PROJECT 2: E-commerce Site Migration ============
  const proj2 = await prisma.project.create({
    data: {
      tenantId: apex.id,
      name: "E-commerce Site Migration",
      description: "Migrate client's Shopify store (200+ SKUs) to a custom Next.js storefront",
      tasks: {
        create: [
          { tenantId: apex.id, title: "Audit current Shopify catalog (200+ SKUs)", status: "DONE", priority: "HIGH", position: 1, estimate: 5 },
          { tenantId: apex.id, title: "Set up Next.js storefront boilerplate", status: "IN_PROGRESS", priority: "URGENT", position: 2, estimate: 8, dueDate: addDays(2) },
          { tenantId: apex.id, title: "Migrate product data to new CMS", status: "IN_PROGRESS", priority: "HIGH", position: 3, estimate: 13, dueDate: addDays(10) },
          { tenantId: apex.id, title: "Implement Stripe checkout integration", status: "TODO", priority: "URGENT", position: 4, estimate: 8 },
          { tenantId: apex.id, title: "Build cart and wishlist functionality", status: "TODO", priority: "HIGH", position: 5, estimate: 5 },
          { tenantId: apex.id, title: "QA testing on staging environment", status: "TODO", priority: "HIGH", position: 6, estimate: 5 },
          { tenantId: apex.id, title: "Schedule production cutover", status: "TODO", priority: "MEDIUM", position: 7, estimate: 2 },
        ],
      },
    },
    include: { tasks: true },
  });

  for (const task of proj2.tasks) {
    // Sarah is the project lead, assigned to active tasks
    if (task.status !== "DONE") {
      await prisma.taskAssignment.create({ data: { taskId: task.id, userId: sarah.id } });
    }
    if (task.status === "IN_PROGRESS") {
      await prisma.taskAssignment.create({ data: { taskId: task.id, userId: james.id } });
    }
    await prisma.taskLabel.create({ data: { taskId: task.id, labelId: lblDev.id } });
  }

  console.log(`✅ Project 2: ${proj2.name} (${proj2.tasks.length} tasks)`);

  // ============ PROJECT 3: Social Media Campaign ============
  const proj3 = await prisma.project.create({
    data: {
      tenantId: apex.id,
      name: "Social Media Campaign — Summer 2026",
      description: "Multi-channel summer campaign across Instagram, TikTok, and LinkedIn",
      tasks: {
        create: [
          { tenantId: apex.id, title: "Define campaign messaging and tone", status: "DONE", priority: "HIGH", position: 1, estimate: 3 },
          { tenantId: apex.id, title: "Create content calendar for 8 weeks", status: "IN_PROGRESS", priority: "HIGH", position: 2, estimate: 5, dueDate: addDays(4) },
          { tenantId: apex.id, title: "Shoot 12 product photos for Instagram", status: "IN_REVIEW", priority: "HIGH", position: 3, estimate: 8 },
          { tenantId: apex.id, title: "Edit 6 short-form videos for TikTok", status: "TODO", priority: "MEDIUM", position: 4, estimate: 8 },
          { tenantId: apex.id, title: "Set up paid ad targeting", status: "TODO", priority: "MEDIUM", position: 5, estimate: 3 },
        ],
      },
    },
    include: { tasks: true },
  });

  for (const task of proj3.tasks) {
    // Sarah is heavily assigned in marketing project
    if (task.status !== "DONE") {
      await prisma.taskAssignment.create({ data: { taskId: task.id, userId: sarah.id } });
    }
    await prisma.taskLabel.create({ data: { taskId: task.id, labelId: lblMarketing.id } });
  }

  console.log(`✅ Project 3: ${proj3.name} (${proj3.tasks.length} tasks)`);

  // ============ TENANT 2: GreenLeaf Tech Solutions ============
  const greenleaf = await prisma.tenant.create({
    data: {
      name: "GreenLeaf Tech Solutions",
      slug: "greenleaf-tech",
      plan: "FREE",
      members: {
        create: [
          { userId: priya.id, role: "ADMIN" },
          { userId: sarah.id, role: "MEMBER" }, // cross-tenant — Sarah is in both
        ],
      },
      labels: {
        create: [
          { name: "Frontend", color: "#06b6d4" },
          { name: "Backend", color: "#f59e0b" },
          { name: "Mobile", color: "#8b5cf6" },
          { name: "DevOps", color: "#22c55e" },
        ],
      },
    },
    include: { labels: true },
  });

  const lblFrontend = greenleaf.labels.find((l) => l.name === "Frontend")!;
  const lblBackend = greenleaf.labels.find((l) => l.name === "Backend")!;
  const lblMobile = greenleaf.labels.find((l) => l.name === "Mobile")!;

  // ============ PROJECT 4: Mobile App MVP ============
  const proj4 = await prisma.project.create({
    data: {
      tenantId: greenleaf.id,
      name: "Mobile App MVP",
      description: "React Native MVP for fitness tracking app — target launch in 8 weeks",
      tasks: {
        create: [
          { tenantId: greenleaf.id, title: "User research & persona definition", status: "DONE", priority: "HIGH", position: 1, estimate: 5 },
          { tenantId: greenleaf.id, title: "Design wireframes in Figma", status: "IN_REVIEW", priority: "HIGH", position: 2, estimate: 8, dueDate: addDays(2) },
          { tenantId: greenleaf.id, title: "Set up React Native + Expo project", status: "IN_PROGRESS", priority: "URGENT", position: 3, estimate: 5, dueDate: addDays(1) },
          { tenantId: greenleaf.id, title: "Build authentication screens", status: "IN_PROGRESS", priority: "HIGH", position: 4, estimate: 8 },
          { tenantId: greenleaf.id, title: "Implement workout tracking flow", status: "TODO", priority: "HIGH", position: 5, estimate: 13 },
          { tenantId: greenleaf.id, title: "Add push notifications", status: "TODO", priority: "MEDIUM", position: 6, estimate: 5 },
          { tenantId: greenleaf.id, title: "App Store submission prep", status: "TODO", priority: "LOW", position: 7, estimate: 3 },
        ],
      },
    },
    include: { tasks: true },
  });

  for (const task of proj4.tasks) {
    if (task.status === "IN_PROGRESS" || task.status === "IN_REVIEW") {
      await prisma.taskAssignment.create({ data: { taskId: task.id, userId: priya.id } });
    }
    await prisma.taskLabel.create({ data: { taskId: task.id, labelId: lblMobile.id } });
  }

  console.log(`✅ Project 4: ${proj4.name} (${proj4.tasks.length} tasks)`);

  // ============ PROJECT 5: API v2 Development ============
  const proj5 = await prisma.project.create({
    data: {
      tenantId: greenleaf.id,
      name: "API v2 Development",
      description: "Rewrite legacy REST API to GraphQL with improved auth and rate limiting",
      tasks: {
        create: [
          { tenantId: greenleaf.id, title: "Define GraphQL schema for v2", status: "DONE", priority: "HIGH", position: 1, estimate: 5 },
          { tenantId: greenleaf.id, title: "Set up Apollo Server with TypeScript", status: "IN_PROGRESS", priority: "HIGH", position: 2, estimate: 5 },
          { tenantId: greenleaf.id, title: "Implement JWT auth middleware", status: "IN_PROGRESS", priority: "URGENT", position: 3, estimate: 8, dueDate: addDays(3) },
          { tenantId: greenleaf.id, title: "Migrate user resolver from REST", status: "TODO", priority: "HIGH", position: 4, estimate: 5 },
          { tenantId: greenleaf.id, title: "Add rate limiting (100 req/min per user)", status: "TODO", priority: "MEDIUM", position: 5, estimate: 3 },
          { tenantId: greenleaf.id, title: "Write integration tests", status: "TODO", priority: "MEDIUM", position: 6, estimate: 8 },
        ],
      },
    },
    include: { tasks: true },
  });

  for (const task of proj5.tasks) {
    if (task.status === "IN_PROGRESS") {
      await prisma.taskAssignment.create({ data: { taskId: task.id, userId: priya.id } });
    }
    if (task.title.toLowerCase().includes("schema") || task.title.toLowerCase().includes("apollo") || task.title.toLowerCase().includes("auth") || task.title.toLowerCase().includes("rate") || task.title.toLowerCase().includes("resolver")) {
      await prisma.taskLabel.create({ data: { taskId: task.id, labelId: lblBackend.id } });
    }
  }

  console.log(`✅ Project 5: ${proj5.name} (${proj5.tasks.length} tasks)`);

  // ============ ACTIVITY LOG ============
  // Spread across last 48 hours so the feed looks lived-in
  const allTasks = [...proj1.tasks, ...proj2.tasks, ...proj3.tasks, ...proj4.tasks, ...proj5.tasks];
  const apexTasks = [...proj1.tasks, ...proj2.tasks, ...proj3.tasks];
  const greenTasks = [...proj4.tasks, ...proj5.tasks];

  const activities: { tenantId: string; userId: string; action: string; entity: string; entityId: string; metadata: any; createdAt: Date }[] = [
    { tenantId: apex.id, userId: sarah.id, action: "PROJECT_CREATED", entity: "project", entityId: proj1.id, metadata: { name: proj1.name }, createdAt: hoursAgo(40) },
    { tenantId: apex.id, userId: alex.id, action: "TASK_CREATED", entity: "task", entityId: apexTasks[2].id, metadata: { title: apexTasks[2].title }, createdAt: hoursAgo(36) },
    { tenantId: apex.id, userId: alex.id, action: "TASK_ASSIGNED", entity: "task", entityId: apexTasks[2].id, metadata: { assigneeId: alex.id }, createdAt: hoursAgo(35) },
    { tenantId: apex.id, userId: sarah.id, action: "TASK_COMMENTED", entity: "task", entityId: apexTasks[2].id, metadata: {}, createdAt: hoursAgo(30) },
    { tenantId: apex.id, userId: alex.id, action: "TASK_COMMENTED", entity: "task", entityId: apexTasks[2].id, metadata: {}, createdAt: hoursAgo(28) },
    { tenantId: apex.id, userId: sarah.id, action: "TASK_STATUS_CHANGED", entity: "task", entityId: apexTasks[0].id, metadata: { title: apexTasks[0].title, status: "DONE" }, createdAt: hoursAgo(20) },
    { tenantId: apex.id, userId: james.id, action: "TASK_CREATED", entity: "task", entityId: proj2.tasks[3].id, metadata: { title: proj2.tasks[3].title }, createdAt: hoursAgo(18) },
    { tenantId: apex.id, userId: james.id, action: "TASK_STATUS_CHANGED", entity: "task", entityId: proj2.tasks[1].id, metadata: { title: proj2.tasks[1].title, status: "IN_PROGRESS" }, createdAt: hoursAgo(12) },
    { tenantId: apex.id, userId: sarah.id, action: "PROJECT_CREATED", entity: "project", entityId: proj3.id, metadata: { name: proj3.name }, createdAt: hoursAgo(8) },
    { tenantId: apex.id, userId: alex.id, action: "TASK_UPDATED", entity: "task", entityId: apexTasks[3].id, metadata: { title: apexTasks[3].title }, createdAt: hoursAgo(6) },
    { tenantId: apex.id, userId: sarah.id, action: "TASK_STATUS_CHANGED", entity: "task", entityId: proj3.tasks[2].id, metadata: { title: proj3.tasks[2].title, status: "IN_REVIEW" }, createdAt: hoursAgo(3) },
    { tenantId: apex.id, userId: alex.id, action: "TASK_COMMENTED", entity: "task", entityId: apexTasks[2].id, metadata: {}, createdAt: hoursAgo(1) },

    { tenantId: greenleaf.id, userId: priya.id, action: "PROJECT_CREATED", entity: "project", entityId: proj4.id, metadata: { name: proj4.name }, createdAt: hoursAgo(45) },
    { tenantId: greenleaf.id, userId: priya.id, action: "TASK_STATUS_CHANGED", entity: "task", entityId: greenTasks[0].id, metadata: { title: greenTasks[0].title, status: "DONE" }, createdAt: hoursAgo(24) },
    { tenantId: greenleaf.id, userId: priya.id, action: "PROJECT_CREATED", entity: "project", entityId: proj5.id, metadata: { name: proj5.name }, createdAt: hoursAgo(15) },
    { tenantId: greenleaf.id, userId: priya.id, action: "TASK_STATUS_CHANGED", entity: "task", entityId: greenTasks[2].id, metadata: { title: greenTasks[2].title, status: "IN_PROGRESS" }, createdAt: hoursAgo(4) },
  ];

  await prisma.activity.createMany({ data: activities });
  console.log(`✅ ${activities.length} activity log entries seeded\n`);

  // ============ NOTIFICATIONS ============
  await prisma.notification.createMany({
    data: [
      { userId: alex.id, tenantId: apex.id, type: "TASK_ASSIGNED", title: "You were assigned to a task", message: `You have been assigned to "${apexTasks[2].title}"`, metadata: { taskId: apexTasks[2].id }, createdAt: hoursAgo(35) },
      { userId: james.id, tenantId: apex.id, type: "TASK_ASSIGNED", title: "You were assigned to a task", message: `You have been assigned to "${proj2.tasks[1].title}"`, metadata: { taskId: proj2.tasks[1].id }, createdAt: hoursAgo(20) },
      { userId: sarah.id, tenantId: apex.id, type: "TASK_COMMENT", title: "New comment on a task", message: `Alex Chen commented on "${apexTasks[2].title}"`, metadata: { taskId: apexTasks[2].id }, createdAt: hoursAgo(28) },
      { userId: priya.id, tenantId: greenleaf.id, type: "TASK_ASSIGNED", title: "You were assigned to a task", message: `You have been assigned to "${greenTasks[2].title}"`, metadata: { taskId: greenTasks[2].id }, createdAt: hoursAgo(4) },
    ],
  });
  console.log("✅ 4 notifications seeded\n");

  console.log("🎉 DEMO SEED COMPLETE!\n");
  console.log("📋 Login Accounts (password: Demo@2026!):");
  console.log("   👑 Sarah Mitchell  → sarah.mitchell@nexora-demo.com   (Admin in Apex, Member in GreenLeaf)");
  console.log("   👨 Alex Chen       → alex.chen@nexora-demo.com        (Manager in Apex)");
  console.log("   👨 James Wilson    → james.wilson@nexora-demo.com     (Member in Apex)");
  console.log("   👩 Priya Sharma    → priya.sharma@nexora-demo.com     (Admin in GreenLeaf)\n");
  console.log("🏢 Workspaces:");
  console.log("   🟣 Apex Digital Agency (3 projects, 19 tasks)");
  console.log("   🟢 GreenLeaf Tech Solutions (2 projects, 13 tasks)\n");
  console.log("🎬 Ready to record!\n");
}

main()
  .catch((e) => {
    console.error("❌ Demo seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
