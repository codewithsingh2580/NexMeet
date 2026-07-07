import User from "./models/User.js";

// Used by socketAuth.js to validate the token's user ID still exists in DB.
// Returns plain user object or null.
export const getUserById = async (id) => {
  try {
    const user = await User.findById(id).select("-password").lean();
    if (!user) return null;
    return {
      id:    user._id.toString(),
      name:  user.name,
      email: user.email,
    };
  } catch {
    return null;
  }
};
