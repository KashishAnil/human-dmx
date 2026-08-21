import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Switch,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  useCategories,
  useCategoryLabel,
  useCategorySizes,
  useProducts,
} from "../../hooks/useCommerce";
import {
  apiError,
  isFormValidationError,
  useCreateProductMutation,
  useDeleteProductMutation,
  useToggleProductActiveMutation,
  useToggleProductFeaturedMutation,
  useUpdateProductMutation,
  useUploadImagesMutation,
} from "../../redux/services/api";
import { IMG } from "../../data/catalog";
import type { CategorySlug, Collection, Product } from "../../types";
import { money, resolveImage, totalStock } from "../../utils/Functions";

const IMAGE_LIBRARY = Object.values(IMG);

interface FormShape {
  name: string;
  category: CategorySlug;
  collection: Collection;
  price: number;
  compareAt: number | null;
  blurb: string;
  description: string;
  detailsText: string;
  badge: string | null;
  featured: boolean;
  active: boolean;
  images: string[];
  stock: Record<string, number>;
}

const blankProduct = (): Product => ({
  id: "",
  slug: "",
  name: "",
  category: "t-shirts",
  collection: "HUMAN",
  price: 20,
  compareAt: null,
  images: [IMG.teeBack],
  blurb: "",
  description: "",
  details: [],
  badge: null,
  featured: false,
  active: true,
  variants: [],
  rating: 5,
  reviewCount: 0,
  createdAt: new Date().toISOString(),
});

