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
import { shopApi } from "../../services/shop";
import { ShopItem } from "../../types";
import { useAuth } from "../../context/AuthContext";

export default function ShopScreen() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const { user, refreshUser } = useAuth();

  const loadItems = async () => {
    try {
      const data = await shopApi.getItems();
      setItems(data);
    } catch (error) {
      console.log("Error loading shop items:", error);
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

  const handlePurchase = async (item: ShopItem) => {
    if (item.isPurchased) return;

    if ((user?.coin || 0) < item.price) {
      Alert.alert(
        "Not Enough Coins",
        "You need more coins to purchase this item.",
      );
      return;
    }

    Alert.alert("Purchase Item", `Buy ${item.name} for ${item.price} coins?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Purchase",
        onPress: async () => {
          setPurchasing(item.id);
          try {
            await shopApi.purchaseItem(item.id);
            await refreshUser();
            loadItems();
            Alert.alert("Success", `You purchased ${item.name}!`);
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.response?.data?.message || "Purchase failed",
            );
          } finally {
            setPurchasing(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, item.isPurchased && styles.purchasedCard]}
      onPress={() => handlePurchase(item)}
      disabled={item.isPurchased || purchasing === item.id}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      )}
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDescription} numberOfLines={2}>
        {item.description}
      </Text>

      {item.isPurchased ? (
        <View style={styles.purchasedBadge}>
          <Text style={styles.purchasedText}>Purchased ✓</Text>
        </View>
      ) : purchasing === item.id ? (
        <ActivityIndicator color="#e94560" style={styles.purchaseButton} />
      ) : (
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>🪙 {item.price}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.subtitle}>
          Customize your profile with stickers!
        </Text>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#e94560"
            style={styles.loader}
          />
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items available</Text>
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
    marginBottom: 24,
  },
  list: {
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
  purchasedCard: {
    opacity: 0.7,
    borderColor: "#2ecc71",
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
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 12,
  },
  priceContainer: {
    backgroundColor: "#0f3460",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  priceText: {
    color: "#ffd700",
    fontSize: 14,
    fontWeight: "600",
  },
  purchasedBadge: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  purchasedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  purchaseButton: {
    paddingVertical: 8,
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
    color: "#888",
  },
});
