const { z } = require("zod");
const prisma = require("../config/db");

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

const statusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

const createTask = async (req, res) => {
  try {
    const data = taskSchema.parse(req.body);

    if (data.assigneeId) {
      const member = await prisma.projectMembership.findUnique({
        where: {
          projectId_userId: {
            projectId: req.project.id,
            userId: data.assigneeId,
          },
        },
      });

      if (!member) {
        return res.status(400).json({ message: "Assignee is not part of this project" });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: req.project.id,
        assigneeId: data.assigneeId,
        createdById: req.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to create task" });
  }
};

const listTasksByProject = async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.project.id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return res.json(tasks);
};

const updateTaskStatus = async (req, res) => {
  try {
    const data = statusSchema.parse(req.body);

    const existing = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!existing || existing.projectId !== req.project.id) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (
      req.user.role !== "ADMIN" &&
      req.projectRole !== "ADMIN" &&
      existing.assigneeId !== req.user.id
    ) {
      return res.status(403).json({ message: "Only admins or assignee can update status" });
    }

    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data: { status: data.status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to update task status" });
  }
};

module.exports = { createTask, listTasksByProject, updateTaskStatus };
