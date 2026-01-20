import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "../context/AuthContext";

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

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="list/index"
          options={{
            title: "My Exams",
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="list/create"
          options={{
            title: "Create Exam",
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="list/[id]"
          options={{
            title: "Edit Exam",
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerStyle: { backgroundColor: "#1a1a2e" },
            headerTintColor: "#fff",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
