/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FarmSettings,
  NattuKozhiRateSettings,
  NotificationItem,
  OrderRecord,
  OrderStatus,
} from './types/eggFarm';
import { INITIAL_RATES, INITIAL_SETTINGS, INITIAL_ORDERS } from './data/initialData';
import { playNewOrderChime } from './utils/audioAlert';
import { MeeshoStyleCheckout } from './components/MeeshoStyleCheckout';
import { AdminPortal } from './components/AdminPortal';
import { NotificationCenter } from './components/NotificationCenter';
import { Sparkles, Maximize2 } from 'lucide-react';

const STORAGE_KEYS = {
  RATES: 'pannai_nattu_rates_v4',
  SETTINGS: 'pannai_settings_v4',
  ORDERS: 'pannai_orders_v4',
  NOTIFICATIONS: 'pannai_notifs_v4',
  LANGUAGE: 'pannai_lang_v4',
};

export default function App() {
  // 1. Persistent State
  const [rates, setRates] = useState<NattuKozhiRateSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RATES);
      return saved ? JSON.parse(saved) : INITIAL_RATES;
    } catch {
      return INITIAL_RATES;
    }
  });

  const [settings, setSettings] = useState<FarmSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          !parsed.farmName ||
          parsed.farmName === 'Arasan Nattu Kozhi Pannai' ||
          parsed.tamilFarmName === 'அரசன் நாட்டுக்கோழி பண்ணை'
        ) {
          return {
            ...parsed,
            farmName: INITIAL_SETTINGS.farmName,
            tamilFarmName: INITIAL_SETTINGS.tamilFarmName,
            gpayName: INITIAL_SETTINGS.gpayName,
          };
        }
        return parsed;
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'notif_init_1',
              orderId: 'NK-1024',
              customerName: 'Senthil Kumar',
              totalAmount: 350,
              totalEggs: 30,
              timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
              read: false,
            },
            {
              id: 'notif_init_2',
              orderId: 'NK-1023',
              customerName: 'Dr. Kavitha Mohan',
              totalAmount: 680,
              totalEggs: 60,
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              read: true,
            },
          ];
    } catch {
      return [];
    }
  });

  const [language, setLanguage] = useState<'en' | 'ta'>('ta'); // Default to Tamil
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [selectedOrderIdForTracking, setSelectedOrderIdForTracking] = useState<string | undefined>(undefined);
  const [recentToast, setRecentToast] = useState<{ message: string; sub?: string } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATES, JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // New Order Placed Handler (Triggers Audio Chime Alert)
  const handleOrderPlaced = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);

    // Play synthesized Web Audio chime alert for the farm owner
    playNewOrderChime();

    // Create notification item
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      orderId: newOrder.id,
      customerName: newOrder.customer.fullName,
      totalAmount: newOrder.totalAmount,
      totalEggs: newOrder.totalEggs,
      timestamp: newOrder.createdAt,
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Show instant toast alert
    setRecentToast({
      message: `🐓 New Order Received: ${newOrder.id}`,
      sub: `${newOrder.customer.fullName} · ₹${newOrder.totalAmount} (${newOrder.totalEggs} Country Eggs)`,
    });
    setTimeout(() => setRecentToast(null), 6000);

    setSelectedOrderIdForTracking(newOrder.id);
  };

  const handleUpdateRates = (newRates: NattuKozhiRateSettings) => {
    setRates(newRates);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    deliveryDetails?: { name: string; phone: string }
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            ...(deliveryDetails ? { assignedDeliveryBoy: deliveryDetails } : {}),
            estimatedDelivery:
              status === 'delivered'
                ? 'Delivered Fresh to Customer'
                : status === 'out_for_delivery'
                ? 'Out for delivery with rider'
                : o.estimatedDelivery,
          };
        }
        return o;
      })
    );
  };

  const handleUpdateSettings = (newSettings: FarmSettings) => {
    setSettings(newSettings);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen w-full bg-[#1c1917] flex items-center justify-center p-0 sm:p-4 overflow-hidden relative font-sans">
      {/* Background ambient farm lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-orange-950/25 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Alert */}
      {recentToast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white border border-amber-600/50 rounded-2xl px-5 py-3 shadow-2xl max-w-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="p-1.5 bg-amber-600 rounded-xl text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold">{recentToast.message}</div>
            {recentToast.sub && <div className="text-[11px] text-stone-300 mt-0.5">{recentToast.sub}</div>}
          </div>
        </div>
      )}

      {/* FIXED 16:9 WIDESCREEN CONTAINER */}
      <div className="w-full h-screen sm:h-auto sm:aspect-[16/9] sm:max-h-[92vh] sm:max-w-6xl bg-[#faf8f5] shadow-2xl sm:rounded-3xl border sm:border-stone-700/60 flex flex-col overflow-hidden relative">
        <MeeshoStyleCheckout
          rates={rates}
          settings={settings}
          language={language}
          onOrderPlaced={handleOrderPlaced}
          orders={orders}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          unreadNotifications={unreadNotificationsCount}
          onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'ta' : 'en'))}
          initialOrderId={selectedOrderIdForTracking}
        />
      </div>

      {/* Owner Control Portal Modal */}
      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        rates={rates}
        onUpdateRates={handleUpdateRates}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        language={language}
      />

      {/* Owner Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onSelectOrder={(orderId) => {
          setSelectedOrderIdForTracking(orderId);
        }}
        language={language}
      />
    </div>
  );
}
