const prisma = require("../config/db");

const checkProjectAccess = async (req, res, next) => {
  const projectId = req.params.projectId || req.body.projectId;

  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      memberships: {
        where: { userId: req.user.id },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const isSystemAdmin = req.user.role === "ADMIN";
  const membership = project.memberships[0];

  if (!isSystemAdmin && !membership) {
    return res.status(403).json({ message: "No access to this project" });
  }

  req.project = project;
  req.projectRole = membership?.role;
  next();
};

const requireProjectAdmin = (req, res, next) => {
  const isSystemAdmin = req.user.role === "ADMIN";
  if (!isSystemAdmin && req.projectRole !== "ADMIN") {
    return res.status(403).json({ message: "Project admin access required" });
  }
  next();
};

module.exports = { checkProjectAccess, requireProjectAdmin };
