import { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import { Link } from "react-router";
import { useAppDispatch } from "../../redux/hooks";
import { setSession } from "../../redux/slices/authSlice";
import { apiError, useLoginMutation } from "../../redux/services/api";
import Crest from "../../components/brand/Crest";
import LogoMotion from "../../components/brand/LogoMotion";
import { Button } from "../../components/ui/Button";
import { adminTheme } from "./theme";

/**
 * What `npm run seed` creates in the backend. Shown as a convenience for
 * local and demo installs — change SEED_ADMIN_* in the API's .env (and remove
 * this panel) before putting the portal in front of anyone.
 */
const SEED_ADMIN = {
  email: "admin@humandmxapparel.com",
  password: "dmx19861986",
};

const AdminLogin = () => {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Merchant Portal — HUMAN DMX APPAREL";
  }, []);

  /**
   * Authenticates against the API. A shopper account can sign in here and
   * still be refused — the portal is gated on `role === "admin"`, and every
   * admin endpoint re-checks that server-side.
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const session = await login({ email, password }).unwrap();

      if (session.user.role !== "admin") {
        setError("That account doesn't have merchant access.");
        return;
      }

      dispatch(setSession(session));
    } catch (err) {
      setError(
        apiError(err, "That email and password don't match our records."),
      );
    }
  };

  return (
    <ConfigProvider theme={adminTheme}>
      <div className="grid min-h-screen bg-paper lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">
            <Link to="/">
              <Crest size={78} />
            </Link>

            <h1 className="display mt-10 text-4xl text-head">
              Merchant Portal
            </h1>
            <p className="mt-3 text-sm text-body">
              Sign in to manage products, orders and the storefront copy.
            </p>

            <form className="mt-9 space-y-5" onSubmit={submit}>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                  Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  autoComplete="username"
                  className="mt-2 h-12 w-full rounded-lg border border-line bg-card px-4 text-sm text-head placeholder:text-soft focus:border-gold focus:outline-none"
                  placeholder="admin@humandmxapparel.com"
                />
              </label>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  className="mt-2 h-12 w-full rounded-lg border border-line bg-card px-4 text-sm text-head focus:border-gold focus:outline-none"
                  placeholder="••••••••"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" block disabled={isLoading}>
                {isLoading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-7 rounded-lg border border-line bg-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                Seeded account
              </p>
              <p className="mt-2 font-mono text-xs text-body">
                {SEED_ADMIN.email}
                <br />
                {SEED_ADMIN.password}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmail(SEED_ADMIN.email);
                  setPassword(SEED_ADMIN.password);
                  setError(null);
                }}
                className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-body transition hover:text-royal"
              >
                Fill them in →
              </button>
            </div>

            <Link
              to="/"
              className="mt-8 block text-center text-[11px] uppercase tracking-[0.16em] text-soft transition hover:text-royal"
            >
              ← Back to the store
            </Link>
          </div>
        </div>

        <div className="relative hidden items-center justify-center border-l border-line bg-navy p-12 lg:flex">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 60% at 50% 20%, rgba(47,111,224,0.22) 0%, transparent 65%)",
            }}
          />
          <div className="relative w-full max-w-md">
            <LogoMotion className="aspect-4/5 w-full" />
            <p className="mt-8 text-center text-sm leading-relaxed text-white/70">
              Everything on the storefront — products, prices, stock, copy,
              discounts and orders — is managed from in here.
            </p>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AdminLogin;
