const express = require("express");
const {
  createTask,
  listTasksByProject,
  updateTaskStatus,
} = require("../controllers/taskController");
const { requireAuth } = require("../middleware/auth");
const { checkProjectAccess } = require("../middleware/projectAccess");

const router = express.Router();

router.use(requireAuth);
router.post("/", checkProjectAccess, createTask);
router.get("/:projectId", checkProjectAccess, listTasksByProject);
router.patch("/:projectId/:taskId/status", checkProjectAccess, updateTaskStatus);

module.exports = router;
