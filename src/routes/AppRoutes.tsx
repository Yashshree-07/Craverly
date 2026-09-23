import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import Home from "../pages/Home";
import RestaurantListing from "../pages/RestaurantListing";
import RestaurantDetail from "../pages/RestaurantDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import OrderTracking from "../pages/OrderTracking";
import Profile from "../pages/Profile";
import Favorites from "../pages/Favorites";
import Analytics from "../pages/Analytics";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import AuthCallback from "../pages/AuthCallback";
import GroupOrderCreate from "../pages/GroupOrderCreate";
import GroupOrderRoom from "../pages/GroupOrderRoom";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<RestaurantListing />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Group ordering */}
        <Route path="/group-order" element={<GroupOrderCreate />} />
        <Route path="/group-order/:code" element={<GroupOrderRoom />} />

        {/* Tracking is accessible to guests too (data is in localStorage) */}
        <Route path="/orders/:orderId/track" element={<OrderTracking />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}