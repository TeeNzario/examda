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
  { label: "10 Seconds", seconds: 10, reward: 2 },
  { label: "20 Minutes", seconds: 20 * 60, reward: 10 },
  { label: "30 Minutes", seconds: 30 * 60, reward: 15 },
  { label: "1 Hour", seconds: 60 * 60, reward: 60 },
];

export default function CountScreen() {
  const [selectedOption, setSelectedOption] = useState<TimerOption | null>(
    null,
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [earnedReward, setEarnedReward] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { refreshUser, user, updateUserCoins } = useAuth();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = (option: TimerOption) => {
    setSelectedOption(option);
    setTimeRemaining(option.seconds);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timer completed
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setEarnedReward(option.reward);
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
    setTimeRemaining(0);
    setSelectedOption(null);
    setShowStopModal(false);
  };

  const handleCompleteConfirm = async () => {
    try {
      // Award coins
      const updatedUser = await usersApi.addCoins(earnedReward);
      updateUserCoins(updatedUser.coin);
    } catch (error) {
      console.log("Error adding coins:", error);
    }
    setShowCompleteModal(false);
    setSelectedOption(null);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.title}>Focus Timer</Text>
        <Text style={styles.subtitle}>Stay focused and earn coins!</Text>

        {isRunning ? (
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>{selectedOption?.label}</Text>
            <Text style={styles.timer}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.rewardPreview}>
              🪙 +{selectedOption?.reward} coins on completion
            </Text>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            {TIMER_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => startTimer(option)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionReward}>🪙 +{option.reward}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Stop Confirmation Modal */}
      <Modal visible={showStopModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Stop Timer?</Text>
            <Text style={styles.modalText}>
              You will lose your progress and won't receive any coins.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowStopModal(false)}
              >
                <Text style={styles.modalCancelText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmStop}
              >
                <Text style={styles.modalConfirmText}>Stop</Text>
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
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalText}>
              You focused for {selectedOption?.label} and earned
            </Text>
            <Text style={styles.rewardText}>🪙 +{earnedReward} coins</Text>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleCompleteConfirm}
            >
              <Text style={styles.modalConfirmText}>Awesome!</Text>
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
    backgroundColor: "#1a1a2e",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  optionReward: {
    fontSize: 16,
    color: "#ffd700",
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 20,
    color: "#888",
    marginBottom: 16,
  },
  timer: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#e94560",
    fontVariant: ["tabular-nums"],
  },
  rewardPreview: {
    fontSize: 18,
    color: "#ffd700",
    marginTop: 24,
    marginBottom: 48,
  },
  stopButton: {
    backgroundColor: "#ff4757",
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#16213e",
    borderRadius: 16,
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
    color: "#fff",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffd700",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#0f3460",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#e94560",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
