import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { examsApi } from "../../services/exams";

const NOTIFICATION_OPTIONS = [
  { label: "1 minute before", value: 1 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

export default function EditExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examDateTime, setExamDateTime] = useState(new Date());
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    [],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadExam();
  }, [id]);

  const loadExam = async () => {
    try {
      const exam = await examsApi.getOne(parseInt(id));
      setName(exam.name);
      setDescription(exam.description || "");
      setExamDateTime(new Date(exam.examDateTime));
      // Parse remindBeforeMinutes - it might be a string or array
      const reminders =
        typeof exam.remindBeforeMinutes === "string"
          ? JSON.parse(exam.remindBeforeMinutes)
          : exam.remindBeforeMinutes;
      setSelectedNotifications(reminders || []);
    } catch (error) {
      Alert.alert("Error", "Failed to load exam", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNotification = (value: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an exam name");
      return;
    }

    setIsSaving(true);
    try {
      await examsApi.update(parseInt(id), {
        name: name.trim(),
        description: description.trim() || undefined,
        examDateTime: examDateTime.toISOString(),
        remindBeforeMinutes: selectedNotifications,
      });
      Alert.alert("Success", "Exam updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update exam",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Exam", "Are you sure you want to delete this exam?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await examsApi.delete(parseInt(id));
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete exam");
          }
        },
      },
    ]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setExamDateTime((prev) => {
        const newDate = new Date(selectedDate);
        newDate.setHours(prev.getHours(), prev.getMinutes());
        return newDate;
      });
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      setExamDateTime((prev) => {
        const newDate = new Date(prev);
        newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
        return newDate;
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Exam Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter exam name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter description (optional)"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Date & Time *</Text>
      <View style={styles.dateTimeContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {examDateTime.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            🕐{" "}
            {examDateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={examDateTime}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={examDateTime}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}

      <Text style={styles.label}>Notifications</Text>
      <View style={styles.notificationContainer}>
        {NOTIFICATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.notificationOption,
              selectedNotifications.includes(option.value) &&
                styles.notificationSelected,
            ]}
            onPress={() => toggleNotification(option.value)}
          >
            <Text
              style={[
                styles.notificationText,
                selectedNotifications.includes(option.value) &&
                  styles.notificationTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Exam</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  notificationContainer: {
    gap: 8,
  },
  notificationOption: {
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  notificationSelected: {
    backgroundColor: "#e94560",
    borderColor: "#e94560",
  },
  notificationText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  notificationTextSelected: {
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#0f3460",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#e94560",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4757",
  },
  deleteButtonText: {
    color: "#ff4757",
    fontSize: 16,
    fontWeight: "600",
  },
});
