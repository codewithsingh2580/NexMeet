import { verifyToken } from "../jwt.js";

// Attach verified user payload to req.user
// Usage: router.get("/me", requireAuth, getMe)
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    req.user = payload; // { id, email, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
