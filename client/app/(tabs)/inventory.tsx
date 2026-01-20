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
    setEquipping(item.id);
    try {
      if (item.isEquipped) {
        await inventoryApi.unequipItem();
      } else {
        await inventoryApi.equipItem(item.id);
      }
      await refreshUser();
      loadItems();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Action failed");
    } finally {
      setEquipping(null);
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={[styles.itemCard, item.isEquipped && styles.equippedCard]}>
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      )}
      <Text style={styles.itemName}>{item.name}</Text>

      {item.isEquipped && (
        <View style={styles.equippedBadge}>
          <Text style={styles.equippedText}>Equipped</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, item.isEquipped && styles.unequipButton]}
        onPress={() => handleEquip(item)}
        disabled={equipping === item.id}
      >
        {equipping === item.id ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.actionButtonText}>
            {item.isEquipped ? "Unequip" : "Equip"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* No Header with coins here - as per requirements */}
      <View style={styles.headerSimple}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>Your collected items</Text>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#e94560"
            style={styles.loader}
          />
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Your inventory is empty</Text>
            <Text style={styles.emptySubtext}>
              Purchase items from the Shop to fill it!
            </Text>
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
                tintColor="#e94560"
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
    backgroundColor: "#1a1a2e",
  },
  headerSimple: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  list: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    alignItems: "center",
  },
  equippedCard: {
    borderColor: "#e94560",
    borderWidth: 2,
  },
  itemImage: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  equippedBadge: {
    backgroundColor: "#e94560",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  equippedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  unequipButton: {
    backgroundColor: "#0f3460",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});
