"use client";

import { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Utility to get or generate clientId
const getClientId = () => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("clientId");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("clientId", id);
    document.cookie = `clientId=${id}; path=/; max-age=31536000; SameSite=Lax`;
    console.log("Generated new clientId for orders:", id);
  } else {
    document.cookie = `clientId=${id}; path=/; max-age=31536000; SameSite=Lax`;
    console.log("Retrieved existing clientId for orders:", id);
  }
  return id;
};

// Hook to fetch and sync all orders
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = getClientId();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders?clientId=${clientId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      const orderList = await response.json();
      if (!Array.isArray(orderList)) {
        console.warn("Received non-array orders response:", orderList);
        setOrders([]);
        return;
      }
      setOrders(orderList);
      console.log("Fetched orders:", orderList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchOrders();
    }
  }, [clientId, fetchOrders]);

  useEffect(() => {
    if (clientId) {
      const handleOrderUpdate = async () => {
        try {
          const response = await fetch(`/api/orders?clientId=${clientId}`, {
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) {
            throw new Error(`Failed to sync orders: ${response.statusText}`);
          }
          const orderList = await response.json();
          if (!Array.isArray(orderList)) {
            console.warn("Received non-array orders response:", orderList);
            setOrders([]);
            return;
          }
          setOrders(orderList);
          console.log("Synced orders from orderUpdated event:", orderList);
        } catch (error) {
          console.error("Error syncing orders:", error);
          setError(error instanceof Error ? error.message : 'Failed to sync orders');
          setOrders([]);
        }
      };
      window.addEventListener("orderUpdated", handleOrderUpdate);
      return () => window.removeEventListener("orderUpdated", handleOrderUpdate);
    }
  }, [clientId]);

  return { orders, loading, error, fetchOrders };
}

// Hook to fetch a single order
export function useOrder(orderId: number) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = getClientId();

  const fetchOrder = useCallback(async () => {
    if (!orderId || isNaN(orderId)) {
      setError("Invalid order ID");
      setOrder(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/order?orderId=${orderId}&clientId=${clientId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, clientId]);

  useEffect(() => {
    if (clientId && orderId) {
      fetchOrder();
    }
  }, [clientId, orderId, fetchOrder]);

  return { order, loading, error, fetchOrder };
}

// Hook to create an order
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (data: {
    clientId: string;
    email: string;
    shippingData: {
      fullname: string;
      phone: string;
      company: string;
      country: string;
      state: string;
      address: string;
      apartment: string;
      city: string;
      postalCode: string;
    };
    items: { productId: number; quantity: number; price: number }[];
    subtotal: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.statusText}`);
      }
      const { orderId } = await response.json();
      if (!orderId || isNaN(orderId)) {
        throw new Error('Invalid order ID received');
      }
      window.dispatchEvent(new CustomEvent("orderUpdated"));
      return orderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createOrder, loading, error };
}

// Hook to update order status
export function useUpdateOrderStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = getClientId();

  const updateOrderStatus = useCallback(async (orderId: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, orderId, status }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
      }
      const updatedOrder = await response.json();
      window.dispatchEvent(new CustomEvent("orderUpdated"));
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  return { updateOrderStatus, loading, error };
}

// Hook to delete an order
export function useDeleteOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = getClientId();

  const deleteOrder = useCallback(async (orderId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/order', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, orderId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.statusText}`);
      }
      window.dispatchEvent(new CustomEvent("orderUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  return { deleteOrder, loading, error };
}