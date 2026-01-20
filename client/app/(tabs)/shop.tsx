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
    if (item.isPurchased) {
      Alert.alert("แจ้งเตือน", "คุณซื้อไอเทมนี้แล้ว");
      return;
    }

    if ((user?.coin || 0) < item.price) {
      Alert.alert("เหรียญไม่พอ", "คุณต้องมีเหรียญเพิ่มเพื่อซื้อไอเทมนี้");
      return;
    }

    Alert.alert(
      "ยืนยันการซื้อ",
      `ซื้อ ${item.name} ในราคา ${item.price} เหรียญ?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ซื้อ",
          onPress: async () => {
            setPurchasing(item.id);
            try {
              await shopApi.purchaseItem(item.id);
              await refreshUser();
              loadItems();
              Alert.alert("สำเร็จ", `คุณได้ซื้อ ${item.name} แล้ว!`);
            } catch (error: any) {
              Alert.alert(
                "ข้อผิดพลาด",
                error.response?.data?.message || "ซื้อไม่สำเร็จ",
              );
            } finally {
              setPurchasing(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item, index }: { item: ShopItem; index: number }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemCard}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
      </View>
      <Text style={styles.priceText}>🪙 {item.price}</Text>
      <TouchableOpacity
        style={[styles.buyButton, item.isPurchased && styles.buyButtonDisabled]}
        onPress={() => handlePurchase(item)}
        disabled={item.isPurchased || purchasing === item.id}
      >
        {purchasing === item.id ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buyButtonText}>
            {item.isPurchased ? "OWNED" : "BUY"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.shopContainer}>
        <Text style={styles.title}>SHOP</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>ไม่มีไอเทม</Text>
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
  shopContainer: {
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
    marginBottom: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
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
  buyButton: {
    backgroundColor: "#f5a623",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buyButtonDisabled: {
    backgroundColor: "#ccc",
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
