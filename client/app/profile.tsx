import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useIsOnline } from "../context/NetworkContext";
import { usersApi } from "../services/users";

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const isOnline = useIsOnline();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async () => {
    if (!password.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (password.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.updateProfile({ password });
      Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อย!");
      setPassword("");
      setConfirmPassword("");
      setShowPasswordModal(false);
    } catch (error: any) {
      Alert.alert(
        "ข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordPress = () => {
    if (!isOnline) {
      Alert.alert(
        "ไม่มีการเชื่อมต่อ",
        "การเปลี่ยนรหัสผ่านต้องการการเชื่อมต่ออินเทอร์เน็ต",
        [{ text: "ตกลง" }],
      );
      return;
    }
    setShowPasswordModal(true);
  };

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่ไหม?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  // Render avatar - show placeholder when offline or no image
  const renderAvatar = () => {
    const hasImage = user?.equippedItem?.imageUrl;

    if (!isOnline || !hasImage) {
      // Show offline placeholder
      return (
        <View style={styles.avatarPlaceholder}>
          <Ionicons
            name={isOnline ? "person" : "cloud-offline-outline"}
            size={48}
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Offline Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
            <Text style={styles.offlineBannerText}>Offline Mode</Text>
          </View>
        )}

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>{renderAvatar()}</View>
          <Text style={styles.userName}>{user?.firstName || "User"}</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>ข้อมูลส่วนตัว</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ชื่อ</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>{fullName || "-"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>อีเมล</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>{user?.email || "-"}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Coin Balance */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>เหรียญ</Text>
            <View style={styles.infoValueRow}>
              <Text style={styles.infoValue}>🪙 {user?.coin ?? 0}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.infoRow, !isOnline && styles.disabledRow]}
            onPress={handlePasswordPress}
            disabled={!isOnline}
          >
            <Text style={[styles.infoLabel, !isOnline && styles.disabledText]}>
              รหัสผ่าน
            </Text>
            <View style={styles.infoValueRow}>
              {!isOnline ? (
                <Text style={styles.offlineHint}>ต้องการอินเทอร์เน็ต</Text>
              ) : (
                <Text style={styles.infoValue}>**************</Text>
              )}
              <Ionicons
                name={isOnline ? "chevron-forward" : "lock-closed"}
                size={20}
                color={isOnline ? "#ccc" : "#999"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[
            styles.inventoryButton,
            !isOnline && styles.inventoryButtonDisabled,
          ]}
          onPress={() => {
            if (isOnline) {
              router.push("/(tabs)/inventory");
            } else {
              Alert.alert(
                "ไม่มีการเชื่อมต่อ",
                "Inventory ต้องการการเชื่อมต่ออินเทอร์เน็ต",
              );
            }
          }}
        >
          <Text style={styles.inventoryButtonText}>INVENTORY</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="รหัสผ่านใหม่"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.modalInput}
              placeholder="ยืนยันรหัสผ่าน"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleUpdatePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>บันทึก</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5b7cfa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 16,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  infoRow: {
    paddingVertical: 12,
  },
  disabledRow: {
    opacity: 0.6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 4,
  },
  disabledText: {
    color: "#aaa",
  },
  infoValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 16,
    color: "#1a1a1a",
    flex: 1,
  },
  offlineHint: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
  },
  inventoryButton: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  inventoryButtonDisabled: {
    opacity: 0.7,
  },
  inventoryButtonText: {
    color: "#1a1a1a",
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  logoutButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#f5a623",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
