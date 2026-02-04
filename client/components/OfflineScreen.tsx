import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { checkIsOnline } from "../hooks/useNetworkStatus";

interface OfflineScreenProps {
  message?: string;
  showBackButton?: boolean;
  onRetry?: () => Promise<void>;
}

/**
 * Screen displayed when a feature requires internet connection but device is offline
 * Includes retry functionality to re-check connectivity
 */
export default function OfflineScreen({
  message = "Internet connection required.",
  showBackButton = true,
  onRetry,
}: OfflineScreenProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryMessage(null);

    try {
      // Re-check connectivity
      const isOnline = await checkIsOnline();

      if (isOnline) {
        // Connection restored - call onRetry to load data
        if (onRetry) {
          await onRetry();
        }
        setRetryMessage(null);
      } else {
        // Still offline
        setRetryMessage(
          "Still no connection. Please check your network settings.",
        );
      }
    } catch (error) {
      setRetryMessage("Connection check failed. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-offline-outline" size={80} color="#fff" />
        </View>

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>{message}</Text>

        {/* Retry feedback message */}
        {retryMessage && (
          <View style={styles.feedbackContainer}>
            <Ionicons name="warning-outline" size={16} color="#f5a623" />
            <Text style={styles.feedbackText}>{retryMessage}</Text>
          </View>
        )}

        {/* Retry Button */}
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <ActivityIndicator color="#5b7cfa" size="small" />
              <Text style={styles.retryButtonText}>Checking...</Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#5b7cfa" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Back Button */}
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5b7cfa",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  feedbackText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    marginBottom: 12,
    minWidth: 180,
    justifyContent: "center",
  },
  retryButtonDisabled: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: "#5b7cfa",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    minWidth: 180,
    justifyContent: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
