import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";
import { Exam, SyncStatus } from "../types";

interface ExamCardProps {
  exam: Exam;
  syncStatus?: SyncStatus;
  onEdit?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export default function ExamCard({
  exam,
  syncStatus,
  onEdit,
  onComplete,
  showActions = false,
}: ExamCardProps) {
  const examDate = new Date(exam.examDateTime);
  const truncatedDescription = exam.description
    ? exam.description.length > 30
      ? exam.description.substring(0, 30) + "..."
      : exam.description
    : "ไม่มีรายละเอียด";

  // Determine sync icon
  const getSyncIcon = () => {
    if (!syncStatus) return null;

    if (syncStatus === "synced") {
      return (
        <Ionicons
          name="cloud-done"
          size={18}
          color="#4CAF50"
          style={styles.syncIcon}
        />
      );
    }
    return (
      <Ionicons
        name="cloud-offline-outline"
        size={18}
        color="#9e9e9e"
        style={styles.syncIcon}
      />
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          {getSyncIcon()}
          <Text style={styles.name}>{exam.name}</Text>
        </View>
        {showActions && onEdit && (
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Ionicons name="pencil" size={20} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.dateTimeRow}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{format(examDate, "HH:mm")} น.</Text>
        </View>
        <Text style={styles.dateText}>
          {format(examDate, "d MMMM yyyy", { locale: th })}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.description}>{truncatedDescription}</Text>
        {showActions && onComplete && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeButtonText}>เสร็จแล้ว</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  syncIcon: {
    marginRight: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    fontSize: 13,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    fontSize: 13,
    color: "#888",
    flex: 1,
  },
  completeButton: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
