import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    where: { slug: { in: ["apex-digital-agency", "greenleaf-tech"] } },
    include: {
      _count: { select: { projects: true, members: true, labels: true } },
      members: {
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      },
      projects: { include: { _count: { select: { tasks: true } } } },
    },
  });

  console.log("\n📊 DATABASE VERIFICATION\n");
  for (const t of tenants) {
    console.log(`🏢 ${t.name} (id: ${t.id})`);
    console.log(`   slug: ${t.slug}, plan: ${t.plan}`);
    console.log(`   counts: ${t._count.projects} projects, ${t._count.members} members, ${t._count.labels} labels`);
    console.log(`   members:`);
    for (const m of t.members) {
      console.log(`     - ${m.user.firstName} ${m.user.lastName} (${m.user.email}) [${m.role}]`);
    }
    console.log(`   projects:`);
    for (const p of t.projects) {
      console.log(`     - ${p.name}: ${p._count.tasks} tasks`);
    }
    console.log("");
  }

  const tenantIds = tenants.map((t) => t.id);
  const totalTasks = await prisma.task.count({
    where: { tenantId: { in: tenantIds } },
  });
  console.log(`📋 Total demo tasks: ${totalTasks}`);

  const sarah = await prisma.user.findUnique({
    where: { email: "sarah.mitchell@nexora-demo.com" },
    include: { tenantMemberships: { include: { tenant: { select: { name: true, slug: true } } } } },
  });
  console.log(`\n👑 Sarah's memberships:`);
  for (const m of sarah?.tenantMemberships || []) {
    console.log(`   - ${m.tenant.name} (${m.tenant.slug}) [${m.role}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
