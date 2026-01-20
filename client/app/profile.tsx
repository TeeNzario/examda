import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../services/users";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a new password");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.updateProfile({ password });
      Alert.alert("Success", "Password updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
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
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        {user?.equippedItem && (
          <View style={styles.equippedBadge}>
            <Text style={styles.equippedText}>
              Wearing: {user.equippedItem.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>First Name</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{user?.firstName}</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>

        <Text style={styles.label}>Student ID</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{user?.studentId}</Text>
        </View>
      </View>

      <View style={styles.passwordSection}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[
            styles.updateButton,
            isLoading && styles.updateButtonDisabled,
          ]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.inventoryButton}
          onPress={() => router.push("/(tabs)/inventory")}
        >
          <Text style={styles.inventoryButtonText}>Go to Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e94560",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  equippedBadge: {
    backgroundColor: "#16213e",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  equippedText: {
    color: "#ffd700",
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#a0a0a0",
    marginBottom: 8,
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    color: "#fff",
  },
  passwordSection: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#0f3460",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#fff",
  },
  updateButton: {
    backgroundColor: "#e94560",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  actionSection: {
    gap: 12,
  },
  inventoryButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  inventoryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  homeButton: {
    backgroundColor: "#0f3460",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4757",
  },
  logoutButtonText: {
    color: "#ff4757",
    fontSize: 16,
    fontWeight: "600",
  },
});
