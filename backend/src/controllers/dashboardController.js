const prisma = require("../config/db");

const getDashboard = async (req, res) => {
  const whereBase =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { assigneeId: req.user.id },
            {
              project: {
                memberships: {
                  some: { userId: req.user.id },
                },
              },
            },
          ],
        };

  const tasks = await prisma.task.findMany({
    where: whereBase,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });

  const now = new Date();
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: tasks.filter((t) => t.status === "DONE").length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length,
  };

  return res.json({ stats, tasks });
};

module.exports = { getDashboard };
