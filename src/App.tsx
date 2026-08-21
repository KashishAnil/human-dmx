/**
 * Ant Design's `reset.css` is deliberately NOT imported.
 *
 * It ships unlayered, and unlayered rules beat anything inside a cascade
 * layer — so its `button/a { color: inherit }` silently won over every
 * Tailwind text-colour utility. antd v5 styles its own components through
 * CSS-in-JS, and Tailwind's preflight already covers the normalisation the
 * reset was there for.
 */
import "./App.css";
import AppRoutes from "./Routes.tsx";

function App() {
  return <AppRoutes />;
}

export default App;
