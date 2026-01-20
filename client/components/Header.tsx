import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  showCoins?: boolean;
}

export default function Header({ showCoins = true }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.push("/profile")}>
        <View style={styles.userInfo}>
          {user?.equippedItem?.imageUrl ? (
            <Image
              source={{ uri: user.equippedItem.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.firstName?.charAt(0) || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.greeting}>
            Hello, {user?.firstName || "User"}!
          </Text>
        </View>
      </TouchableOpacity>

      {showCoins && (
        <TouchableOpacity
          style={styles.coinContainer}
          onPress={() => router.push("/(tabs)/shop")}
        >
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinText}>{user?.coin || 0}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#1a1a2e",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  coinContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16213e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  coinText: {
    color: "#ffd700",
    fontSize: 16,
    fontWeight: "600",
  },
});
