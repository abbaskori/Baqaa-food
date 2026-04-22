import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

const DATA_VERSION = "1.0.0";
const KEYS = {
  VERSION: "baqaa_data_version",
  SHOP_INFO: "baqaa_shop_info",
  CATEGORIES: "baqaa_categories",
  MENU_ITEMS: "baqaa_menu_items",
  ORDERS: "baqaa_orders",
  CUSTOMERS: "baqaa_customers",
  BILL_COUNTER: "baqaa_bill_counter",
};

export interface ShopInfo {
  name: string;
  address: string;
  contact: string;
  gstin: string;
  logo: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image: string; // Emoji
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  amount: number;
}

export interface Order {
  id: string;
  billNumber: number;
  items: OrderItem[];
  subtotal: number;
  discountType: 'none' | 'percentage' | 'rupees';
  discountValue: number;
  discountAmount: number;
  total: number;
  paymentMethod: 'Cash' | 'Online';
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  lastOrderDate: string;
}

const DEFAULT_SHOP_INFO: ShopInfo = {
  name: "Baqaa Fast Food",
  address: "Shop no 15, Seventh Heaven Building, 100 feet Rd, Opp. Al Burooj, Makarba Rd, Juhapura, Ahmedabad, Gujarat-380055",
  contact: "9099881421",
  gstin: "",
  logo: "",
};

const SEED_DATA = [
  { cat: "Starters", emoji: "🍿", items: [ {n: "Popcorn", p: 90}, {n: "Peri Peri Popcorn", p: 110}, {n: "Chicken Kurkure", p: 260}, {n: "Chicken Wings", p: 250}, {n: "Chicken Cheese Popcorn", p: 240} ] },
  { cat: "Burger", emoji: "🍔", items: [ {n: "Chicken Burger", p: 120}, {n: "Safari Burger", p: 130}, {n: "Mexican Burger", p: 130}, {n: "Chili Cheese Burger", p: 150}, {n: "Baqaa Supreme Burger", p: 240}, {n: "Trinity Burger", p: 220} ] },
  { cat: "Fries", emoji: "🍟", items: [ {n: "Salted Fries", p: 80}, {n: "Peri Peri Fries", p: 100}, {n: "Cheese Fries", p: 130}, {n: "Peri Peri Cheese Fries", p: 160}, {n: "Chicken & Cheese Fries", p: 220} ] },
  { cat: "Wraps", emoji: "🌯", items: [ {n: "Crunchy Chicken Wrap", p: 180}, {n: "Mexican Chicken Wrap", p: 180}, {n: "Delight Chicken Wrap", p: 200}, {n: "Greek Chicken Wrap", p: 190}, {n: "Schezwan Wrap", p: 200} ] },
  { cat: "Sizzlers", emoji: "🥘", items: [ {n: "Chicken Hot Finger", p: 340}, {n: "Chicken Cheese Garlic", p: 400}, {n: "Korean Chicken", p: 360}, {n: "Dynamite Chicken", p: 420}, {n: "Hawaii Chicken", p: 400} ] },
  { cat: "Beverages", emoji: "🍹", items: [ {n: "Virgin Mojito", p: 100}, {n: "Blue Curacao", p: 120}, {n: "Green Apple", p: 120}, {n: "Strawberry Shake", p: 140}, {n: "Nutella Chocolate", p: 190}, {n: "Irish Cold Coffee", p: 150} ] },
  { cat: "Veg Pizza", emoji: "🍕", items: [ {n: "Mexican 8\"", p: 250}, {n: "Mexican 10\"", p: 320}, {n: "BBQ 8\"", p: 250}, {n: "Supreme 8\"", p: 280}, {n: "Just Cheese 8\"", p: 230}, {n: "Italian 8\"", p: 250} ] },
  { cat: "Non Veg Pizza", emoji: "🍕", items: [ {n: "Mexican 8\"", p: 290}, {n: "Mexican 10\"", p: 370}, {n: "BBQ 8\"", p: 290}, {n: "Supreme 8\"", p: 320}, {n: "Just Cheese 8\"", p: 270}, {n: "Italian 8\"", p: 290} ] },
  { cat: "Veg Sandwich", emoji: "🥪", items: [ {n: "Rock & Roll", p: 180}, {n: "Thalaiva", p: 160}, {n: "Firangi", p: 150}, {n: "Zingat", p: 180} ] },
  { cat: "Non Veg Sandwich", emoji: "🥪", items: [ {n: "Rock & Roll", p: 230}, {n: "Thalaiva", p: 210}, {n: "Firangi", p: 200}, {n: "Zingat", p: 230} ] },
  { cat: "Combos", emoji: "🍱", items: [ {n: "Kids Combo", p: 170}, {n: "Value Pack", p: 750}, {n: "Budget", p: 310}, {n: "Basic", p: 290}, {n: "Party Pack", p: 990}, {n: "5 in 1 Meal", p: 460}, {n: "Family Pack", p: 2100} ] },
  { cat: "Add Ons", emoji: "🧀", items: [ {n: "Cheese Dip", p: 30}, {n: "Mayo Dip", p: 15}, {n: "Jalapeno Dip", p: 30}, {n: "Cheese Burst 8\"", p: 100}, {n: "Cheese Burst 10\"", p: 130} ] },
];

