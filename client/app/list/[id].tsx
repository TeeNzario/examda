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
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { examsApi } from "../../services/exams";

export default function EditExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examDateTime, setExamDateTime] = useState(new Date());
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
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อการสอบ");
      return;
    }

    setIsSaving(true);
    try {
      await examsApi.update(parseInt(id), {
        name: name.trim(),
        description: description.trim() || undefined,
        examDateTime: examDateTime.toISOString(),
      });
      Alert.alert("สำเร็จ", "บันทึกข้อมูลเรียบร้อย!", [
        { text: "ตกลง", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        "ข้อผิดพลาด",
        error.response?.data?.message || "ไม่สามารถบันทึกได้",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("ลบการสอบ", "คุณต้องการลบการสอบนี้ใช่ไหม?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            await examsApi.delete(parseInt(id));
            router.back();
          } catch (error) {
            Alert.alert("ข้อผิดพลาด", "ไม่สามารถลบได้");
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

  const formattedDateTime = `${format(examDateTime, "HH:mm")} น. ${format(examDateTime, "d MMMM yyyy", { locale: th })}`;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

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
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
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

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>ลบการสอบนี้</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#5b7cfa",
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
