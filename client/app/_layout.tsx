import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { NetworkProvider, useIsOnline } from "../context/NetworkContext";
import { initializeDatabase } from "../services/database";
import { syncExams, syncUserData } from "../services/syncService";

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [wasOffline, setWasOffline] = useState(false);

  // Handle authentication routing
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login");
    } else if (
      user &&
      !inAuthGroup &&
      segments[0] !== "list" &&
      segments[0] !== "profile"
    ) {
      // Redirect to home if authenticated and on login page
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      return;
    }

    // If we were offline and now online, trigger sync
    if (wasOffline && isOnline && user) {
      console.log("[App] Back online, triggering sync...");
      setWasOffline(false);

      // Sync in background
      syncExams().catch(console.error);
      syncUserData().catch(console.error);
    }
  }, [isOnline, wasOffline, user]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="list/index" options={{ headerShown: false }} />
        <Stack.Screen name="list/create" options={{ headerShown: false }} />
        <Stack.Screen name="list/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on app start
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        console.log("[App] Database initialized");
        setDbInitialized(true);
      } catch (error) {
        console.error("[App] Failed to initialize database:", error);
        // Still allow app to run, but offline features won't work
        setDbInitialized(true);
      }
    };
    init();
  }, []);

  if (!dbInitialized) {
    return null; // Or a loading screen
  }

  return (
    <NetworkProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </NetworkProvider>
  );
}
