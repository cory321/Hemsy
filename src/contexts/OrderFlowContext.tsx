'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Tables } from '@/types/supabase';
import { getClient } from '@/lib/actions/clients';

// Types for order flow
export interface ServiceLine {
  id?: string;
  serviceId?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: 'item' | 'hour' | 'day';
  unitPriceCents: number;
  inline?: {
    name: string;
    description?: string;
  };
}

export interface GarmentDraft {
  id: string; // Temporary ID for UI tracking
  name: string;
  // When true, indicates the user has manually typed/edited the garment name.
  // Used to prevent auto-updating the name from preset icon selections.
  isNameUserEdited?: boolean;
  notes?: string;
  dueDate?: string | undefined;
  eventDate?: string | undefined;
  specialEvent: boolean;
  services: ServiceLine[];
  imageCloudId?: string | undefined; // Cloudinary public ID
  imageUrl?: string | undefined; // Full Cloudinary URL
  imageThumbnailUrl?: string | undefined; // Cloudinary thumbnail URL
  // Preset proxy image key (e.g., "tops.button_up_shirt"). Used when no real photo is uploaded.
  presetIconKey?: string | undefined;
  // Optional colors for parameterized preset SVGs
  presetOutlineColor?: string | undefined;
  presetFillColor?: string | undefined;
}

export interface OrderDraft {
  clientId: string;
  client?: Tables<'clients'> | undefined;
  garments: GarmentDraft[];
  discountCents: number;
  notes?: string | undefined;
}

interface OrderFlowContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  orderDraft: OrderDraft;
  updateOrderDraft: (updates: Partial<OrderDraft>) => void;
  addGarment: (garment: GarmentDraft) => void;
  updateGarment: (id: string, updates: Partial<GarmentDraft>) => void;
  removeGarment: (id: string) => void;
  addServiceToGarment: (garmentId: string, service: ServiceLine) => void;
  updateServiceInGarment: (
    garmentId: string,
    serviceIndex: number,
    updates: Partial<ServiceLine>
  ) => void;
  removeServiceFromGarment: (garmentId: string, serviceIndex: number) => void;
  updateGarmentImage: (
    garmentId: string,
    imageData: {
      publicId: string;
      url: string;
      thumbnailUrl?: string;
    }
  ) => void;
  removeGarmentImage: (garmentId: string) => void;
  resetOrder: () => void;
  calculateSubtotal: () => number;
  calculateTotal: (taxPercent: number) => number;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(
  undefined
);

const STORAGE_KEY = 'threadfolio_order_draft';

const initialOrderDraft: OrderDraft = {
  clientId: '',
  client: undefined,
  garments: [],
  discountCents: 0,
  notes: '',
};

export function OrderFlowProvider({
  children,
  initialClientId,
}: {
  children: ReactNode;
  initialClientId?: string;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [orderDraft, setOrderDraft] = useState<OrderDraft>(initialOrderDraft);

  // Fetch client data by ID
  const fetchClientData = async (clientId: string) => {
    try {
      const client = await getClient(clientId);
      if (client) {
        setOrderDraft((prev) => ({
          ...prev,
          clientId: client.id,
          client: client,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch client:', error);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only use stored data if no initialClientId is provided
        if (!initialClientId) {
          setOrderDraft(parsed);
        }
      } catch (e) {
        console.error('Failed to parse stored order draft:', e);
      }
    }
  }, [initialClientId]);

  // Handle initial client ID
  useEffect(() => {
    if (initialClientId && initialClientId !== orderDraft.clientId) {
      fetchClientData(initialClientId);
    }
  }, [initialClientId, orderDraft.clientId]);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderDraft));
  }, [orderDraft]);

  const updateOrderDraft = (updates: Partial<OrderDraft>) => {
    setOrderDraft((prev) => ({ ...prev, ...updates }));
  };

  const addGarment = (garment: GarmentDraft) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: [...prev.garments, garment],
    }));
  };

  const updateGarment = (id: string, updates: Partial<GarmentDraft>) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    }));
  };

  const removeGarment = (id: string) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.filter((g) => g.id !== id),
    }));
  };

  const addServiceToGarment = (garmentId: string, service: ServiceLine) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === garmentId ? { ...g, services: [...g.services, service] } : g
      ),
    }));
  };

  const updateServiceInGarment = (
    garmentId: string,
    serviceIndex: number,
    updates: Partial<ServiceLine>
  ) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === garmentId
          ? {
              ...g,
              services: g.services.map((s, idx) =>
                idx === serviceIndex ? { ...s, ...updates } : s
              ),
            }
          : g
      ),
    }));
  };

  const removeServiceFromGarment = (
    garmentId: string,
    serviceIndex: number
  ) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === garmentId
          ? {
              ...g,
              services: g.services.filter((_, idx) => idx !== serviceIndex),
            }
          : g
      ),
    }));
  };

  const updateGarmentImage = (
    garmentId: string,
    imageData: {
      publicId: string;
      url: string;
      thumbnailUrl?: string;
    }
  ) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === garmentId
          ? {
              ...g,
              imageCloudId: imageData.publicId,
              imageUrl: imageData.url,
              imageThumbnailUrl: imageData.thumbnailUrl,
            }
          : g
      ),
    }));
  };

  const removeGarmentImage = (garmentId: string) => {
    setOrderDraft((prev) => ({
      ...prev,
      garments: prev.garments.map((g) =>
        g.id === garmentId
          ? {
              ...g,
              imageCloudId: undefined,
              imageUrl: undefined,
              imageThumbnailUrl: undefined,
            }
          : g
      ),
    }));
  };

  const resetOrder = () => {
    setOrderDraft(initialOrderDraft);
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const calculateSubtotal = () => {
    return orderDraft.garments.reduce((total, garment) => {
      const garmentTotal = garment.services.reduce(
        (sum, service) => sum + service.quantity * service.unitPriceCents,
        0
      );
      return total + garmentTotal;
    }, 0);
  };

  const calculateTotal = (taxPercent: number) => {
    const subtotal = calculateSubtotal();
    const afterDiscount = subtotal - orderDraft.discountCents;
    const tax = Math.round(afterDiscount * taxPercent);
    return afterDiscount + tax;
  };

  return (
    <OrderFlowContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        orderDraft,
        updateOrderDraft,
        addGarment,
        updateGarment,
        removeGarment,
        addServiceToGarment,
        updateServiceInGarment,
        removeServiceFromGarment,
        updateGarmentImage,
        removeGarmentImage,
        resetOrder,
        calculateSubtotal,
        calculateTotal,
      }}
    >
      {children}
    </OrderFlowContext.Provider>
  );
}

export function useOrderFlow() {
  const context = useContext(OrderFlowContext);
  if (!context) {
    throw new Error('useOrderFlow must be used within OrderFlowProvider');
  }
  return context;
}
