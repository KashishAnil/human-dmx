import { useEffect } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Switch,
  message,
} from "antd";
import { useSettings } from "../../hooks/useCommerce";
import {
  apiError,
  isFormValidationError,
  useGetSettingsQuery,
  useResetSettingsMutation,
  useUpdateSettingsMutation,
} from "../../redux/services/api";
import LogoMotion from "../../components/brand/LogoMotion";
import type { SiteSettings } from "../../types";

const Section = ({
  title,
  copy,
  children,
}: {
  title: string;
  copy?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-xl border border-line bg-card p-6">
    <h2 className="text-sm font-bold text-head">{title}</h2>
    {copy && <p className="mt-1 text-[11px] text-soft">{copy}</p>}
    <div className="mt-6">{children}</div>
  </section>
);

const AdminContent = () => {
  const settings = useSettings();
  const { isError, error } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const [resetSettings] = useResetSettingsMutation();
  const [form] = Form.useForm<SiteSettings>();
  const [toast, toastHolder] = message.useMessage();

  useEffect(() => {
    document.title = "Content & Settings — Merchant Portal";
  }, []);

  useEffect(() => {
    form.setFieldsValue(settings);
  }, [form, settings]);

  const save = async () => {
    try {
      const values = await form.validateFields();
      await updateSettings(values).unwrap();
      toast.success("Storefront updated.");
    } catch (error) {
      if (isFormValidationError(error)) return;
      toast.error(apiError(error, "Couldn't save those settings."));
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {toastHolder}

      {isError && (
        <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
          {apiError(
            error,
            "Settings API isn't available — showing static defaults. Saves won't persist.",
          )}
        </p>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl text-head sm:text-4xl">
            Content &amp; Settings
          </h1>
          <p className="mt-2 text-sm text-body">
            Everything here writes straight to the live storefront.
          </p>
        </div>
        <Button type="primary" size="large" onClick={save} loading={saving}>
          Save changes
        </Button>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={settings}
        className="space-y-6"
      >
        <Section
          title="Announcement bar"
          copy="The scrolling strip above the header."
        >
          <Form.Item
            name="announcementActive"
            label="Show the bar"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item name="announcement" label="Message">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Section>

        <Section title="Homepage hero">
          <Form.Item name="heroEyebrow" label="Eyebrow">
            <Input />
          </Form.Item>
          <Form.Item
            name="heroTitle"
            label="Headline"
            tooltip="Line breaks split the headline — the second line renders in gold"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="heroSubtitle" label="Subheading">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="heroCta" label="Button label">
            <Input />
          </Form.Item>
        </Section>

        <Section
          title="Logo video"
          copy="Paste an MP4 or WebM URL to replace the animated brandmark on the homepage and DMX page. Leave it empty to keep the animation."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <div>
              <Form.Item name="logoVideoUrl" label="Video URL">
                <Input placeholder="https://…/human-dmx-logo.mp4" />
              </Form.Item>
              <p className="text-[11px] leading-relaxed text-soft">
                Best results at 1:1 or 4:5, under 10 MB, muted and
                loop-friendly. It autoplays silently — treat it as motion, not a
                film.
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-body">
                Current
              </p>
              <LogoMotion
                videoUrl={settings.logoVideoUrl || undefined}
                className="aspect-4/5 w-full"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Story pages"
          copy="The intro paragraphs on the HUMAN and DMX pages, and the split panels on the homepage."
        >
          <Form.Item name="storyHuman" label="HUMAN">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="storyDmx" label="DMX">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Section>

        <Section title="Policies">
          <Form.Item name="exchangePolicy" label="Exchange policy">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="shippingPolicy" label="Shipping policy">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Section>

        <Section
          title="Shipping & tax"
          copy="Used by the cart, checkout and every order total."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Form.Item name="freeShippingThreshold" label="Free shipping over">
              <InputNumber prefix="$" min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="flatShipping" label="Flat shipping rate">
              <InputNumber
                prefix="$"
                min={0}
                step={0.5}
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              name="taxRate"
              label="Tax rate"
              tooltip="Decimal — 0.08875 is 8.875%"
            >
              <InputNumber
                min={0}
                max={1}
                step={0.001}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </div>
        </Section>

        <Section title="Contact & social">
          <Form.Item name="supportEmail" label="Support email">
            <Input />
          </Form.Item>
          <div className="grid gap-4 sm:grid-cols-3">
            <Form.Item name="instagram" label="Instagram">
              <Input />
            </Form.Item>
            <Form.Item name="youtube" label="YouTube">
              <Input />
            </Form.Item>
            <Form.Item name="tiktok" label="TikTok">
              <Input />
            </Form.Item>
          </div>
        </Section>
      </Form>

      <section className="rounded-xl border border-coral/30 bg-coral/5 p-6">
        <h2 className="text-sm font-bold text-coral">Danger zone</h2>
        <p className="mt-1 text-[11px] text-soft">
          Resets are immediate and can't be undone.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Popconfirm
            title="Reset storefront copy?"
            description="Hero, story, policies and shipping rules return to their defaults. Products and orders are untouched."
            okText="Reset"
            okButtonProps={{ danger: true }}
            onConfirm={async () => {
              try {
                await resetSettings().unwrap();
                toast.success("Copy reset to defaults.");
              } catch (error) {
                toast.error(apiError(error, "Couldn't reset the copy."));
              }
            }}
          >
            <Button danger>Reset copy &amp; settings</Button>
          </Popconfirm>
        </div>
        {/*
          The old "reset catalog" and "reset orders" buttons rebuilt local
          demo state. Against a real database those would delete every product
          and every order — a destructive operation that shouldn't sit behind
          one click in a web UI. Reseeding is a deliberate server-side act.
        */}
        <p className="mt-5 border-t border-coral/20 pt-4 text-[11px] leading-relaxed text-soft">
          Restoring the demo catalog and order history is a server operation —
          run <code className="text-body">npm run seed</code> in the backend. It
          drops and rebuilds those collections, so never point it at production
          data.
        </p>
      </section>
    </div>
  );
};

export default AdminContent;
