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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { examsApi } from "../../services/exams";

const NOTIFICATION_OPTIONS = [
  { label: "ก่อน 1 นาที", value: 1 },
  { label: "ก่อน 1 ชั่วโมง", value: 60 },
  { label: "ก่อน 1 วัน", value: 1440 },
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อการสอบ");
      return;
    }

    if (examDateTime <= new Date()) {
      Alert.alert("ข้อผิดพลาด", "วันที่สอบต้องเป็นอนาคต");
      return;
    }

    setIsLoading(true);
    try {
      // Notification scheduling is now handled by exams.ts -> notificationService.ts
      await examsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        examDateTime: examDateTime.toISOString(),
        remindBeforeMinutes: selectedNotifications,
      });

      Alert.alert("สำเร็จ", "สร้างการสอบเรียบร้อย!", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "ข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถสร้างได้",
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

  const formattedDateTime = `${format(examDateTime, "HH:mm")} น. ${format(examDateTime, "d MMMM yyyy", { locale: th })}`;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.label}>ชื่อการสอบ</Text>
          <TextInput
            style={styles.input}
            placeholder="Computer Programming I"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>คำอธิบาย</Text>
          <TextInput
            style={styles.input}
            placeholder="ออกบทที่ 2 กัน 3"
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>เลือกวัน-เวลาสอบ</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => {
              setShowDatePicker(true);
              setTimeout(() => setShowTimePicker(true), 100);
            }}
          >
            <Text style={styles.dateTimeText}>{formattedDateTime}</Text>
          </TouchableOpacity>

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

          <Text style={styles.label}>ตั้งการแจ้งเตือน</Text>
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
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>BACK</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 10,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#333",
  },
  dateTimeButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
  },
  dateTimeText: {
    fontSize: 15,
    color: "#333",
  },
  notificationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  notificationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  notificationSelected: {
    backgroundColor: "#f5a623",
    borderColor: "#f5a623",
  },
  notificationText: {
    fontSize: 14,
    color: "#666",
  },
  notificationTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#f5a623",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  backButton: {
    backgroundColor: "#1a1a2e",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
