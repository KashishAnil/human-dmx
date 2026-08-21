import { Suspense, lazy } from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { BASE_NAME } from "./constants/api";
import { store } from "./redux/store";
import { useAdminSession } from "./hooks/useCommerce";

import StoreLayout from "./components/layout/StoreLayout";
import MusicPlayer from "./components/brand/MusicPlayer";
import Home from "./pages/home";
import Shop from "./pages/shop";
import ProductDetail from "./pages/product";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import OrderDetail from "./pages/order";
import TrackOrder from "./pages/track";
import StoryPage from "./pages/story";
import About from "./pages/about";
import Exchanges from "./pages/exchanges";
import NotFound from "./pages/notFound";

/**
 * The merchant portal pulls in Ant Design, which is most of the bundle.
 * Lazy-loading it keeps the storefront — the part customers actually hit —
 * light on first paint.
 */
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminInventory = lazy(() => import("./pages/admin/Inventory"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminDiscounts = lazy(() => import("./pages/admin/Discounts"));
const AdminContent = lazy(() => import("./pages/admin/Content"));

const PortalFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink">
    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-2">
      Loading portal…
    </p>
  </div>
);

/**
 * Gate for the merchant portal — falls through to the login screen. Only an
 * authenticated user whose role is `admin` gets in; the API enforces the same
 * rule on every request, so this is convenience, not the security boundary.
 */
const AdminRoute = () => {
  const session = useAdminSession();
  return session ? <Outlet /> : <AdminLogin />;
};

function AppRoutes() {
  return (
    <Provider store={store}>
      <BrowserRouter basename={BASE_NAME}>
        {/* Outside <Routes> so navigating doesn't unmount the audio element
            and restart the track from the top. */}
        <MusicPlayer />
        <Routes>
          {/* storefront */}
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order/:number" element={<OrderDetail />} />
            <Route path="/track" element={<TrackOrder />} />
            <Route path="/human" element={<StoryPage collection="HUMAN" />} />
            <Route path="/dmx" element={<StoryPage collection="DMX" />} />
            <Route path="/about" element={<About />} />
            <Route path="/exchanges" element={<Exchanges />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* checkout runs outside the store chrome to keep the flow clean */}
          <Route path="/checkout" element={<Checkout />} />

          {/* merchant portal */}
          <Route
            path="/admin"
            element={
              <Suspense fallback={<PortalFallback />}>
                <AdminRoute />
              </Suspense>
            }
          >
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="discounts" element={<AdminDiscounts />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default AppRoutes;
