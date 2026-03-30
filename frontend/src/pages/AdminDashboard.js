import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, ShoppingCart, DollarSign, AlertTriangle, 
  Plus, Pencil, Trash2, LogOut, LayoutDashboard, 
  PackageSearch, ClipboardList, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Product form state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock: '',
    featured: false
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, productsRes, ordersRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { withCredentials: true }),
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`, { withCredentials: true }),
        axios.get(`${API}/categories`)
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        image_url: product.image_url,
        stock: product.stock.toString(),
        featured: product.featured
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: categories[0]?.id || '',
        image_url: '',
        stock: '',
        featured: false
      });
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      image_url: productForm.image_url,
      stock: parseInt(productForm.stock),
      featured: productForm.featured
    };

    try {
      if (editingProduct) {
        await axios.put(
          `${API}/admin/products/${editingProduct.id}`,
          productData,
          { withCredentials: true }
        );
        toast.success('Product updated successfully');
      } else {
        await axios.post(
          `${API}/admin/products`,
          productData,
          { withCredentials: true }
        );
        toast.success('Product created successfully');
      }
      setShowProductModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${API}/admin/products/${productId}`, { withCredentials: true });
      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(
        `${API}/admin/orders/${orderId}/status?status=${status}`,
        {},
        { withCredentials: true }
      );
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F2EFE9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4A5D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#57534E]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2EFE9]" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-[#1C1917] text-white py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img 
                src="https://static.prod-images.emergentagent.com/jobs/6c023cc2-2fc0-43fb-8359-ba7aa5d1b242/images/0daed73c7d3787c0323a12e73246227c1c8fc001f61e751969b9ca055bd6c5ae.png"
                alt="Launch Local"
                className="h-10 w-10"
              />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-lg">Admin Dashboard</h1>
              <p className="text-stone-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-stone-400 hover:text-white text-sm">
              View Store
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-stone-400 hover:text-white"
              data-testid="admin-logout"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-stone-200 rounded-xl p-1 mb-8">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-[#4A5D4E] data-[state=active]:text-white">
              <LayoutDashboard size={18} className="mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-[#4A5D4E] data-[state=active]:text-white">
              <PackageSearch size={18} className="mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-[#4A5D4E] data-[state=active]:text-white">
              <ClipboardList size={18} className="mr-2" />
              Orders
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat-card" data-testid="stat-products">
                <div className="flex items-center justify-between mb-4">
                  <Package className="text-[#4A5D4E]" size={24} />
                </div>
                <p className="text-3xl font-bold text-[#1C1917]">{stats?.total_products || 0}</p>
                <p className="text-[#57534E] text-sm">Total Products</p>
              </div>
              <div className="stat-card" data-testid="stat-orders">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingCart className="text-[#4A5D4E]" size={24} />
                </div>
                <p className="text-3xl font-bold text-[#1C1917]">{stats?.total_orders || 0}</p>
                <p className="text-[#57534E] text-sm">Total Orders</p>
              </div>
              <div className="stat-card" data-testid="stat-revenue">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="text-[#166534]" size={24} />
                </div>
                <p className="text-3xl font-bold text-[#166534]">${stats?.total_revenue?.toFixed(2) || '0.00'}</p>
                <p className="text-[#57534E] text-sm">Total Revenue</p>
              </div>
              <div className="stat-card" data-testid="stat-low-stock">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="text-amber-600" size={24} />
                </div>
                <p className="text-3xl font-bold text-amber-600">{stats?.low_stock_items || 0}</p>
                <p className="text-[#57534E] text-sm">Low Stock Items</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h3 className="font-heading font-bold text-lg mb-4">Recent Orders</h3>
              {orders.length === 0 ? (
                <p className="text-[#57534E] text-center py-8">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Order ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Items</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(order => (
                        <tr key={order.id} className="border-b border-stone-100">
                          <td className="py-3 px-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                          <td className="py-3 px-4">{order.items?.length || 0} items</td>
                          <td className="py-3 px-4 font-medium">${order.total?.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-stone-100 text-stone-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-[#57534E]">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg">All Products</h3>
                <Button onClick={() => openProductModal()} className="btn-primary" data-testid="add-product-btn">
                  <Plus size={18} className="mr-2" />
                  Add Product
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Stock</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#57534E]">Featured</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#57534E]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-stone-100" data-testid={`product-row-${product.id}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize">{product.category.replace('-', ' ')}</td>
                        <td className="py-3 px-4">${product.price.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={product.stock < 10 ? 'text-amber-600 font-medium' : ''}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {product.featured ? (
                            <span className="text-[#166534]">Yes</span>
                          ) : (
                            <span className="text-[#57534E]">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openProductModal(product)}
                              className="p-2 text-[#4A5D4E] hover:bg-[#4A5D4E]/10 rounded-lg transition-colors"
                              data-testid={`edit-product-${product.id}`}
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-[#991B1B] hover:bg-[#991B1B]/10 rounded-lg transition-colors"
                              data-testid={`delete-product-${product.id}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="bg-white border border-stone-200 rounded-2xl p-6">
              <h3 className="font-heading font-bold text-lg mb-6">All Orders</h3>
              
              {orders.length === 0 ? (
                <p className="text-[#57534E] text-center py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div 
                      key={order.id} 
                      className="border border-stone-200 rounded-xl p-4"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="font-mono text-sm text-[#57534E]">Order #{order.id.slice(0, 8)}</p>
                          <p className="font-medium text-lg">${order.total?.toFixed(2)}</p>
                          <p className="text-sm text-[#57534E]">{order.customer_email || 'Guest checkout'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Select 
                            value={order.status} 
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items?.map((item, idx) => (
                          <span key={idx} className="bg-[#F2EFE9] px-3 py-1 rounded-full text-sm">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-[#57534E] mt-3">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 mt-4" data-testid="product-form">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                required
                data-testid="product-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                required
                data-testid="product-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm(p => ({ ...p, price: e.target.value }))}
                  required
                  data-testid="product-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm(p => ({ ...p, stock: e.target.value }))}
                  required
                  data-testid="product-stock-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={productForm.category} 
                onValueChange={(value) => setProductForm(p => ({ ...p, category: value }))}
              >
                <SelectTrigger data-testid="product-category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={productForm.image_url}
                onChange={(e) => setProductForm(p => ({ ...p, image_url: e.target.value }))}
                required
                data-testid="product-image-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={productForm.featured}
                onCheckedChange={(checked) => setProductForm(p => ({ ...p, featured: checked }))}
                data-testid="product-featured-switch"
              />
              <Label>Featured Product</Label>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 btn-primary" data-testid="save-product-btn">
                {editingProduct ? 'Update' : 'Create'} Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
