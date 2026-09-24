import { useEffect, useMemo, useState } from "react";
import { Input, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { CustomerRow } from "../../redux/services/api";
import { apiError, useGetCustomersQuery } from "../../redux/services/api";
import { formatDate, money, round2 } from "../../utils/Functions";

const AdminCustomers = () => {
  /**
   * Aggregated by the API across every order, guests included — most shoppers
   * never register, so grouping by the email on the order is the only view
   * that shows everyone who has actually bought something.
   */
  const {
    data: customers = [],
    isLoading,
    isError,
    error,
  } = useGetCustomersQuery();
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Customers — Merchant Portal";
  }, []);

  const rows = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [customers, search]);

  const totals = useMemo(
    () => ({
      count: customers.length,
      repeat: customers.filter((c) => c.orders > 1).length,
      lifetime: round2(customers.reduce((sum, c) => sum + c.spend, 0)),
    }),
    [customers],
  );

  const columns: ColumnsType<CustomerRow> = [
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-head">{record.name}</p>
          <p className="text-[11px] text-soft">{record.email}</p>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      width: 170,
      render: (value: string) => (
        <span className="text-xs text-body">{value}</span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      width: 110,
      sorter: (a, b) => a.orders - b.orders,
      render: (value: number) => (
        <span className="text-body">
          {value}
          {value > 1 && (
            <Tag color="gold" className="ml-2">
              Repeat
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "Units",
      dataIndex: "units",
      width: 90,
      sorter: (a, b) => a.units - b.units,
      render: (value: number) => <span className="text-body">{value}</span>,
    },
    {
      title: "Lifetime spend",
      dataIndex: "spend",
      width: 150,
      defaultSortOrder: "descend",
      sorter: (a, b) => a.spend - b.spend,
      render: (value: number) => (
        <span className="font-semibold tabular-nums text-gold">
          {money(value)}
        </span>
      ),
    },
    {
      title: "Last order",
      dataIndex: "lastOrder",
      width: 140,
      sorter: (a, b) => a.lastOrder.localeCompare(b.lastOrder),
      render: (value: string) => (
        <span className="text-xs text-body">{formatDate(value)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-3xl text-head sm:text-4xl">Customers</h1>
        <p className="mt-2 text-sm text-body">
          Built from order history — no separate accounts to manage.
        </p>
      </div>

      {isError && (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
          {apiError(error, "Customer list isn't available yet.")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Customers", value: String(totals.count) },
          {
            label: "Repeat buyers",
            value: `${totals.repeat} (${totals.count ? Math.round((totals.repeat / totals.count) * 100) : 0}%)`,
          },
          { label: "Lifetime revenue", value: money(totals.lifetime) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-line bg-card p-6"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft">
              {stat.label}
            </p>
            <p className="display mt-3 text-3xl tabular-nums text-head">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Input.Search
        allowClear
        placeholder="Search name, email or city"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320 }}
      />

      <Table
        rowKey="key"
        loading={isLoading}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 900 }}
      />
    </div>
  );
};

export default AdminCustomers;
