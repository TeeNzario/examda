import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true, // Optimistic default
    isInternetReachable: null,
    connectionType: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const newState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      };

      setNetworkState(newState);

      // Log network changes for debugging
      console.log("[Network] State changed:", {
        connected: newState.isConnected,
        reachable: newState.isInternetReachable,
        type: newState.connectionType,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

/**
 * Check if the device is truly online (connected AND internet reachable)
 */
export function useIsOnline(): boolean {
  const { isConnected, isInternetReachable } = useNetwork();
  // Consider online if connected and internet is reachable (or reachability unknown)
  return isConnected && isInternetReachable !== false;
}
