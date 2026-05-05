import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  Calendar, 
  Package, 
  Truck,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from './lib/api';
import { User, Product, Category, Order } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: 'bg-dairy-accent text-white hover:bg-dairy-accent/90',
    secondary: 'bg-dairy-blue text-dairy-accent hover:bg-dairy-blue/80',
    outline: 'border-2 border-dairy-blue text-dairy-dark hover:bg-dairy-blue/20',
    ghost: 'hover:bg-gray-100 text-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  } as any;
  
  return (
    <button 
      className={cn('px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50', variants[variant], className)} 
      {...props} 
    />
  );
};

const Input = ({ className, ...props }: any) => (
  <input 
    className={cn('w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dairy-accent/20 focus:border-dairy-accent transition-all', className)} 
    {...props} 
  />
);

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('home'); // home, products, orders, cart, auth, admin-dashboard, admin-orders, admin-products
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{product: Product, variant?: any, quantity: number}[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Auth state init
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, prods] = await Promise.all([
        api.get('/categories'),
        api.get('/products')
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('home');
  };

  const addToCart = (product: Product, quantity: number = 1, variant?: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variant?.id === variant?.id);
      if (existing) {
        return prev.map(item => (item.product.id === product.id && item.variant?.id === variant?.id) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, variant, quantity }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number, variantId?: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.variant?.id === variantId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.variant ? item.variant.price : item.product.price) * item.quantity, 0);

  // --- Views ---

  const HomeView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero */}
      <section className="relative h-64 rounded-3xl overflow-hidden bg-dairy-accent flex items-center px-8 text-white">
        <div className="z-10 max-w-md">
          <h1 className="text-4xl font-serif mb-2">Purely Fresh, Daily Delivered.</h1>
          <p className="opacity-90 mb-4">Northern India's favorite dairy products at your doorstep.</p>
          <Button variant="secondary" onClick={() => setView('products')}>Shop Now</Button>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1550583724-1255818c0533?q=80&w=600&auto=format&fit=crop" 
          alt="Milk" 
          className="absolute right-0 bottom-0 h-full w-1/2 object-cover opacity-30 mix-blend-overlay"
        />
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Button variant="ghost" className="text-sm">View All</Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <motion.div 
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedCategory(cat.id);
                setView('products');
              }}
              className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dairy-blue flex items-center justify-center p-4 transition-colors group-hover:border-dairy-accent">
                <Package className="text-dairy-accent w-8 h-8" />
              </div>
              <span className="text-sm font-medium">{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Bestsellers</h2>
          <Button variant="ghost" className="text-sm" onClick={() => setView('products')}>See More</Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} onAdd={(qty, variant) => addToCart(product, qty, variant)} />
          ))}
        </div>
      </section>

      {/* Delivery Banner */}
      <section className="bg-dairy-blue rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="bg-white p-4 rounded-full">
          <Truck className="text-dairy-accent w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-dairy-accent">Bulk Orders for Events?</h3>
          <p className="text-sm text-gray-600">Planning a wedding or party? Get doorstep delivery for large quantities with special rates.</p>
        </div>
        <Button variant="primary" className="md:ml-auto" onClick={() => setView('products')}>Plan Event Order</Button>
      </section>
    </div>
  );

  const ProductCard = ({ product, onAdd }: { product: Product, onAdd: (qty: number, variant?: any) => void, key?: any }) => {
    const [localQty, setLocalQty] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || null);
    
    return (
      <div className="dairy-card p-3 flex flex-col group">
        <div className="aspect-square rounded-xl overflow-hidden bg-dairy-blue mb-3 relative">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79?q=80&w=200&auto=format&fit=crop'} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
          {(product.stock < 10 && product.stock > 0) && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
              Low Stock
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-dairy-accent transition-colors">{product.name}</h4>
          <p className="text-xs text-gray-500 mb-2">
            ₹{selectedVariant ? selectedVariant.price : product.price} / {product.unit}
          </p>
          
          {product.variants && product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.variants.map(v => (
                <button 
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium border transition-all",
                    selectedVariant?.id === v.id ? "bg-dairy-accent text-white border-dairy-accent" : "bg-gray-50 text-gray-600 border-gray-100 hover:border-dairy-accent/50"
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border">
            <button 
              onClick={() => setLocalQty(q => Math.max(1, q - 1))}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-dairy-accent transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs font-bold w-6 text-center">{localQty}</span>
            <button 
              onClick={() => setLocalQty(q => q + 1)}
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-dairy-accent transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          <Button 
            variant="secondary" 
            className="w-full text-xs py-2 rounded-lg flex items-center justify-center gap-2" 
            onClick={() => onAdd(localQty, selectedVariant)}
          >
            <Plus size={14} /> Add {localQty > 1 ? `(${localQty})` : ''}
          </Button>
        </div>
      </div>
    );
  };

  const ProductsView = () => {
    const filtered = products.filter(p => 
      (selectedCategory ? p.categoryId === selectedCategory : true) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        <div className="flex gap-2 mb-4">
          <Button 
            className={cn("text-xs px-3", !selectedCategory ? "bg-dairy-accent text-white" : "bg-white border")} 
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button 
              key={cat.id}
              className={cn("text-xs px-3", selectedCategory === cat.id ? "bg-dairy-accent text-white" : "bg-white border")}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={(qty, variant) => addToCart(p, qty, variant)} />)}
        </div>
      </div>
    );
  };

  const CartView = () => {
    const [deliveryType, setDeliveryType] = useState('Express');
    const [scheduledDate, setScheduledDate] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isPlacing, setIsPlacing] = useState(false);
    const [thankYou, setThankYou] = useState(false);

    const handleCheckout = async () => {
      if (!user) return setView('auth');
      setIsPlacing(true);
      try {
        await api.post('/orders', {
          items: cart.map(i => ({ 
            productId: i.product.id, 
            variantId: i.variant?.id,
            quantity: i.quantity, 
            price: i.variant ? i.variant.price : i.product.price 
          })),
          totalAmount: cartTotal,
          deliveryType,
          scheduledDate: scheduledDate || undefined,
          instructions
        });
        setCart([]);
        setThankYou(true);
      } catch (e) {
        alert("Failed to place order. Try again.");
      } finally {
        setIsPlacing(false);
      }
    };

    if (thankYou) return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-serif mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Your farm-fresh products will reach you shortly. Pure quality, delivered with love.</p>
        <Button variant="primary" onClick={() => setView('orders')}>Track Order</Button>
      </div>
    );

    if (cart.length === 0) return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60">
        <ShoppingBag size={64} className="mb-4 text-dairy-blue" />
        <p className="text-lg">Your basket is empty</p>
        <Button variant="ghost" className="mt-4" onClick={() => setView('products')}>Go Shopping</Button>
      </div>
    );

    return (
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-serif">Your Basket</h2>
          {cart.map(item => (
            <div key={`${item.product.id}-${item.variant?.id || 'base'}`} className="flex items-center gap-4 bg-white p-4 rounded-2xl border">
              <img src={item.product.image} className="w-16 h-16 rounded-xl object-cover" alt="" />
              <div className="flex-1">
                <h4 className="font-medium">{item.product.name}</h4>
                {item.variant && <span className="text-[10px] bg-dairy-blue text-dairy-accent px-1.5 py-0.5 rounded font-bold uppercase">{item.variant.name}</span>}
                <p className="text-xs text-gray-500">₹{item.variant ? item.variant.price : item.product.price} / {item.product.unit}</p>
              </div>
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <button onClick={() => updateCartQuantity(item.product.id, -1, item.variant?.id)} className="p-1 hover:bg-gray-100 rounded text-dairy-accent">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateCartQuantity(item.product.id, 1, item.variant?.id)} className="p-1 hover:bg-gray-100 rounded text-dairy-accent">
                  <Plus size={14} />
                </button>
              </div>
              <p className="font-semibold text-sm w-16 text-right">₹{(item.variant ? item.variant.price : item.product.price) * item.quantity}</p>
            </div>
          ))}
        </div>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Truck size={20} className="text-dairy-accent" />
              Delivery Options
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Express', 'Scheduled', 'Bulk'].map(type => (
                <button 
                  key={type}
                  onClick={() => setDeliveryType(type)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    deliveryType === type ? "bg-dairy-accent text-white border-dairy-accent shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-dairy-accent/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            {deliveryType !== 'Express' && (
              <Input 
                type="datetime-local" 
                value={scheduledDate}
                onChange={(e: any) => setScheduledDate(e.target.value)}
                className="text-sm"
              />
            )}
            <Input 
              placeholder="Special instructions (e.g. Leave at gate)" 
              value={instructions}
              onChange={(e: any) => setInstructions(e.target.value)}
              className="text-sm"
            />
            
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t text-dairy-dark">
                <span>Total</span>
                <span>₹{cartTotal}</span>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              className="w-full py-4 text-base rounded-2xl shadow-lg shadow-dairy-accent/20"
              onClick={handleCheckout}
              disabled={isPlacing}
            >
              {isPlacing ? 'Placing Order...' : `Confirm Order (COD)`}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const OrdersView = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      api.get('/orders/my').then(setOrders).finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading orders...</div>;

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-serif">My Orders</h2>
        {orders.map(order => (
          <div key={order.id} className="dairy-card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Order #{order.id.slice(-8).toUpperCase()}</p>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  order.status === 'Delivered' ? "bg-green-100 text-green-600" :
                  order.status === 'OutForDelivery' ? "bg-blue-100 text-blue-600" :
                  order.status === 'Cancelled' ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                )}>
                  {order.status}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">₹{order.totalAmount}</p>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    {item.variant && (
                      <span className="text-[10px] text-dairy-accent font-bold uppercase">
                        {item.variant.name}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Truck size={14} /> {order.deliveryType} Delivery</span>
              {order.scheduledDate && <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(order.scheduledDate).toLocaleString()}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const AuthView = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        const endpoint = isLogin ? '/auth/login' : '/auth/register';
        const payload = isLogin ? { email, password } : { email, password, name };
        const data = await api.post(endpoint, payload);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setView('home');
      } catch (e: any) {
        setError(JSON.parse(e.message).error || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto pt-10">
        <div className="dairy-card p-8 text-center">
          <h2 className="text-3xl font-serif mb-2">{isLogin ? 'Welcome Back' : 'Join Nandvanshi'}</h2>
          <p className="text-gray-500 mb-8">{isLogin ? 'Login to continue your dairy journey' : 'Experience the purest dairy at your doorstep'}</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium px-1">Full Name</label>
                <Input placeholder="Enter your name" value={name} onChange={(e: any) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium px-1">Email Address</label>
              <Input type="email" placeholder="example@mail.com" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium px-1">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
            </div>
            
            {error && <div className="p-3 bg-red-50 text-red-500 text-xs rounded-xl flex gap-2 items-center"><AlertCircle size={14} /> {error}</div>}
            
            <Button type="submit" variant="primary" className="w-full py-4 mt-4" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </Button>
          </form>
          
          <button className="mt-6 text-sm text-dairy-accent font-medium hover:underline" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      api.get('/admin/orders').then(setOrders).finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id: string, status: string) => {
      try {
        await api.patch(`/admin/orders/${id}/status`, { status });
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
      } catch (e) { alert("Failed to update"); }
    };

    if (loading) return <div>Loading...</div>;

    const stats = {
      totalRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
      pendingOrders: orders.filter(o => o.status === 'Pending').length,
      bulkOrders: orders.filter(o => o.deliveryType === 'Bulk').length,
      customers: new Set(orders.map(o => o.userId)).size
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dairy-card p-6 bg-dairy-accent text-white">
            <p className="text-xs opacity-80 uppercase tracking-widest font-bold mb-1">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹{stats.totalRevenue}</h3>
          </div>
          <div className="dairy-card p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Pending</p>
            <h3 className="text-2xl font-bold">{stats.pendingOrders}</h3>
          </div>
          <div className="dairy-card p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Bulk Requests</p>
            <h3 className="text-2xl font-bold">{stats.bulkOrders}</h3>
          </div>
          <div className="dairy-card p-6">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Unique Users</p>
            <h3 className="text-2xl font-bold">{stats.customers}</h3>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Orders</h3>
          <div className="bg-white rounded-2xl border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-600">Order ID</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Customer</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Type</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Amount</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-xs">#{order.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{order.user?.name}</span>
                        <span className="text-xs text-gray-500">{order.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", order.deliveryType === 'Bulk' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600')}>
                        {order.deliveryType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">₹{order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                        order.status === 'Delivered' ? "bg-green-100 text-green-600" :
                        order.status === 'OutForDelivery' ? "bg-blue-100 text-blue-600" : "bg-yellow-100 text-yellow-600"
                      )}>
                        {order.status}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        className="text-xs bg-dairy-blue border-none rounded p-1"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="OutForDelivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const AdminProductsView = () => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState('litre');
    const [stock, setStock] = useState('100');
    const [categoryId, setCategoryId] = useState('');
    const [image, setImage] = useState('');
    const [desc, setDesc] = useState('');
    const [variants, setVariants] = useState<{name: string, price: string, stock: string}[]>([]);

    const handleAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await api.post('/admin/products', { name, price, unit, stock, categoryId, image, description: desc, variants });
        alert("Product added!");
        setName(''); setPrice(''); setVariants([]);
        fetchData();
      } catch (e) { alert("Failed to add product"); }
    };

    const addVariantField = () => {
      setVariants([...variants, { name: '', price: '', stock: '' }]);
    };

    const updateVariant = (index: number, field: string, value: string) => {
      const newVariants = [...variants];
      (newVariants[index] as any)[field] = value;
      setVariants(newVariants);
    };

    const removeVariant = (index: number) => {
      setVariants(variants.filter((_, i) => i !== index));
    };

    return (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="dairy-card p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-6">Add New Product</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input placeholder="Product Name" value={name} onChange={(e: any) => setName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Price (₹)" type="number" value={price} onChange={(e: any) => setPrice(e.target.value)} required />
              <select className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dairy-accent/20" value={unit} onChange={(e: any) => setUnit(e.target.value)}>
                <option value="litre">Litre</option>
                <option value="kg">kg</option>
                <option value="packet">Packet</option>
                <option value="gram">gram</option>
              </select>
            </div>
            <Input placeholder="Stock Quantity" type="number" value={stock} onChange={(e: any) => setStock(e.target.value)} required />
            <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dairy-accent/20" value={categoryId} onChange={(e: any) => setCategoryId(e.target.value)} required>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-sm font-bold text-gray-700">Variants (Optional)</h4>
                <button type="button" onClick={addVariantField} className="text-dairy-accent flex items-center gap-1 text-xs font-bold">
                  <Plus size={14} /> Add Variant
                </button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-3 gap-2 items-center">
                  <Input placeholder="Name (500ml)" value={v.name} onChange={(e: any) => updateVariant(i, 'name', e.target.value)} className="text-xs p-2" />
                  <Input placeholder="Price" type="number" value={v.price} onChange={(e: any) => updateVariant(i, 'price', e.target.value)} className="text-xs p-2" />
                  <div className="flex gap-1">
                    <Input placeholder="Stock" type="number" value={v.stock} onChange={(e: any) => updateVariant(i, 'stock', e.target.value)} className="text-xs p-2 flex-1" />
                    <button type="button" onClick={() => removeVariant(i)} className="text-red-400 p-1 hover:bg-red-50 rounded">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Input placeholder="Image URL (Unsplash/Imgur)" value={image} onChange={(e: any) => setImage(e.target.value)} required />
            <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-dairy-accent/20 h-24" placeholder="Description" value={desc} onChange={(e: any) => setDesc(e.target.value)} />
            <Button type="submit" variant="primary" className="w-full py-4 text-base">Add Product</Button>
          </form>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Active Inventory</h3>
          <div className="grid gap-2">
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-dairy-blue flex items-center justify-center font-bold text-dairy-accent overflow-hidden shadow-inner">
                      <img src={p.image} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-sm">{p.name}</h5>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{p.stock} units remaining</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm">₹{p.price}</span>
                    <p className="text-[10px] text-gray-400">per {p.unit}</p>
                  </div>
                </div>
                
                {p.variants && p.variants.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-1">
                    {p.variants.map(v => (
                      <div key={v.id} className="bg-dairy-blue/20 p-2 rounded-lg flex justify-between items-center text-[10px]">
                        <span className="font-bold text-dairy-accent">{v.name}</span>
                        <span className="text-gray-600 font-medium">₹{v.price} / {v.stock} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans selection:bg-dairy-blue selection:text-dairy-accent">
      {/* Navigation */}
      <nav className="glass-morphism sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border overflow-hidden">
               <span className="text-2xl">🥛</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-serif font-bold text-dairy-accent leading-tight">Nandvanshi</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Premium Dairy</p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-dairy-accent transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search for milk, paneer, ghee..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (view !== 'products') setView('products');
              }}
              className="w-full bg-white border border-gray-100 py-2.5 pl-10 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-dairy-accent/20 focus:border-dairy-accent focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl hover:bg-gray-100 relative group" onClick={() => setView('cart')}>
              <ShoppingBag size={22} className="text-gray-600 group-hover:text-dairy-accent transition-colors" />
              {cart.length > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-dairy-accent text-white text-[10px] flex items-center justify-center rounded-full font-bold">{cart.length}</span>}
            </button>
            {user ? (
              <div className="relative">
                <button className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-dairy-blue/50 border border-dairy-blue group hover:bg-dairy-blue transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                  <span className="text-xs font-bold text-dairy-accent hidden sm:inline">{user.name.split(' ')[0]}</span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-dairy-accent font-bold">
                    {user.name[0]}
                  </div>
                </button>
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border p-2 z-50"
                    >
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-sm" onClick={() => { setView(user.role === 'admin' ? 'admin-dashboard' : 'orders'); setIsMenuOpen(false); }}>
                        <UserIcon size={16} /> Dashboard
                      </button>
                      {user.role === 'admin' && (
                        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-sm" onClick={() => { setView('admin-products'); setIsMenuOpen(false); }}>
                          <LayoutDashboard size={16} /> Inventory
                        </button>
                      )}
                      <div className="h-px bg-gray-100 my-1 mx-2" />
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-500 text-sm" onClick={logout}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button variant="primary" className="text-sm px-6" onClick={() => setView('auth')}>Login</Button>
            )}
            <button className="md:hidden p-2.5 rounded-xl hover:bg-gray-100">
              <Menu size={22} className="text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {view === 'home' && <HomeView />}
            {view === 'products' && <ProductsView />}
            {view === 'cart' && <CartView />}
            {view === 'orders' && <OrdersView />}
            {view === 'auth' && <AuthView />}
            {view === 'admin-dashboard' && <AdminDashboard />}
            {view === 'admin-products' && <AdminProductsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-dairy-dark text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-dairy-blue">Nandvanshi Dairy</h2>
            <p className="text-gray-400 text-sm">Purity delivered from the heart of Northern India. Farm fresh milk and organic dairy products at your doorstep.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-dairy-blue uppercase tracking-widest text-xs">Categories</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {categories.slice(0, 4).map(c => <li key={c.id} className="hover:text-white transition-colors cursor-pointer">{c.name}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-dairy-blue uppercase tracking-widest text-xs">Quick Links</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setView('orders')}>My Orders</li>
              <li className="hover:text-white transition-colors cursor-pointer" onClick={() => setView('products')}>Bulk Orders</li>
              <li className="hover:text-white transition-colors cursor-pointer">Terms of Service</li>
              <li className="hover:text-white transition-colors cursor-pointer">Privacy Policy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-dairy-blue uppercase tracking-widest text-xs">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-center gap-2"><MapPin size={16} /> Mathura, Uttar Pradesh, India</li>
              <li className="flex items-center gap-2 underline">support@nandvanshi.com</li>
              <li className="flex items-center gap-2 font-bold text-white">+91 98765 43210</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          © 2026 Nandvanshi Dairy Services. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
