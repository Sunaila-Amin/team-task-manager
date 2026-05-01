const { z } = require("zod");
const prisma = require("../config/db");

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const createProject = async (req, res) => {
  try {
    const data = projectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        createdById: req.user.id,
        memberships: {
          create: {
            userId: req.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    return res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to create project" });
  }
};

const listProjects = async (req, res) => {
  const projects = await prisma.project.findMany({
    where:
      req.user.role === "ADMIN"
        ? {}
        : {
            memberships: {
              some: { userId: req.user.id },
            },
          },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(projects);
};

const addMember = async (req, res) => {
  try {
    const data = addMemberSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const member = await prisma.projectMembership.upsert({
      where: {
        projectId_userId: {
          projectId: req.project.id,
          userId: user.id,
        },
      },
      create: {
        projectId: req.project.id,
        userId: user.id,
        role: data.role,
      },
      update: {
        role: data.role,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json(member);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }
    return res.status(500).json({ message: "Failed to add member" });
  }
};

module.exports = { createProject, listProjects, addMember };
