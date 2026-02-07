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
import * as db from "../services/database";
import { cancelAllScheduledNotifications } from "../services/notifications";
import { checkIsOnline } from "../hooks/useNetworkStatus";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  login: (studentId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetAppData: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserCoins: (coins: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      if (storedToken) {
        setToken(storedToken);

        // Check if online
        const online = await checkIsOnline();
        setIsOnline(online);

        if (online) {
          try {
            // Fetch user profile from server
            const userProfile = await usersApi.getProfile();
            setUser(userProfile);
            // Cache user data locally
            await db.saveUserToCache(userProfile);
            // Register push notifications
            await registerForPushNotifications();
          } catch (error) {
            console.log("[Auth] Failed to fetch profile, trying cache:", error);
            // Fall back to cached user data
            await loadCachedUser();
          }
        } else {
          // Offline - load from cache
          await loadCachedUser();
        }
      }
    } catch (error) {
      console.log("Error loading auth:", error);
      await SecureStore.deleteItemAsync("authToken");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCachedUser = async () => {
    try {
      const cachedUser = await db.getCachedUser();
      if (cachedUser) {
        // Convert cached user to User type
        const user: User = {
          id: cachedUser.id,
          studentId: cachedUser.studentId,
          firstName: cachedUser.firstName,
          lastName: cachedUser.lastName,
          email: cachedUser.email,
          coin: cachedUser.coin,
          equippedItem: cachedUser.equippedItem,
        };
        setUser(user);
        console.log("[Auth] Loaded user from cache");
      }
    } catch (error) {
      console.log("[Auth] Failed to load cached user:", error);
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
    setIsOnline(true);

    // Cache user data locally
    await db.saveUserToCache(response.user);

    // Register push notifications after login
    await registerForPushNotifications();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("authToken");
    // Cancel all scheduled notifications before clearing data
    await cancelAllScheduledNotifications();
    // Clear all local data
    await db.resetLocalData();
    setToken(null);
    setUser(null);
  };

  const resetAppData = async () => {
    // Cancel all scheduled notifications first
    await cancelAllScheduledNotifications();
    // Clear all local data
    await db.resetLocalData();
    console.log("[Auth] App data reset complete");
  };

  const refreshUser = async () => {
    if (token) {
      const online = await checkIsOnline();
      setIsOnline(online);

      if (online) {
        try {
          const userProfile = await usersApi.getProfile();
          setUser(userProfile);
          // Update cache
          await db.saveUserToCache(userProfile);
        } catch (error) {
          console.log("[Auth] Failed to refresh user:", error);
        }
      }
    }
  };

  const updateUserCoins = (coins: number) => {
    if (user) {
      const updatedUser = { ...user, coin: coins };
      setUser(updatedUser);
      // Update cache
      db.updateCachedUserCoins(coins).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isOnline,
        login,
        logout,
        resetAppData,
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
