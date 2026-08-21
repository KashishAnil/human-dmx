import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";
import Preloader from "../brand/Preloader";
import { ScrollTrigger } from "../../lib/gsap";

const StoreLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    // Layout shifts on route change, so re-measure every scroll-driven tween.
    ScrollTrigger.refresh();
  }, [pathname]);

  return (
    <div className="storefront flex min-h-screen flex-col bg-paper">
      <Preloader onDone={() => ScrollTrigger.refresh()} />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default StoreLayout;
