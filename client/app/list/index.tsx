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
import { Exam } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function ListScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const loadExams = async () => {
    try {
      const data = await examsApi.getAll();
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

  const handleComplete = async (exam: Exam) => {
    Alert.alert(
      "Complete Exam",
      `Mark "${exam.name}" as complete? You will earn 5 coins!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              await examsApi.complete(exam.id);
              await refreshUser();
              loadExams();
              Alert.alert("Success", "Exam completed! +5 coins earned!");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to complete exam",
              );
            }
          },
        },
      ],
    );
  };

  const renderExam = ({ item }: { item: Exam }) => (
    <ExamCard
      exam={item}
      showActions
      onEdit={() => router.push(`/list/${item.id}`)}
      onComplete={() => handleComplete(item)}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>My Exams</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/list/create")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#e94560"
            style={styles.loader}
          />
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No exams yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/list/create")}
            >
              <Text style={styles.createButtonText}>
                Create Your First Exam
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={exams}
            renderItem={renderExam}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadExams();
                }}
                tintColor="#e94560"
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#e94560",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  list: {
    paddingBottom: 20,
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
    color: "#888",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
