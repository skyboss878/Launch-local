import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Toaster } from "./components/ui/sonner";

// Pages
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CategoriesPage from "./pages/CategoriesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import AdminDashboard from "./pages/AdminDashboard";

// Layout wrapper for pages with navbar/footer
function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Main store routes */}
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/shop" element={<MainLayout><ShopPage /></MainLayout>} />
            <Route path="/product/:productId" element={<MainLayout><ProductPage /></MainLayout>} />
            <Route path="/categories" element={<MainLayout><CategoriesPage /></MainLayout>} />
            <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
            <Route path="/checkout/success" element={<MainLayout><CheckoutSuccessPage /></MainLayout>} />
            <Route path="/checkout/cancel" element={<MainLayout><CheckoutCancelPage /></MainLayout>} />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Admin routes (no navbar/footer) */}
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