const AdminProducts = () => {
  const products = useProducts();
  const categories = useCategories();
  const categoryLabel = useCategoryLabel();
  const categorySizes = useCategorySizes();

  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [removeProduct] = useDeleteProductMutation();
  const [toggleActive] = useToggleProductActiveMutation();
  const [toggleFeatured] = useToggleProductFeaturedMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadImagesMutation();

  const [form] = Form.useForm<FormShape>();
  const [toast, toastHolder] = message.useMessage();

  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<CategorySlug>("t-shirts");

  useEffect(() => {
    document.title = "Products — Merchant Portal";
  }, []);

  const rows = useMemo(() => {
    let list = products;
    if (categoryFilter !== "all")
      list = list.filter((p) => p.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, categoryFilter, search]);

  const openEditor = (product: Product | null) => {
    const target = product ?? blankProduct();
    setEditing(target);
    setImages(target.images);
    setCategory(target.category);
    form.setFieldsValue({
      name: target.name,
      category: target.category,
      collection: target.collection,
      price: target.price,
      compareAt: target.compareAt,
      blurb: target.blurb,
      description: target.description,
      detailsText: target.details.join("\n"),
      badge: target.badge,
      featured: target.featured,
      active: target.active,
      stock: Object.fromEntries(target.variants.map((v) => [v.size, v.stock])),
    });
  };

  const closeEditor = () => {
    setEditing(null);
    form.resetFields();
    setImages([]);
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      if (images.length === 0) {
        toast.error("Add at least one image.");
        return;
      }

      const sizes = categorySizes(values.category);
      const payload = {
        name: values.name.trim(),
        category: values.category,
        collection: values.collection,
        price: values.price,
        compareAt: values.compareAt ?? null,
        blurb: values.blurb?.trim() ?? "",
        description: values.description?.trim() ?? "",
        details: (values.detailsText ?? "")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        badge: values.badge?.trim() || null,
        featured: values.featured,
        active: values.active,
        images,
        variants: sizes.map((size) => ({
          size,
          stock: Number(values.stock?.[size] ?? 0),
        })),
      };

      // An existing product has a server id; a new one doesn't.
      const saved = editing?.id
        ? await updateProduct({ id: editing.id, ...payload }).unwrap()
        : await createProduct(payload).unwrap();

      toast.success(`${saved.name} saved.`);
      closeEditor();
    } catch (error) {
      // A missing field is handled by antd; anything else came from the API.
      if (isFormValidationError(error)) return;
      toast.error(apiError(error, "Couldn't save that product."));
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img
            src={resolveImage(record.images[0])}
            alt=""
            className="h-14 w-11 shrink-0 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-head">{record.name}</p>
            <p className="text-[11px] text-soft">/{record.slug}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 140,
      render: (value: CategorySlug) => (
        <span className="text-xs text-body">{categoryLabel(value)}</span>
      ),
      sorter: (a, b) => a.category.localeCompare(b.category),
    },
    {
      title: "Collection",
      dataIndex: "collection",
      width: 120,
      render: (value: Collection) => (
        <Tag color={value === "DMX" ? "gold" : "blue"}>{value}</Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      width: 110,
      sorter: (a, b) => a.price - b.price,
      render: (value: number, record) => (
        <div>
          <span className="font-semibold text-head">{money(value)}</span>
          {record.compareAt && (
            <span className="ml-2 text-[11px] text-soft line-through">
              {money(record.compareAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      width: 110,
      sorter: (a, b) => totalStock(a) - totalStock(b),
      render: (_, record) => {
        const stock = totalStock(record);
        return (
          <span
            className={
              stock === 0
                ? "text-coral"
                : stock <= 10
                  ? "text-[#8a6508]"
                  : "text-body"
            }
          >
            {stock} units
          </span>
        );
      },
    },
    {
      title: "Featured",
      key: "featured",
      width: 100,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.featured}
          onChange={() => toggleFeatured(record.id)}
        />
      ),
    },
    {
      title: "Live",
      key: "active",
      width: 90,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.active}
          onChange={() => toggleActive(record.id)}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEditor(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this product?"
            description="It will be removed from the storefront immediately."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await removeProduct(record.id).unwrap();
                toast.success(`${record.name} deleted.`);
              } catch (error) {
                toast.error(apiError(error, "Couldn't delete that product."));
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

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-head sm:text-4xl">Products</h1>
          <p className="mt-2 text-sm text-body">
            {products.length} styles · {products.filter((p) => p.active).length}{" "}
            live on the storefront
          </p>
        </div>
        <Button type="primary" size="large" onClick={() => openEditor(null)}>
          + New product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input.Search
          allowClear
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <Segmented
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(String(v))}
          options={[
            { label: "All", value: "all" },
            ...categories.map((c) => ({ label: c.name, value: c.slug })),
          ]}
        />
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ x: 980 }}
      />

      <Drawer
        open={!!editing}
        onClose={closeEditor}
        width="min(620px, 100vw)"
        title={editing?.id ? `Edit — ${editing.name}` : "New product"}
        extra={
          <div className="flex gap-2">
            <Button onClick={closeEditor}>Cancel</Button>
            <Button type="primary" onClick={save}>
              Save product
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="name"
            label="Product name"
            rules={[{ required: true, message: "Give the product a name." }]}
          >
            <Input placeholder="Human DMX Signature Hoodie" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="category" label="Category">
              <Select
                onChange={(value: CategorySlug) => {
                  setCategory(value);
                  const sizes = categorySizes(value);
                  const existing = form.getFieldValue("stock") ?? {};
                  form.setFieldValue(
                    "stock",
                    Object.fromEntries(sizes.map((s) => [s, existing[s] ?? 0])),
                  );
                  form.setFieldValue("price", value === "hoodies" ? 40 : 20);
                }}
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.slug,
                }))}
              />
            </Form.Item>
            <Form.Item name="collection" label="Collection">
              <Select
                options={[
                  { label: "HUMAN", value: "HUMAN" },
                  { label: "DMX", value: "DMX" },
                ]}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: "Set a price." }]}
            >
              <InputNumber
                prefix="$"
                min={0}
                step={1}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              name="compareAt"
              label="Compare-at price"
              tooltip="Shown struck through next to the price"
            >
              <InputNumber
                prefix="$"
                min={0}
                step={1}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>

          <Form.Item name="blurb" label="Short blurb">
            <Input placeholder="The b-boy patch on heavyweight black fleece." />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="detailsText"
            label="Details & fit"
            tooltip="One bullet per line"
          >
            <Input.TextArea
              rows={5}
              placeholder={"380 gsm fleece\nTrue to size"}
            />
          </Form.Item>

          {/* stock per size */}
          <div className="mb-6 rounded-lg border border-line bg-paper p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
              Stock by size
            </p>
            <div className="grid grid-cols-3 gap-3">
              {categorySizes(category).map((size) => (
                <Form.Item
                  key={size}
                  name={["stock", size]}
                  label={size}
                  className="!mb-0"
                >
                  <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
              ))}
            </div>
          </div>

          {/* images */}
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-body">
              Images ({images.length})
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((image, i) => (
                <div
                  key={image + i}
                  className="group relative h-20 w-16 overflow-hidden rounded border border-line"
                >
                  <img
                    src={resolveImage(image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className="absolute inset-0 flex items-center justify-center bg-ink/75 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-gold/90 py-0.5 text-center text-[9px] font-bold text-ink">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Upload
              multiple
              accept="image/*"
              showUploadList={false}
              /**
               * Uploaded straight away rather than deferred to save, so the
               * thumbnail appears immediately and the merchant can reorder or
               * remove it before committing the product.
               */
              beforeUpload={async (file, fileList) => {
                // antd calls this once per file; send the batch on the first
                // and let the rest fall through, or a 3-file drop would
                // upload all three files three times over.
                if (file !== fileList[0]) return Upload.LIST_IGNORE;

                try {
                  const { paths } = await uploadImages(fileList).unwrap();
                  setImages((current) => [...current, ...paths]);
                } catch (error) {
                  toast.error(apiError(error, "Couldn't upload that image."));
                }
                return Upload.LIST_IGNORE;
              }}
            >
              <Button loading={uploading} className="mb-3">
                {uploading ? "Uploading…" : "⬆ Upload images"}
              </Button>
            </Upload>

            <p className="mb-2 text-[11px] text-soft">
              …or click one of the shipped shots
            </p>
            <div className="flex flex-wrap gap-2">
              {IMAGE_LIBRARY.filter((image) => !images.includes(image)).map(
                (image) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setImages([...images, image])}
                    className="h-14 w-11 overflow-hidden rounded border border-line opacity-60 transition hover:border-royal hover:opacity-100"
                  >
                    <img
                      src={resolveImage(image)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ),
              )}
            </div>

            <Input.Search
              className="mt-3"
              placeholder="…or paste an image URL"
              enterButton="Add"
              onSearch={(value) => {
                if (value.trim()) setImages([...images, value.trim()]);
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="badge" label="Badge">
              <Input placeholder="Best Seller" />
            </Form.Item>
            <Form.Item name="featured" label="Featured" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="active" label="Live" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default AdminProducts;
