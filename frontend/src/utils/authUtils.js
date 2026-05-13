// utils/authUtils.js

export function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error("Error parsing user from localStorage:", err);
    return null;
  }
}

// 👇 Add this function to get userId easily
export function getUserId() {
  const user = getCurrentUser();
  return user?.userId || null;
}
