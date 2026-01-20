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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { examsApi } from "../../services/exams";

const NOTIFICATION_OPTIONS = [
  { label: "1 minute before", value: 1 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

export default function CreateExamScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examDateTime, setExamDateTime] = useState(new Date());
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>(
    [],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleNotification = (value: number) => {
    setSelectedNotifications((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  // Schedule local notifications on device
  const scheduleLocalNotifications = async (
    examName: string,
    examDate: Date,
    reminderMinutes: number[],
  ) => {
    for (const minutes of reminderMinutes) {
      const notifyAt = new Date(examDate.getTime() - minutes * 60 * 1000);

      // Skip if notification time is in the past
      if (notifyAt <= new Date()) {
        console.log(
          `Skipping notification for ${minutes} min - time already passed`,
        );
        continue;
      }

      const secondsUntil = Math.floor((notifyAt.getTime() - Date.now()) / 1000);

      let timeString = "";
      if (minutes === 1) {
        timeString = "in 1 minute";
      } else if (minutes === 60) {
        timeString = "in 1 hour";
      } else if (minutes === 1440) {
        timeString = "tomorrow";
      }

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📚 Exam Reminder",
            body: `${examName} is ${timeString}!`,
            data: { examName },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: secondsUntil,
          },
        });
        console.log(
          `Scheduled notification for ${examName} - ${minutes} min before (in ${secondsUntil}s)`,
        );
      } catch (error) {
        console.log(`Error scheduling notification:`, error);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an exam name");
      return;
    }

    if (examDateTime <= new Date()) {
      Alert.alert("Error", "Exam date must be in the future");
      return;
    }

    setIsLoading(true);
    try {
      // Create exam on server
      await examsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        examDateTime: examDateTime.toISOString(),
        remindBeforeMinutes: selectedNotifications,
      });

      // Schedule LOCAL notifications (works in Expo Go!)
      if (selectedNotifications.length > 0) {
        await scheduleLocalNotifications(
          name.trim(),
          examDateTime,
          selectedNotifications,
        );
      }

      Alert.alert("Success", "Exam created with notifications!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create exam",
      );
    } finally {
      setIsLoading(false);
    }
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
          minimumDate={new Date()}
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
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
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
});
