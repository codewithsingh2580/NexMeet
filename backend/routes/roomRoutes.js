import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  getRoomInfo,
  getRoomMessages,
  getRoomSessions,
} from "../controllers/roomController.js";

const router = Router();

router.get("/:roomId", requireAuth, getRoomInfo);
router.get("/:roomId/messages", requireAuth, getRoomMessages);
router.get("/:roomId/sessions", requireAuth, getRoomSessions);

export default router;
