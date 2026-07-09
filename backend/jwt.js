import jwt from "jsonwebtoken";

const JWT_SECRET  = process.env.JWT_SECRET  || "changeme-secret";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

// generate a signed JWT for a user
export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    JWT_NONE,
    { expiresIn: JWT_EXPIRES }
  );
};

// verify and decode a JWT — throws if invalid or expired
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_NONE);
};
