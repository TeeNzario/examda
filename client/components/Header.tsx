import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
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
          <Text style={styles.helloText}>Hello</Text>
          <Text style={styles.nameText}>{user?.firstName || "User"}</Text>
        </View>
      </TouchableOpacity>

      {showCoins && (
        <TouchableOpacity
          style={styles.coinContainer}
          onPress={() => router.push("/(tabs)/shop")}
        >
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
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
  coinContainer: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  coinText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
