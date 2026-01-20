import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { format } from "date-fns";
import { Exam } from "../types";

interface ExamCardProps {
  exam: Exam;
  onEdit?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export default function ExamCard({
  exam,
  onEdit,
  onComplete,
  showActions = false,
}: ExamCardProps) {
  const examDate = new Date(exam.examDateTime);
  const truncatedDescription = exam.description
    ? exam.description.length > 20
      ? exam.description.substring(0, 20) + "..."
      : exam.description
    : "No description";

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.name}>{exam.name}</Text>
        <Text style={styles.dateTime}>
          📅 {format(examDate, "MMM dd, yyyy")} at {format(examDate, "HH:mm")}
        </Text>
        <Text style={styles.description}>{truncatedDescription}</Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.editButton} onPress={onEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onComplete && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={onComplete}
            >
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#e94560",
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    color: "#a0a0a0",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#888",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: "#0f3460",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  completeButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
