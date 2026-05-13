import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(); // ✅ Add named export here

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const isTokenValid = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  useEffect(() => {
  try {
   // console.log("🔁 Rehydrating auth...");

    const impersonateToken = localStorage.getItem("impersonateToken");
    const impersonateUser = JSON.parse(
      localStorage.getItem("impersonateUser")
    );

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    // 🔥 FIRST PRIORITY: Impersonation
    if (impersonateToken && impersonateUser && isTokenValid(impersonateToken)) {
      setUser(impersonateUser);
      setToken(impersonateToken);
      //console.log("🟣 Impersonation session active");
    }
    // ✅ NORMAL LOGIN
    else if (token && user && isTokenValid(token)) {
      setUser(user);
      setToken(token);
     // console.log("✅ Normal auth restored");
    }
    // ❌ INVALID
    else {
      console.warn("⛔ Auth invalid, clearing storage");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("impersonateToken");
      localStorage.removeItem("impersonateUser");
    }
  } catch (err) {
    console.error("🔴 Auth rehydrate failed", err);
    localStorage.clear();
  } finally {
    setReady(true);
  }
}, []);


  const login = (userData, authToken) => {
    if (!userData || !authToken) return;

    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
   // console.log("✅ Logged in and saved to localStorage.");
  };

  const logout = () => {
   // console.log("🚪 Logging out...");
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        ready,
        login,
        logout,
        updateUser,
        setUser,
        setToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
