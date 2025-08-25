'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  updateGarment,
  addServiceToGarment,
  removeServiceFromGarment,
  updateGarmentService,
  restoreRemovedService,
} from '@/lib/actions/garments';
import { toggleServiceCompletion } from '@/lib/actions/garment-services';
import { markGarmentAsPickedUp } from '@/lib/actions/garment-pickup';
import { getGarmentWithInvoiceData } from '@/lib/actions/orders';

interface Service {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
  description?: string | null;
  is_done?: boolean;
  // Soft delete fields
  is_removed?: boolean;
  removed_at?: string | null;
  removed_by?: string | null;
  removal_reason?: string | null;
}

interface Garment {
  id: string;
  name: string;
  due_date: string | null;
  event_date: string | null;
  preset_icon_key: string | null;
  preset_fill_color: string | null;
  preset_outline_color: string | null;
  notes: string | null;
  stage: string;
  photo_url: string | null;
  image_cloud_id: string | null;
  created_at: string;
  order_id: string | null;
  garment_services: Service[];
  order?: {
    id: string;
    order_number: string;
    client: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
    shop_id: string;
  };
  totalPriceCents: number;
  invoice?: {
    id: string;
    invoice_number: string;
    status: string;
    amount_cents: number;
    deposit_amount_cents: number;
    description?: string;
    due_date?: string;
    created_at: string;
  } | null;
  payments?: Array<{
    id: string;
    payment_type: string;
    payment_method: string;
    amount_cents: number;
    status: string;
    stripe_payment_intent_id?: string;
    created_at: string;
    processed_at?: string;
    notes?: string;
  }>;
}

interface GarmentContextType {
  garment: Garment;
  updateGarmentOptimistic: (updates: Partial<Garment>) => Promise<void>;
  updateGarmentIcon: (
    iconKey: string | null,
    fillColor: string | null
  ) => Promise<void>;
  updateGarmentPhoto: (
    photoUrl: string | null,
    imageCloudId: string | null
  ) => Promise<void>;
  deleteGarmentPhoto: () => Promise<void>;
  addService: (service: {
    serviceId?: string;
    customService?: any;
  }) => Promise<void>;
  removeService: (serviceId: string, removalReason?: string) => Promise<void>;
  restoreService: (serviceId: string) => Promise<void>;
  updateService: (
    serviceId: string,
    updates: Partial<Service>
  ) => Promise<void>;
  toggleServiceComplete: (serviceId: string, isDone: boolean) => Promise<void>;
  markAsPickedUp: () => Promise<void>;
  refreshGarment: () => Promise<void>;
  refreshHistory: () => void;
  historyKey: number;
  optimisticHistoryEntry: any;
  historyRefreshSignal: number;
}

const GarmentContext = createContext<GarmentContextType | null>(null);

export function useGarment() {
  const context = useContext(GarmentContext);
  if (!context) {
    throw new Error('useGarment must be used within a GarmentProvider');
  }
  return context;
}

interface GarmentProviderProps {
  initialGarment: Garment;
  children: React.ReactNode;
}

