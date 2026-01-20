import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import Header from "../../components/Header";
import { examsApi } from "../../services/exams";
import { Exam } from "../../types";

type FilterType = "thisWeek" | "thisMonth";

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD\nMORNING!";
  if (hour < 18) return "GOOD\nAFTERNOON!";
  return "GOOD\nEVENING!";
};

export default function HomeScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [filter, setFilter] = useState<FilterType>("thisWeek");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadExams = async () => {
    try {
      const data = await examsApi.getAll(filter);
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

  const renderExamCard = ({ item }: { item: Exam }) => {
    const examDate = new Date(item.examDateTime);
    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => router.push(`/list/${item.id}`)}
      >
        <Text style={styles.examName}>{item.name}</Text>
        <View style={styles.examDateRow}>
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{format(examDate, "HH:mm")} น.</Text>
          </View>
          <Text style={styles.dateText}>
            {format(examDate, "d MMMM yyyy", { locale: th })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
      </View>

      {/* Exam List Container */}
      <View style={styles.listContainer}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={styles.listTitle}>รายการสอบใกล้ๆ นี้</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push("/list")}
          >
            <Ionicons name="list" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "thisWeek" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("thisWeek")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "thisWeek" && styles.filterTextActive,
              ]}
            >
              สัปดาห์นี้
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "thisMonth" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("thisMonth")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "thisMonth" && styles.filterTextActive,
              ]}
            >
              เดือนนี้
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exam List */}
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#5b7cfa"
            style={styles.loader}
          />
        ) : exams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่มีการสอบ</Text>
          </View>
        ) : (
          <FlatList
            data={exams}
            renderItem={renderExamCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#5b7cfa"
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
    backgroundColor: "#5b7cfa",
  },
  greetingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  greetingText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 44,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  viewAllButton: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
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
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#f5a623",
    borderColor: "#f5a623",
  },
  filterText: {
    color: "#888",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  list: {
    paddingBottom: 100,
  },
  examCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  examName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  examDateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBadge: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
    color: "#666",
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
