import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  apiError,
  isFormValidationError,
  useCreatePromoMutation,
  useDeletePromoMutation,
  useGetPromosQuery,
  useTogglePromoActiveMutation,
  useUpdatePromoMutation,
} from "../../redux/services/api";
import { money } from "../../utils/Functions";
import type { Promo, PromoType } from "../../types";

const TYPE_LABEL: Record<PromoType, string> = {
  percent: "Percent off",
  fixed: "Amount off",
  shipping: "Free shipping",
};

const blank = (): Promo => ({
  id: "",
  code: "",
  type: "percent",
  value: 10,
  minSubtotal: 0,
  active: true,
  uses: 0,
  maxUses: null,
  expiresAt: null,
  description: "",
});

const AdminDiscounts = () => {
  const { data: promos = [], isError, error } = useGetPromosQuery();
  const [createPromo] = useCreatePromoMutation();
  const [updatePromo] = useUpdatePromoMutation();
  const [removePromo] = useDeletePromoMutation();
  const [toggleActive] = useTogglePromoActiveMutation();

  const [form] = Form.useForm<Promo>();
  const [toast, toastHolder] = message.useMessage();
  const [editing, setEditing] = useState<Promo | null>(null);

  useEffect(() => {
    document.title = "Discounts — Merchant Portal";
  }, []);

  const open = (promo: Promo | null) => {
    const target = promo ?? blank();
    setEditing(target);
    form.setFieldsValue(target);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      // `uses` is a redemption counter owned by the server, never sent up.
      const payload = {
        code: values.code.toUpperCase().trim(),
        type: values.type,
        value: values.value,
        minSubtotal: values.minSubtotal,
        maxUses: values.maxUses ?? null,
        expiresAt: values.expiresAt ?? null,
        description: values.description ?? "",
        active: values.active,
      };

      if (editing?.id)
        await updatePromo({ id: editing.id, ...payload }).unwrap();
      else await createPromo(payload).unwrap();

      toast.success(`${payload.code} saved.`);
      setEditing(null);
      form.resetFields();
    } catch (error) {
      if (isFormValidationError(error)) return;
      toast.error(apiError(error, "Couldn't save that code."));
    }
  };

  const columns: ColumnsType<Promo> = [
    {
      title: "Code",
      dataIndex: "code",
      render: (value: string, record) => (
        <div>
          <p className="font-mono font-bold text-gold">{value}</p>
          <p className="text-[11px] text-soft">{record.description}</p>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      width: 150,
      render: (value: PromoType) => (
        <span className="text-xs text-body">{TYPE_LABEL[value]}</span>
      ),
    },
    {
      title: "Value",
      key: "value",
      width: 110,
      render: (_, record) => (
        <span className="font-semibold text-head">
          {record.type === "percent"
            ? `${record.value}%`
            : record.type === "fixed"
              ? money(record.value)
              : "Free ship"}
        </span>
      ),
    },
    {
      title: "Minimum",
      dataIndex: "minSubtotal",
      width: 110,
      render: (value: number) => (
        <span className="text-body">{value ? money(value) : "—"}</span>
      ),
    },
    {
      title: "Redemptions",
      key: "uses",
      width: 130,
      sorter: (a, b) => a.uses - b.uses,
      render: (_, record) => (
        <span className="text-body">
          {record.uses}
          {record.maxUses !== null && ` / ${record.maxUses}`}
        </span>
      ),
    },
    {
      title: "Status",
      key: "active",
      width: 130,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={record.active}
            onChange={() => toggleActive(record.id)}
          />
          <Tag color={record.active ? "green" : "default"}>
            {record.active ? "Live" : "Off"}
          </Tag>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => open(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this code?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await removePromo(record.id).unwrap();
                toast.success("Code deleted.");
              } catch (error) {
                toast.error(apiError(error, "Couldn't delete that code."));
              }
            }}
          >
            <Button size="small" danger type="text">
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toastHolder}

      {isError && (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
          {apiError(error, "Discount codes aren't available yet.")}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-head sm:text-4xl">Discounts</h1>
          <p className="mt-2 text-sm text-body">
            {promos.filter((p) => p.active).length} of {promos.length} codes
            live · {promos.reduce((s, p) => s + p.uses, 0)} total redemptions
          </p>
        </div>
        <Button type="primary" size="large" onClick={() => open(null)}>
          + New code
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={promos}
        pagination={false}
        scroll={{ x: 900 }}
      />

      <Modal
        open={!!editing}
        onCancel={() => setEditing(null)}
        onOk={save}
        okText="Save code"
        title={editing?.id ? `Edit ${editing.code}` : "New discount code"}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="pt-4"
        >
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: "Enter a code." }]}
          >
            <Input
              placeholder="OLDSCHOOL86"
              style={{ textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input placeholder="15% off orders over $40" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="type" label="Type">
              <Select
                options={(Object.keys(TYPE_LABEL) as PromoType[]).map((t) => ({
                  value: t,
                  label: TYPE_LABEL[t],
                }))}
              />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(prev, next) => prev.type !== next.type}
            >
              {({ getFieldValue }) =>
                getFieldValue("type") === "shipping" ? null : (
                  <Form.Item name="value" label="Value">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      prefix={
                        getFieldValue("type") === "fixed" ? "$" : undefined
                      }
                      suffix={
                        getFieldValue("type") === "percent" ? "%" : undefined
                      }
                    />
                  </Form.Item>
                )
              }
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="minSubtotal" label="Minimum subtotal">
              <InputNumber prefix="$" min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="maxUses"
              label="Usage limit"
              tooltip="Leave empty for unlimited"
            >
              <InputNumber min={1} style={{ width: "100%" }} placeholder="∞" />
            </Form.Item>
          </div>

          <Form.Item name="active" label="Live" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDiscounts;
