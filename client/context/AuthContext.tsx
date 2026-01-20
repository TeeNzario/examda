import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { User } from "../types";
import { authApi } from "../services/auth";
import { usersApi } from "../services/users";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserCoins: (coins: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      if (storedToken) {
        setToken(storedToken);
        // Fetch user profile
        const userProfile = await usersApi.getProfile();
        setUser(userProfile);
        // Register push notifications
        await registerForPushNotifications();
      }
    } catch (error) {
      console.log("Error loading auth:", error);
      await SecureStore.deleteItemAsync("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log("Push notifications only work on physical devices");
      return;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Push notification permission not granted");
        return;
      }

      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Will be auto-configured in production
      });

      // Update push token on server
      await usersApi.updatePushToken(pushToken.data);

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    } catch (error) {
      console.log("Error registering for push notifications:", error);
    }
  };

  const login = async (studentId: string, password: string) => {
    const response = await authApi.login(studentId, password);
    await SecureStore.setItemAsync("authToken", response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    // Register push notifications after login
    await registerForPushNotifications();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const userProfile = await usersApi.getProfile();
      setUser(userProfile);
    }
  };

  const updateUserCoins = (coins: number) => {
    if (user) {
      setUser({ ...user, coin: coins });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshUser,
        updateUserCoins,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
