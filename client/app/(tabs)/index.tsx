import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";
import Header from "../../components/Header";
import ExamCard from "../../components/ExamCard";
import { examsApi } from "../../services/exams";
import { Exam } from "../../types";

type FilterType = "all" | "thisWeek" | "thisMonth";

export default function HomeScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadExams = async () => {
    try {
      const filterParam = filter === "all" ? undefined : filter;
      const data = await examsApi.getAll(filterParam);
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
    }, [filter]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  // Test notification function
  const sendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📚 Test Notification",
          body: "This is a test notification from Examda!",
          data: { test: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      Alert.alert("Success", "Notification scheduled! Wait 2 seconds...");
    } catch (error) {
      console.log("Notification error:", error);
      Alert.alert("Error", "Failed to schedule notification");
    }
  };

  const renderFilter = (label: string, value: FilterType) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[styles.filterText, filter === value && styles.filterTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderExam = ({ item }: { item: Exam }) => (
    <TouchableOpacity onPress={() => router.push(`/list/${item.id}`)}>
      <ExamCard exam={item} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Upcoming Exams</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/list")}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Test Notification Button */}
        <TouchableOpacity
          style={styles.testNotificationButton}
          onPress={sendTestNotification}
        >
          <Text style={styles.testNotificationText}>🔔 Test Notification</Text>
        </TouchableOpacity>

        <View style={styles.filterContainer}>
          {renderFilter("All", "all")}
          {renderFilter("This Week", "thisWeek")}
          {renderFilter("This Month", "thisMonth")}
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#e94560"
            style={styles.loader}
          />
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No upcoming exams</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push("/list/create")}
            >
              <Text style={styles.createButtonText}>Create an Exam</Text>
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
                onRefresh={onRefresh}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: "#e94560",
    fontSize: 14,
    fontWeight: "500",
  },
  testNotificationButton: {
    backgroundColor: "#2ecc71",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  testNotificationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#16213e",
  },
  filterButtonActive: {
    backgroundColor: "#e94560",
  },
  filterText: {
    color: "#888",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
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
    fontSize: 18,
    color: "#888",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#e94560",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
