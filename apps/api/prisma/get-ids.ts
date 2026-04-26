import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const apex = await p.tenant.findUnique({ where: { slug: "apex-digital-agency" } });
  const greenleaf = await p.tenant.findUnique({ where: { slug: "greenleaf-tech" } });
  const sarah = await p.user.findUnique({ where: { email: "sarah.mitchell@nexora-demo.com" } });

  if (!apex || !greenleaf || !sarah) {
    console.log("Missing data!");
    return;
  }

  const sarahApexTasks = await p.task.count({
    where: { tenantId: apex.id, assignments: { some: { userId: sarah.id } } },
  });
  const sarahGreenTasks = await p.task.count({
    where: { tenantId: greenleaf.id, assignments: { some: { userId: sarah.id } } },
  });

  console.log("APEX_ID=" + apex.id);
  console.log("GREENLEAF_ID=" + greenleaf.id);
  console.log("SARAH_ID=" + sarah.id);
  console.log("Sarah tasks in Apex:", sarahApexTasks);
  console.log("Sarah tasks in GreenLeaf:", sarahGreenTasks);

  await p.$disconnect();
})();
