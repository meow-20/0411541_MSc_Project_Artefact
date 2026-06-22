import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Load auth state once on app start
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        const storedUser = await AsyncStorage.getItem("authUser");
        const storedRole = await AsyncStorage.getItem("authRole");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRole(storedRole);   
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log("Error loading auth state:", e);
      } finally {
        setLoadingAuth(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (dataFromApi) => {
    try {
      const { user: apiUser, token: apiToken, role: apiRole } = dataFromApi;

      if (!apiToken) {
        console.log("Missing token in login response:", dataFromApi);
        return;
      }
       if (!apiRole) {
        console.log("Missing role in login response:", dataFromApi);
        // you can decide to default to 'customer' or early-return
        return;
      }

      setIsAuthenticated(true);
      setUser(apiUser);
      setToken(apiToken);
      setRole(apiRole);

      await AsyncStorage.setItem("authToken", apiToken);
      await AsyncStorage.setItem("authUser", JSON.stringify(apiUser));
      await AsyncStorage.setItem("authRole", apiRole);
    } catch (e) {
      console.log("Error saving auth state:", e);
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setRole(null); 

      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("authUser");
      await AsyncStorage.removeItem("authRole");
    } catch (e) {
      console.log("Error clearing auth state:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, role, loadingAuth, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
