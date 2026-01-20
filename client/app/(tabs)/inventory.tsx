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
import { inventoryApi } from "../../services/inventory";
import { InventoryItem } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [equipping, setEquipping] = useState<number | null>(null);
  const { refreshUser } = useAuth();

  const loadItems = async () => {
    try {
      const data = await inventoryApi.getInventory();
      setItems(data);
    } catch (error) {
      console.log("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, []),
  );

  const handleEquip = async (item: InventoryItem) => {
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
