import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ExamCard from "../../components/ExamCard";
import { examsApi } from "../../services/exams";
import { Exam, SyncStatus } from "../../types";
import { useAuth } from "../../context/AuthContext";

type ExamWithSync = {
  exam: Exam;
  syncStatus: SyncStatus;
  localId: number;
};

export default function ListScreen() {
  const [exams, setExams] = useState<ExamWithSync[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { updateUserCoins } = useAuth();

  const loadExams = async () => {
    try {
      const data = await examsApi.getAllWithSync();
      setExams(data);
    } catch (error) {
      console.log("Error loading exams:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExams();
    }, []),
  );

  const handleComplete = async (exam: Exam, localId: number) => {
    Alert.alert(
      "ยืนยัน",
      `ทำเครื่องหมาย "${exam.name}" ว่าเสร็จแล้ว? คุณจะได้รับ 5 coins!`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "เสร็จแล้ว",
          onPress: async () => {
            // Optimistically remove from UI immediately
            setExams((prev) => prev.filter((item) => item.localId !== localId));

            try {
              const result = await examsApi.complete(localId);
              // Update coins in context from SQLite total
              updateUserCoins(result.newCoinTotal);
              Alert.alert("สำเร็จ", "สอบเสร็จแล้ว! +5 coins 🪙");
            } catch (error: any) {
              // Reload list on error (shouldn't normally happen)
              loadExams();
              Alert.alert("Error", error.message || "ไม่สำเร็จ");
            }
          },
        },
      ],
    );
  };

  const renderExam = ({ item }: { item: ExamWithSync }) => (
    <ExamCard
      exam={item.exam}
      syncStatus={item.syncStatus}
      showActions
      onEdit={() => router.push(`/list/${item.localId}`)}
      onComplete={() => handleComplete(item.exam, item.localId)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>ยังไม่มีการสอบ</Text>
          </View>
        ) : (
          <FlatList
            data={exams}
            renderItem={renderExam}
            keyExtractor={(item) => item.localId.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadExams();
                }}
                tintColor="#fff"
              />
            }
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/list/create")}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5b7cfa",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  list: {
    paddingBottom: 100,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 24,
  },
  bottomNav: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#f5a623",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
