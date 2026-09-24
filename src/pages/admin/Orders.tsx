import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import {
  Button,
  Drawer,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useOrdersQueryState } from "../../hooks/useCommerce";
import {
  apiError,
  useAddOrderNoteMutation,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../redux/services/api";
import { STATUS_LABEL, STATUS_TONE_DARK } from "../../utils/orderStatus";
import {
  cn,
  formatDate,
  formatDateTime,
  money,
  orderUnits,
  resolveImage,
} from "../../utils/Functions";
import type { Order, OrderStatus } from "../../types";

const STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "exchange",
  "cancelled",
];

const AdminOrders = () => {
  const {
    orders,
    isError: ordersError,
    error: ordersErr,
  } = useOrdersQueryState();
  const [updateStatus] = useUpdateOrderStatusMutation();
  const [addNote] = useAddOrderNoteMutation();
  const [removeOrder] = useDeleteOrderMutation();
  const [params, setParams] = useSearchParams();
  const [toast, toastHolder] = message.useMessage();

  const [focusId, setFocusId] = useState<string | null>(params.get("focus"));
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const statusFilter = params.get("status") ?? "all";

  useEffect(() => {
    document.title = "Orders — Merchant Portal";
  }, []);

  const focused = useMemo(
    () => orders.find((o) => o.id === focusId) ?? null,
    [orders, focusId],
  );

  const rows = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all")
      list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          `${o.customer.firstName} ${o.customer.lastName}`
            .toLowerCase()
            .includes(q) ||
          o.customer.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => {
      map[s] = orders.filter((o) => o.status === s).length;
    });
    return map;
  }, [orders]);

  const columns: ColumnsType<Order> = [
    {
      title: "Order",
      dataIndex: "number",
      width: 130,
      render: (value: string) => (
        <span className="font-semibold text-head">{value}</span>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <p className="text-head">
            {record.customer.firstName} {record.customer.lastName}
          </p>
          <p className="text-[11px] text-soft">{record.customer.email}</p>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      width: 130,
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
      defaultSortOrder: "descend",
      render: (value: string) => (
        <span className="text-xs text-body">{formatDate(value)}</span>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 80,
      render: (_, record) => (
        <span className="text-body">{orderUnits(record)}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      width: 110,
      sorter: (a, b) => a.total - b.total,
      render: (value: number) => (
        <span className="font-semibold tabular-nums text-head">
          {money(value)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 190,
      render: (value: OrderStatus, record) => (
        <Select
          size="small"
          value={value}
          style={{ width: 150 }}
          onChange={async (next) => {
            try {
              await updateStatus({ id: record.id, status: next }).unwrap();
              toast.success(`${record.number} → ${STATUS_LABEL[next]}`);
            } catch (error) {
              toast.error(apiError(error, "Couldn't update that order."));
            }
          }}
          options={STATUSES.map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
          }))}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Button size="small" onClick={() => setFocusId(record.id)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toastHolder}

      <div>
        <h1 className="display text-3xl text-head sm:text-4xl">Orders</h1>
        <p className="mt-2 text-sm text-body">
          {counts.all} orders ·{" "}
          {counts.pending + counts.paid + counts.processing} need fulfilling ·{" "}
          {counts.exchange} exchange
          {counts.exchange === 1 ? "" : "s"} open
        </p>
      </div>

      {ordersError && (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
          {apiError(ordersErr, "Orders aren't available yet.")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input.Search
          allowClear
          placeholder="Order number, name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <Segmented
          value={statusFilter}
          onChange={(value) => {
            const next = new URLSearchParams(params);
            if (value === "all") next.delete("status");
            else next.set("status", String(value));
            setParams(next, { replace: true });
          }}
          options={[
            { label: `All (${counts.all})`, value: "all" },
            ...STATUSES.map((s) => ({
              label: `${STATUS_LABEL[s]} (${counts[s]})`,
              value: s,
            })),
          ]}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1000 }}
      />

      <Drawer
        open={!!focused}
        onClose={() => setFocusId(null)}
        width="min(560px, 100vw)"
        title={focused ? `Order ${focused.number}` : ""}
      >
        {focused && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]",
                  STATUS_TONE_DARK[focused.status],
                )}
              >
                {STATUS_LABEL[focused.status]}
              </span>
              <span className="text-xs text-soft">
                Placed {formatDateTime(focused.createdAt)}
              </span>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
                Advance status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s !== focused.status).map((status) => (
                  <Button
                    key={status}
                    size="small"
                    danger={status === "cancelled"}
                    onClick={async () => {
                      try {
                        await updateStatus({ id: focused.id, status }).unwrap();
                        // Cancelling here also returns the stock to the shelf.
                        toast.success(`Marked ${STATUS_LABEL[status]}`);
                      } catch (error) {
                        toast.error(
                          apiError(error, "Couldn't update that order."),
                        );
                      }
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </Button>
                ))}
              </div>
            </div>

            {focused.exchangeNote && (
              <div className="rounded-lg border border-coral/40 bg-coral/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-coral">
                  Exchange request
                </p>
                <p className="mt-2 text-sm text-body">{focused.exchangeNote}</p>
              </div>
            )}

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
                Items
              </p>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {focused.lines.map((line, i) => (
                  <li
                    key={`${line.productId}-${line.size}-${i}`}
                    className="flex items-center gap-3 p-3"
                  >
                    <img
                      src={resolveImage(line.image)}
                      alt=""
                      className="h-14 w-11 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-head">{line.name}</p>
                      <p className="text-[11px] text-soft">
                        Size {line.size} · Qty {line.qty}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-head">
                      {money(line.price * line.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-line p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-body">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{money(focused.subtotal)}</dd>
                </div>
                {focused.discount > 0 && (
                  <div className="flex justify-between text-gold">
                    <dt>{focused.promoCode}</dt>
                    <dd className="tabular-nums">−{money(focused.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-body">
                  <dt>Shipping</dt>
                  <dd className="tabular-nums">
                    {focused.shippingCost === 0
                      ? "Free"
                      : money(focused.shippingCost)}
                  </dd>
                </div>
                <div className="flex justify-between text-body">
                  <dt>Tax</dt>
                  <dd className="tabular-nums">{money(focused.tax)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 font-bold text-head">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(focused.total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[11px] text-soft">
                Card ending {focused.paymentLast4}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
                Ship to
              </p>
              <address className="text-sm not-italic leading-relaxed text-body">
                {focused.customer.firstName} {focused.customer.lastName}
                <br />
                {focused.shipping.address1}
                {focused.shipping.address2 && (
                  <>
                    <br />
                    {focused.shipping.address2}
                  </>
                )}
                <br />
                {focused.shipping.city}, {focused.shipping.state}{" "}
                {focused.shipping.zip}
                <br />
                {focused.customer.email} · {focused.customer.phone}
              </address>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
                Timeline
              </p>
              <ol className="space-y-3">
                {[...focused.timeline].reverse().map((event, i) => (
                  <li key={`${event.at}-${i}`} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="text-sm text-head">{event.note}</p>
                      <p className="text-[11px] text-soft">
                        {formatDateTime(event.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-4 flex gap-2">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note"
                  onPressEnter={() => {
                    if (!note.trim()) return;
                    addNote({ id: focused.id, note: note.trim() });
                    setNote("");
                  }}
                />
                <Button
                  onClick={() => {
                    if (!note.trim()) return;
                    addNote({ id: focused.id, note: note.trim() });
                    setNote("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <Popconfirm
              title="Delete this order?"
              description="This removes it from reporting entirely."
              okText="Delete"
              okButtonProps={{ danger: true }}
              onConfirm={async () => {
                try {
                  await removeOrder(focused.id).unwrap();
                  setFocusId(null);
                  toast.success("Order deleted.");
                } catch (error) {
                  toast.error(apiError(error, "Couldn't delete that order."));
                }
              }}
            >
              <Button danger type="text" block>
                Delete order
              </Button>
            </Popconfirm>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminOrders;
