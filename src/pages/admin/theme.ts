import { theme } from "antd";

/**
 * Ant Design theme for the merchant portal.
 *
 * Light, to match the storefront — values mirror the tokens in `index.css`
 * so the two surfaces stay in step.
 */
export const adminTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: "#1f5fd0",
    colorInfo: "#1f5fd0",
    colorBgBase: "#ffffff",
    colorBgLayout: "#f7f5ef",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorBorder: "#e3ded1",
    colorBorderSecondary: "#eceadf",
    colorText: "#0b1120",
    colorTextSecondary: "#4d5769",
    colorTextTertiary: "#868ea0",
    colorError: "#d13c34",
    colorSuccess: "#2f8f5f",
    colorWarning: "#b8890f",
    borderRadius: 8,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  components: {
    Table: {
      headerBg: "#f7f5ef",
      headerColor: "#4d5769",
      rowHoverBg: "#f7f5ef",
      borderColor: "#eceadf",
    },
    Segmented: { itemSelectedBg: "#1f5fd0", itemSelectedColor: "#ffffff" },
  },
};
