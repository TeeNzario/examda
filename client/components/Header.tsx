import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useIsOnline } from "../context/NetworkContext";

interface HeaderProps {
  showCoins?: boolean;
}

export default function Header({ showCoins = true }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isOnline = useIsOnline();

  // Render avatar - show placeholder when offline or no image
  const renderAvatar = () => {
    const hasImage = user?.equippedItem?.imageUrl;

    if (!isOnline || !hasImage) {
      // Show offline/default placeholder
      return (
        <View style={styles.avatarPlaceholder}>
          <Ionicons
            name={!isOnline ? "cloud-offline-outline" : "person"}
            size={16}
            color="#fff"
          />
        </View>
      );
    }

    return (
      <Image
        source={{ uri: user.equippedItem!.imageUrl! }}
        style={styles.avatarImage}
      />
    );
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.profileSection}
        onPress={() => router.push("/profile")}
      >
        <View style={styles.avatarContainer}>{renderAvatar()}</View>
        <View style={styles.userInfo}>
          <Text style={styles.helloText}>Hello</Text>
          <Text style={styles.nameText}>{user?.firstName || "User"}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        {/* Offline indicator */}
        {!isOnline && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={16} color="#f5a623" />
          </View>
        )}

        {showCoins && (
          <TouchableOpacity
            style={styles.coinContainer}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.coinText}>🪙 {user?.coin ?? 0}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "column",
  },
  helloText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offlineIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 16,
  },
  coinContainer: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coinText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
