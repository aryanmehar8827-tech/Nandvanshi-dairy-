export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone?: string;
  wallet: number;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  productId: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  image: string;
  stock: number;
  categoryId: string;
  category?: Category;
  variants?: Variant[];
}

export interface Category {
  id: string;
  name: string;
  products?: Product[];
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  totalAmount: number;
  status: 'Pending' | 'Preparing' | 'OutForDelivery' | 'Delivered' | 'Cancelled';
  deliveryType: 'Express' | 'Scheduled' | 'Bulk';
  scheduledDate?: string;
  instructions?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: Variant;
  quantity: number;
  price: number;
}
