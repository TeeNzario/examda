import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Header from "../../components/Header";
import OfflineScreen from "../../components/OfflineScreen";
import { inventoryApi } from "../../services/inventory";
import { InventoryItem } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useIsOnline } from "../../context/NetworkContext";
import { checkIsOnline } from "../../hooks/useNetworkStatus";

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipping, setEquipping] = useState<number | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { refreshUser } = useAuth();
  const isOnline = useIsOnline();

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryApi.getInventory();
      setItems(data);
      setIsUnlocked(true); // Successfully loaded = unlocked
    } catch (error) {
      console.log("Error loading inventory:", error);
      setIsUnlocked(false);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle retry from offline screen
  const handleRetry = async () => {
    const online = await checkIsOnline();
    if (online) {
      await loadItems();
    } else {
      throw new Error("Still offline");
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Reset unlock state on focus
      const checkAndLoad = async () => {
        const online = await checkIsOnline();
        if (online) {
          loadItems();
        } else {
          setIsUnlocked(false);
          setIsLoading(false);
        }
      };
      checkAndLoad();
    }, []),
  );

  // Show offline screen if not unlocked and not online
  if (!isUnlocked && !isOnline) {
    return (
      <OfflineScreen
        message="Inventory requires an internet connection to view and equip items."
        onRetry={handleRetry}
      />
    );
  }

  // If was unlocked but now offline and trying to load, show loading
  if (isLoading && !isUnlocked) {
    return (
      <View style={styles.container}>
        <Header showCoins={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Connecting...</Text>
        </View>
      </View>
    );
  }

  const handleEquip = async (item: InventoryItem) => {
    // Check connectivity before equip action
    const online = await checkIsOnline();
    if (!online) {
      Alert.alert(
        "ไม่มีการเชื่อมต่อ",
        "กรุณาเชื่อมต่ออินเทอร์เน็ตเพื่อสวมใส่ไอเทม",
      );
      return;
    }

    if (item.isEquipped) {
      // Already equipped, unequip it
      setEquipping(item.id);
      try {
        await inventoryApi.unequipItem();
        await refreshUser();
        await loadItems();
        Alert.alert("สำเร็จ", "ถอดไอเทมเรียบร้อย");
      } catch (error: any) {
        Alert.alert("ข้อผิดพลาด", error.response?.data?.message || "ไม่สำเร็จ");
      } finally {
        setEquipping(null);
      }
    } else {
      // Equip new item
      setEquipping(item.id);
      try {
        await inventoryApi.equipItem(item.id);
        await refreshUser();
        await loadItems();
        Alert.alert("สำเร็จ", `สวมใส่ ${item.name} เรียบร้อย!`);
      } catch (error: any) {
        Alert.alert("ข้อผิดพลาด", error.response?.data?.message || "ไม่สำเร็จ");
      } finally {
        setEquipping(null);
      }
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemCard}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>
        <TouchableOpacity
          style={[styles.equipButton, item.isEquipped && styles.equippedButton]}
          onPress={() => handleEquip(item)}
          disabled={equipping === item.id}
        >
          {equipping === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={[
                styles.equipButtonText,
                item.isEquipped && styles.equippedButtonText,
              ]}
            >
              {item.isEquipped ? "EQUIPED" : "EQUIP"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header showCoins={false} />

      <View style={styles.inventoryContainer}>
        <Text style={styles.title}>INVENTORY</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ยังไม่มีไอเทม</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadItems();
                }}
                tintColor="#fff"
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  inventoryContainer: {
    flex: 1,
    backgroundColor: "#4a6cf0",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 100,
    borderRadius: 24,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 24,
  },
  list: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  itemContainer: {
    width: "47%",
    alignItems: "center",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  itemImage: {
    width: "80%",
    height: "80%",
    resizeMode: "contain",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  equipButton: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  equippedButton: {
    backgroundColor: "#1a1a2e",
  },
  equipButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  equippedButtonText: {
    color: "#fff",
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
    fontSize: 18,
    color: "#fff",
  },
});
