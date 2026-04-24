import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay, isWithinInterval, parseISO, subDays } from 'date-fns';
import { NotificationService } from '../lib/notifications';

export interface Order {
  id: string;
  bill_number: number;
  items: any[];
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  last_order_date: string;
}

export function useAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (customersRes.error) throw customersRes.error;

      setOrders(ordersRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Request notification permissions
    NotificationService.requestPermissions();

    // Subscribe to changes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' }, 
        (payload) => {
          const newOrder = payload.new as Order;
          NotificationService.notifyNewOrder({
            total: newOrder.total,
            payment_method: newOrder.payment_method
          });
          fetchData(); // Refresh data
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        fetchData
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        fetchData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders, customers, loading, error, refresh: fetchData };
}
