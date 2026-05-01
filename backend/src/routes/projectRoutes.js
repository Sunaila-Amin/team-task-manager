const express = require("express");
const { createProject, listProjects, addMember } = require("../controllers/projectController");
const { requireAuth } = require("../middleware/auth");
const { checkProjectAccess, requireProjectAdmin } = require("../middleware/projectAccess");

const router = express.Router();

router.use(requireAuth);
router.post("/", createProject);
router.get("/", listProjects);
router.post("/:projectId/members", checkProjectAccess, requireProjectAdmin, addMember);

module.exports = router;
