import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import Header from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../services/users";

interface TimerOption {
  label: string;
  seconds: number;
  reward: number;
}

const TIMER_OPTIONS: TimerOption[] = [
  { label: "10 นาที", seconds: 10 * 60, reward: 5 },
  { label: "20 นาที", seconds: 20 * 60, reward: 10 },
  { label: "30 นาที", seconds: 30 * 60, reward: 15 },
  { label: "1 ชั่วโมง", seconds: 60 * 60, reward: 30 },
];

export default function CountScreen() {
  const [selectedOption, setSelectedOption] = useState<TimerOption>(
    TIMER_OPTIONS[2],
  ); // Default 30 min
  const [timeRemaining, setTimeRemaining] = useState(TIMER_OPTIONS[2].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { updateUserCoins } = useAuth();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const selectDuration = (option: TimerOption) => {
    if (!isRunning) {
      setSelectedOption(option);
      setTimeRemaining(option.seconds);
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setEarnedReward(selectedOption.reward);
          setShowCompleteModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStop = () => {
    setShowStopModal(true);
  };

  const confirmStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setTimeRemaining(selectedOption.seconds);
    setShowStopModal(false);
  };

  const handleCompleteConfirm = async () => {
    try {
      const updatedUser = await usersApi.addCoins(earnedReward);
      updateUserCoins(updatedUser.coin);
    } catch (error) {
      console.log("Error adding coins:", error);
    }
    setShowCompleteModal(false);
    setTimeRemaining(selectedOption.seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.subtitle}>stay focus</Text>

        <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>

        {/* Duration Options */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            {TIMER_OPTIONS.slice(0, 2).map((option) => (
              <TouchableOpacity
                key={option.seconds}
                style={[
                  styles.optionButton,
                  selectedOption.seconds === option.seconds &&
                    styles.optionButtonActive,
                ]}
                onPress={() => selectDuration(option)}
                disabled={isRunning}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOption.seconds === option.seconds &&
                      styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.optionsRow}>
            {TIMER_OPTIONS.slice(2, 4).map((option) => (
              <TouchableOpacity
                key={option.seconds}
                style={[
                  styles.optionButton,
                  selectedOption.seconds === option.seconds &&
                    styles.optionButtonActive,
                ]}
                onPress={() => selectDuration(option)}
                disabled={isRunning}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedOption.seconds === option.seconds &&
                      styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start/Stop Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={isRunning ? handleStop : startTimer}
        >
          <Text style={styles.startButtonText}>
            {isRunning ? "STOP" : "START"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stop Confirmation Modal */}
      <Modal visible={showStopModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>หยุดจับเวลา?</Text>
            <Text style={styles.modalText}>
              คุณจะไม่ได้รับเหรียญถ้าหยุดตอนนี้
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowStopModal(false)}
              >
                <Text style={styles.modalCancelText}>ทำต่อ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmStop}
              >
                <Text style={styles.modalConfirmText}>หยุด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.celebrationIcon}>🎉</Text>
            <Text style={styles.modalTitle}>ยินดีด้วย!</Text>
            <Text style={styles.modalText}>
              คุณโฟกัสได้ {selectedOption.label} และได้รับ
            </Text>
            <Text style={styles.rewardText}>🪙 +{earnedReward} เหรียญ</Text>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleCompleteConfirm}
            >
              <Text style={styles.modalConfirmText}>เยี่ยม!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 18,
    color: "#d4dbf5",
    marginBottom: 16,
  },
  timer: {
    fontSize: 80,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
    marginBottom: 32,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  optionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  optionButtonActive: {
    backgroundColor: "#fff",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  optionTextActive: {
    color: "#f5a623",
  },
  startButton: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 64,
    paddingVertical: 18,
    borderRadius: 30,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  celebrationIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f5a623",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#f5a623",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
