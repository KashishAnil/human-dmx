import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiError, useLazyTrackOrderQuery } from "../../redux/services/api";
import { recentOrders, rememberOrder } from "../../utils/recentOrders";
import { Button } from "../../components/ui/Button";
import { Eyebrow } from "../../components/ui/Bits";

const TrackOrder = () => {
  const navigate = useNavigate();
  const [lookup, { isFetching }] = useLazyTrackOrderQuery();
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Orders placed from this browser, offered as one-tap shortcuts.
  const [mine] = useState(recentOrders);

  useEffect(() => {
    document.title = "Track Order — HUMAN DMX APPAREL";
  }, []);

  /**
   * The API matches on number + email, so a wrong pairing simply 404s — we
   * never learn whether the number exists, which is the point.
   */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const order = await lookup({
        number: number.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      }).unwrap();

      // Remember the pairing so the order page can reopen it later.
      rememberOrder(order.number, order.customer.email);
      navigate(`/order/${order.number}`);
    } catch (err) {
      setError(
        apiError(
          err,
          "No match. Check the order number and the email you used at checkout.",
        ),
      );
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center py-20">
      <div className="mx-auto w-full max-w-lg">
        <Eyebrow>Order Lookup</Eyebrow>
        <h1 className="display mt-4 text-5xl text-head">Track your order</h1>
        <p className="mt-4 text-sm text-body">
          Enter the order number from your confirmation email along with the
          email you checked out with.
        </p>

        <form onSubmit={submit} className="mt-9 space-y-5">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
              Order number
            </span>
            <input
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
                setError(null);
              }}
              placeholder="DMX-400100"
              className="mt-2 h-12 w-full rounded-lg border border-line bg-paper px-4 text-sm uppercase text-head placeholder:text-soft focus:border-royal focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-body">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="you@email.com"
              className="mt-2 h-12 w-full rounded-lg border border-line bg-paper px-4 text-sm text-head placeholder:text-soft focus:border-royal focus:outline-none"
            />
          </label>

          {error && <p className="text-xs text-coral">{error}</p>}

          <Button type="submit" size="lg" block disabled={isFetching}>
            {isFetching ? "Looking…" : "Find My Order"}
          </Button>
        </form>

        {mine.length > 0 && (
          <div className="mt-8 rounded-lg border border-line bg-card px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft">
              Ordered from this device
            </p>
            <ul className="mt-3 space-y-2">
              {mine.map((order) => (
                <li key={order.number}>
                  <button
                    type="button"
                    onClick={() => navigate(`/order/${order.number}`)}
                    className="text-sm font-semibold text-royal transition hover:text-head"
                  >
                    {order.number}
                  </button>
                  <span className="ml-2 text-xs text-soft">{order.email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