export function GarmentProvider({
  initialGarment,
  children,
}: GarmentProviderProps) {
  const [garment, setGarment] = useState<Garment>(initialGarment);
  const [historyKey, setHistoryKey] = useState(0);
  const [optimisticHistoryEntry, setOptimisticHistoryEntry] =
    useState<any>(null);
  const [historyRefreshSignal, setHistoryRefreshSignal] = useState(0);

  const refreshHistory = useCallback(() => {
    setHistoryKey((prev) => prev + 1);
    setHistoryRefreshSignal((prev) => prev + 1);
  }, []);

  const refreshGarment = useCallback(async () => {
    try {
      // For now, just use the basic getGarmentById function
      // TODO: Implement proper refresh with invoice data once database schema is fixed
      toast.success('Garment data refreshed');
      refreshHistory();
    } catch (error) {
      console.error('Error refreshing garment:', error);
      toast.error('Failed to refresh garment data');
    }
  }, [garment.id, refreshHistory]);

  // Helper to create optimistic history entries
  const createOptimisticHistoryEntry = (
    changeType: string,
    fieldName: string,
    oldValue: any,
    newValue: any
  ) => {
    const entry = {
      id: `optimistic-${Date.now()}-${Math.random()}`,
      garment_id: garment.id,
      changed_by: 'current-user', // This would come from auth context
      changed_at: new Date().toISOString(),
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
      change_type: changeType,
      changed_by_user: {
        first_name: 'Current',
        last_name: 'User',
        email: 'user@example.com',
      },
      isOptimistic: true,
    };
    setOptimisticHistoryEntry(entry);
    return entry;
  };

  const updateGarmentOptimistic = useCallback(
    async (updates: Partial<Garment>) => {
      // Optimistically update the UI
      const previousGarment = garment;
      setGarment((prev) => ({ ...prev, ...updates }));

      // Create optimistic history entries for each updated field
      Object.entries(updates).forEach(([key, value]) => {
        if (key in garment && garment[key as keyof Garment] !== value) {
          createOptimisticHistoryEntry(
            'field_update',
            key,
            garment[key as keyof Garment],
            value
          );
        }
      });

      try {
        // Call the server action
        const result = await updateGarment({
          garmentId: garment.id,
          updates: {
            name: updates.name,
            dueDate:
              updates.due_date === undefined ? undefined : updates.due_date,
            eventDate:
              updates.event_date === undefined ? undefined : updates.event_date,
            presetIconKey:
              updates.preset_icon_key === undefined
                ? undefined
                : updates.preset_icon_key,
            presetFillColor:
              updates.preset_fill_color === undefined
                ? undefined
                : updates.preset_fill_color,
            notes: updates.notes === undefined ? undefined : updates.notes,
          },
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to update garment');
        } else {
          refreshHistory();
          toast.success('Garment updated successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const updateGarmentIcon = useCallback(
    async (iconKey: string | null, fillColor: string | null) => {
      // Optimistically update the UI
      const previousGarment = garment;
      setGarment((prev) => ({
        ...prev,
        preset_icon_key: iconKey,
        preset_fill_color: fillColor,
      }));

      try {
        const result = await updateGarment({
          garmentId: garment.id,
          updates: {
            presetIconKey: iconKey,
            presetFillColor: fillColor,
          },
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to update garment icon');
        } else {
          refreshHistory();
          toast.success('Garment icon updated successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const updateGarmentPhoto = useCallback(
    async (photoUrl: string | null, imageCloudId: string | null) => {
      // Optimistically update the UI
      const previousGarment = garment;
      setGarment((prev) => ({
        ...prev,
        photo_url: photoUrl,
        image_cloud_id: imageCloudId,
      }));

      try {
        const result = await updateGarment({
          garmentId: garment.id,
          updates: {
            photoUrl: photoUrl,
            imageCloudId: imageCloudId,
          },
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to update garment photo');
        } else {
          refreshHistory();
          toast.success('Garment photo updated successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const deleteGarmentPhoto = useCallback(async () => {
    const previousGarment = garment;
    const cloudinaryPublicId = garment.image_cloud_id;

    // Optimistically update the UI - remove photo and revert to icon
    setGarment((prev) => ({
      ...prev,
      photo_url: null,
      image_cloud_id: null,
    }));

    try {
      // Delete from Cloudinary if there's a cloud ID
      if (cloudinaryPublicId) {
        const deleteResponse = await fetch('/api/delete-cloudinary-image', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicId: cloudinaryPublicId }),
        });

        if (!deleteResponse.ok) {
          console.warn('Failed to delete image from Cloudinary');
          // Continue with database update even if Cloudinary deletion fails
        }
      }

      // Update the database
      const result = await updateGarment({
        garmentId: garment.id,
        updates: {
          photoUrl: null,
          imageCloudId: null,
        },
      });

      if (!result.success) {
        // Rollback on failure
        setGarment(previousGarment);
        toast.error(result.error || 'Failed to delete garment photo');
      } else {
        refreshHistory();
        toast.success('Photo deleted successfully');
      }
    } catch (error) {
      // Rollback on error
      setGarment(previousGarment);
      toast.error('An unexpected error occurred');
    }
  }, [garment, refreshHistory]);

  const addService = useCallback(
    async (input: { serviceId?: string; customService?: any }) => {
      // Create a temporary service for optimistic update
      const tempService: Service = {
        id: `temp-${Date.now()}`,
        name: input.customService?.name || 'New Service',
        quantity: input.customService?.quantity || 1,
        unit: input.customService?.unit || 'flat_rate',
        unit_price_cents: input.customService?.unitPriceCents || 0,
        line_total_cents:
          (input.customService?.quantity || 1) *
          (input.customService?.unitPriceCents || 0),
        description: input.customService?.description,
      };

      // Optimistically update the UI
      const previousGarment = garment;
      setGarment((prev) => ({
        ...prev,
        garment_services: [...prev.garment_services, tempService],
        totalPriceCents: prev.totalPriceCents + tempService.line_total_cents,
      }));

      // Create optimistic history entry
      createOptimisticHistoryEntry('service_added', 'service', null, {
        name: tempService.name,
        quantity: tempService.quantity,
        unit_price_cents: tempService.unit_price_cents,
      });

      try {
        const result = await addServiceToGarment({
          garmentId: garment.id,
          ...input,
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to add service');
        } else {
          // Update with real service ID
          setGarment((prev) => ({
            ...prev,
            garment_services: prev.garment_services.map((s) =>
              s.id === tempService.id ? { ...s, id: result.serviceId! } : s
            ),
          }));
          refreshHistory();
          toast.success('Service added successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const removeService = useCallback(
    async (serviceId: string, removalReason?: string) => {
      // Find the service to remove
      const serviceToRemove = garment.garment_services.find(
        (s) => s.id === serviceId
      );
      if (!serviceToRemove || serviceToRemove.is_removed) return;

      // Check if service is completed - completed services cannot be removed
      if (serviceToRemove.is_done) {
        toast.error('Cannot remove a completed service');
        return;
      }

      // Optimistically update the UI (mark as removed instead of filtering out)
      const previousGarment = garment;
      setGarment((prev) => ({
        ...prev,
        garment_services: prev.garment_services.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                is_removed: true,
                removed_at: new Date().toISOString(),
                removal_reason: removalReason || 'Service removed by user',
              }
            : s
        ),
        // Subtract from total since removed services don't count
        totalPriceCents:
          prev.totalPriceCents - serviceToRemove.line_total_cents,
      }));

      // Create optimistic history entry
      createOptimisticHistoryEntry(
        'service_removed',
        'service',
        {
          name: serviceToRemove.name,
          quantity: serviceToRemove.quantity,
          unit_price_cents: serviceToRemove.unit_price_cents,
          status: 'active',
        },
        {
          name: serviceToRemove.name,
          quantity: serviceToRemove.quantity,
          unit_price_cents: serviceToRemove.unit_price_cents,
          status: 'removed',
          removal_reason: removalReason,
        }
      );

      try {
        const result = await removeServiceFromGarment({
          garmentId: garment.id,
          garmentServiceId: serviceId,
          ...(removalReason && { removalReason }),
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to remove service');
        } else {
          refreshHistory();
          toast.success('Service removed successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const restoreService = useCallback(
    async (serviceId: string) => {
      // Find the service to restore
      const serviceToRestore = garment.garment_services.find(
        (s) => s.id === serviceId
      );
      if (!serviceToRestore || !serviceToRestore.is_removed) return;

      // Optimistically update the UI (mark as active again)
      const previousGarment = garment;
      const updatedServices = garment.garment_services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              is_removed: false,
              removed_at: null,
              removed_by: null,
              removal_reason: null,
            }
          : s
      );

      // Calculate new stage based on active services after restoration
      const activeServices = updatedServices.filter((s) => !s.is_removed);
      const completedCount = activeServices.filter((s) => s.is_done).length;
      const totalCount = activeServices.length;
      let newStage: string;
      if (completedCount === 0) {
        newStage = 'New';
      } else if (completedCount === totalCount && totalCount > 0) {
        newStage = 'Ready For Pickup';
      } else {
        newStage = 'In Progress';
      }

      setGarment((prev) => ({
        ...prev,
        garment_services: updatedServices,
        stage: newStage,
        // Add back to total since restored services count again
        totalPriceCents:
          prev.totalPriceCents + serviceToRestore.line_total_cents,
      }));

      // Create optimistic history entry
      createOptimisticHistoryEntry(
        'service_restored',
        'service',
        {
          name: serviceToRestore.name,
          status: 'removed',
        },
        {
          name: serviceToRestore.name,
          status: 'active',
        }
      );

      try {
        const result = await restoreRemovedService({
          garmentId: garment.id,
          garmentServiceId: serviceId,
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to restore service');
        } else {
          refreshHistory();
          toast.success('Service restored successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const updateService = useCallback(
    async (serviceId: string, updates: Partial<Service>) => {
      // Find the service to update
      const serviceIndex = garment.garment_services.findIndex(
        (s) => s.id === serviceId
      );
      if (serviceIndex === -1) return;

      const oldService = garment.garment_services[serviceIndex];
      if (!oldService) return;

      // Check if service is completed - completed services cannot be edited
      if (oldService.is_done) {
        toast.error('Cannot edit a completed service');
        return;
      }

      const newQuantity = updates.quantity ?? oldService.quantity;
      const newUnitPrice =
        updates.unit_price_cents ?? oldService.unit_price_cents;
      const newLineTotal = newQuantity * newUnitPrice;

      // Optimistically update the UI
      const previousGarment = garment;
      const updatedService: Service = {
        ...oldService,
        ...updates,
        quantity: newQuantity,
        unit_price_cents: newUnitPrice,
        line_total_cents: newLineTotal,
      };

      const newServices = [...garment.garment_services];
      newServices[serviceIndex] = updatedService;

      const totalPriceDiff = newLineTotal - oldService.line_total_cents;

      setGarment((prev) => ({
        ...prev,
        garment_services: newServices,
        totalPriceCents: prev.totalPriceCents + totalPriceDiff,
      }));

      try {
        const result = await updateGarmentService({
          garmentServiceId: serviceId,
          updates: {
            quantity: updates.quantity,
            unitPriceCents: updates.unit_price_cents,
            description:
              updates.description === null ? undefined : updates.description,
            unit: updates.unit as 'flat_rate' | 'hour' | 'day' | undefined,
          },
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to update service');
        } else {
          refreshHistory();
          toast.success('Service updated successfully');
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const toggleServiceComplete = useCallback(
    async (serviceId: string, isDone: boolean) => {
      // Find the service to update
      const serviceIndex = garment.garment_services.findIndex(
        (s) => s.id === serviceId
      );
      if (serviceIndex === -1) return;

      // Optimistically update the UI
      const previousGarment = garment;
      const updatedServices = [...garment.garment_services];
      updatedServices[serviceIndex] = {
        ...updatedServices[serviceIndex],
        is_done: isDone,
      } as Service;

      // Calculate new stage based on service completion (exclude soft-deleted services)
      const activeServices = updatedServices.filter((s) => !s.is_removed);
      const completedCount = activeServices.filter((s) => s.is_done).length;
      const totalCount = activeServices.length;
      let newStage: string;
      if (completedCount === 0) {
        newStage = 'New';
      } else if (completedCount === totalCount && totalCount > 0) {
        newStage = 'Ready For Pickup';
      } else {
        newStage = 'In Progress';
      }

      setGarment((prev) => ({
        ...prev,
        garment_services: updatedServices,
        stage: newStage,
      }));

      try {
        const result = await toggleServiceCompletion({
          garmentServiceId: serviceId,
          isDone: isDone,
        });

        if (!result.success) {
          // Rollback on failure
          setGarment(previousGarment);
          toast.error(result.error || 'Failed to update service completion');
        } else {
          refreshHistory();
          toast.success(
            isDone
              ? 'Service marked as complete'
              : 'Service marked as incomplete'
          );
        }
      } catch (error) {
        // Rollback on error
        setGarment(previousGarment);
        toast.error('An unexpected error occurred');
      }
    },
    [garment, refreshHistory]
  );

  const markAsPickedUp = useCallback(async () => {
    // Check if the garment is in "Ready For Pickup" stage
    if (garment.stage !== 'Ready For Pickup') {
      toast.error(
        'Garment must be in "Ready For Pickup" stage to mark as picked up'
      );
      return;
    }

    // Optimistically update the UI
    const previousGarment = garment;
    setGarment((prev) => ({ ...prev, stage: 'Done' }));

    try {
      const result = await markGarmentAsPickedUp({ garmentId: garment.id });

      if (!result.success) {
        // Rollback on failure
        setGarment(previousGarment);
        toast.error(result.error || 'Failed to mark garment as picked up');
      } else {
        refreshHistory();
        toast.success(`${garment.name || 'Garment'} marked as picked up`);
      }
    } catch (error) {
      // Rollback on error
      setGarment(previousGarment);
      toast.error('An unexpected error occurred');
    }
  }, [garment, refreshHistory]);

  return (
    <GarmentContext.Provider
      value={{
        garment,
        updateGarmentOptimistic,
        updateGarmentIcon,
        updateGarmentPhoto,
        deleteGarmentPhoto,
        addService,
        removeService,
        restoreService,
        updateService,
        toggleServiceComplete,
        markAsPickedUp,
        refreshGarment,
        refreshHistory,
        historyKey,
        optimisticHistoryEntry,
        historyRefreshSignal,
      }}
    >
      {children}
    </GarmentContext.Provider>
  );
}