export const emitChange = () => window.dispatchEvent(new Event('baqaa_storage_update'));

export function initializeStorage() {
  const version = localStorage.getItem(KEYS.VERSION);
  if (version !== DATA_VERSION) {
    localStorage.clear();
    
    localStorage.setItem(KEYS.VERSION, DATA_VERSION);
    localStorage.setItem(KEYS.SHOP_INFO, JSON.stringify(DEFAULT_SHOP_INFO));
    localStorage.setItem(KEYS.BILL_COUNTER, "1001");
    localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));

    const categories: Category[] = [];
    const menuItems: MenuItem[] = [];

    SEED_DATA.forEach(c => {
      const catId = uuidv4();
      categories.push({ id: catId, name: c.cat, createdAt: new Date().toISOString() });
      c.items.forEach(i => {
        menuItems.push({
          id: uuidv4(),
          name: i.n,
          price: i.p,
          categoryId: catId,
          image: c.emoji,
          createdAt: new Date().toISOString()
        });
      });
    });

    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(menuItems));
    emitChange();
  }
}

function get<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  emitChange();
}

export const StorageAPI = {
  getShopInfo: () => get<ShopInfo>(KEYS.SHOP_INFO, DEFAULT_SHOP_INFO),
  setShopInfo: (info: ShopInfo) => set(KEYS.SHOP_INFO, info),

  getCategories: () => get<Category[]>(KEYS.CATEGORIES, []),
  setCategories: (cats: Category[]) => {
    set(KEYS.CATEGORIES, cats);
    // Cloud Sync
    cats.forEach(c => {
      supabase.from('categories').upsert({
        id: c.id,
        name: c.name,
        created_at: c.createdAt
      }).then();
    });
  },
  
  getMenuItems: () => get<MenuItem[]>(KEYS.MENU_ITEMS, []),
  setMenuItems: (items: MenuItem[]) => {
    set(KEYS.MENU_ITEMS, items);
    // Cloud Sync
    items.forEach(i => {
      supabase.from('menu_items').upsert({
        id: i.id,
        name: i.name,
        price: i.price,
        category_id: i.categoryId,
        image: i.image,
        created_at: i.createdAt
      }).then();
    });
  },

  getOrders: () => get<Order[]>(KEYS.ORDERS, []),
  addOrder: (orderWithoutIdAndBill: Omit<Order, 'id' | 'billNumber'>) => {
    const orders = StorageAPI.getOrders();
    const currentBillStr = localStorage.getItem(KEYS.BILL_COUNTER) || "1001";
    const currentBill = parseInt(currentBillStr, 10);
    
    const newOrder: Order = {
      ...orderWithoutIdAndBill,
      id: uuidv4(),
      billNumber: currentBill
    };
    
    orders.unshift(newOrder); // Add to top
    set(KEYS.ORDERS, orders);
    localStorage.setItem(KEYS.BILL_COUNTER, (currentBill + 1).toString());

    // Cloud Sync
    supabase.from('orders').upsert({
      id: newOrder.id,
      bill_number: newOrder.billNumber,
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      discount_type: newOrder.discountType,
      discount_value: newOrder.discountValue,
      discount_amount: newOrder.discountAmount,
      total: newOrder.total,
      payment_method: newOrder.paymentMethod,
      customer_name: newOrder.customerName,
      customer_phone: newOrder.customerPhone,
      created_at: newOrder.createdAt
    }).then();

    // Update customer
    if (newOrder.customerName) {
      const customers = StorageAPI.getCustomers();
      const existing = customers.find(c => c.phone === newOrder.customerPhone && newOrder.customerPhone !== "") || 
                       customers.find(c => c.name.toLowerCase() === newOrder.customerName.toLowerCase());
      
      let customer;
      if (existing) {
        existing.lastOrderDate = newOrder.createdAt;
        if (newOrder.customerPhone) existing.phone = newOrder.customerPhone;
        customer = existing;
        set(KEYS.CUSTOMERS, customers);
      } else {
        customer = {
          id: uuidv4(),
          name: newOrder.customerName,
          phone: newOrder.customerPhone,
          createdAt: newOrder.createdAt,
          lastOrderDate: newOrder.createdAt
        };
        customers.push(customer);
        set(KEYS.CUSTOMERS, customers);
      }
      
      // Cloud Sync Customer
      supabase.from('customers').upsert({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        created_at: customer.createdAt,
        last_order_date: customer.lastOrderDate
      }).then();
    }

    return newOrder;
  },

  updateOrder: (id: string, updates: Omit<Order, 'id' | 'billNumber'>) => {
    const orders = StorageAPI.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    const updatedOrder: Order = {
      ...orders[index],
      ...updates,
      id,
    };

    orders[index] = updatedOrder;
    set(KEYS.ORDERS, orders);

    // Cloud Sync
    supabase.from('orders').upsert({
      id: updatedOrder.id,
      bill_number: updatedOrder.billNumber,
      items: updatedOrder.items,
      subtotal: updatedOrder.subtotal,
      discount_type: updatedOrder.discountType,
      discount_value: updatedOrder.discountValue,
      discount_amount: updatedOrder.discountAmount,
      total: updatedOrder.total,
      payment_method: updatedOrder.paymentMethod,
      customer_name: updatedOrder.customerName,
      customer_phone: updatedOrder.customerPhone,
      created_at: updatedOrder.createdAt
    }).then();

    return updatedOrder;
  },

  getCustomers: () => get<Customer[]>(KEYS.CUSTOMERS, []),

  // Fetch all data from cloud (for new devices)
  fetchCloudData: async () => {
    const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: cats } = await supabase.from('categories').select('*');
    const { data: items } = await supabase.from('menu_items').select('*');
    const { data: customers } = await supabase.from('customers').select('*');

    if (orders) localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders.map(o => ({
      ...o,
      billNumber: o.bill_number,
      discountType: o.discount_type,
      discountValue: o.discount_value,
      discountAmount: o.discount_amount,
      paymentMethod: o.payment_method,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      createdAt: o.created_at
    }))));

    if (cats) localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(cats.map(c => ({
      id: c.id,
      name: c.name,
      createdAt: c.created_at
    }))));

    if (items) localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(items.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      categoryId: i.category_id,
      image: i.image,
      createdAt: i.created_at
    }))));

    if (customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      createdAt: c.created_at,
      lastOrderDate: c.last_order_date
    }))));

    emitChange();
  },
  
  resetData: () => {
    localStorage.setItem(KEYS.ORDERS, "[]");
    localStorage.setItem(KEYS.CUSTOMERS, "[]");
    localStorage.setItem(KEYS.BILL_COUNTER, "1001");
    emitChange();
  }
};

