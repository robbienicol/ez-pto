import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

// ─── Configuration ────────────────────────────────────────────────────────────
// To connect real IAP (RevenueCat):
//   1. npx expo install react-native-purchases
//   2. Rebuild dev client: eas build --profile development --platform ios
//   3. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS in your .env
//   4. Replace the mock purchase/restore bodies below with the real implementations
//      (commented out stubs are provided)
//   5. Create a product with ID `full_report_7_99` and entitlement `full_report`
//      in your RevenueCat dashboard + App Store Connect

const PURCHASE_STORE_KEY = 'rsd_full_report_v1';
// const ENTITLEMENT_ID = 'full_report';
// const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';

export interface IAPState {
  isPurchased: boolean;
  isPurchasing: boolean;
  isRestoring: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

export function useIAP(): IAPState {
  const [isPurchased, setIsPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(PURCHASE_STORE_KEY).then(val => {
      if (val === 'true') setIsPurchased(true);
    });
  }, []);

  const purchase = useCallback(async () => {
    if (isPurchasing || isPurchased) return;
    setIsPurchasing(true);
    try {
      // ── RevenueCat implementation (uncomment when ready) ──────────────────
      // import Purchases from 'react-native-purchases';
      // Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      // const offerings = await Purchases.getOfferings();
      // const pkg = offerings.current?.availablePackages[0];
      // if (!pkg) throw new Error('No available packages');
      // await Purchases.purchasePackage(pkg);
      // const info = await Purchases.getCustomerInfo();
      // const active = !!info.entitlements.active[ENTITLEMENT_ID];
      // if (active) {
      //   await SecureStore.setItemAsync(PURCHASE_STORE_KEY, 'true');
      //   setIsPurchased(true);
      // }
      // ─────────────────────────────────────────────────────────────────────

      // Mock: simulates a successful purchase (remove when RevenueCat is live)
      await new Promise<void>(resolve => setTimeout(resolve, 1200));
      await SecureStore.setItemAsync(PURCHASE_STORE_KEY, 'true');
      setIsPurchased(true);
    } finally {
      setIsPurchasing(false);
    }
  }, [isPurchased, isPurchasing]);

  const restore = useCallback(async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      // ── RevenueCat implementation (uncomment when ready) ──────────────────
      // import Purchases from 'react-native-purchases';
      // const info = await Purchases.restorePurchases();
      // const active = !!info.entitlements.active[ENTITLEMENT_ID];
      // if (active) {
      //   await SecureStore.setItemAsync(PURCHASE_STORE_KEY, 'true');
      //   setIsPurchased(true);
      // }
      // ─────────────────────────────────────────────────────────────────────

      // Mock: checks local store (remove when RevenueCat is live)
      const val = await SecureStore.getItemAsync(PURCHASE_STORE_KEY);
      setIsPurchased(val === 'true');
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring]);

  return { isPurchased, isPurchasing, isRestoring, purchase, restore };
}
