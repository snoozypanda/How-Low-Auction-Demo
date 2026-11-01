import { useEffect, useState, type ComponentType } from "react";

import { modules as discoveredModules } from "./.generated/mockup-components";
import HowLowAuction from "./components/mockups/HowLowAuction";
import AdminPanel from "./components/mockups/AdminPanel";

type ModuleMap = Record<string, () => Promise<Record<string, unknown>>>;

function _resolveComponent(
  mod: Record<string, unknown>,
  name: string,
): ComponentType | undefined {
  const fns = Object.values(mod).filter(
    (v) => typeof v === "function",
  ) as ComponentType[];
  return (
    (mod.default as ComponentType) ||
    (mod.Preview as ComponentType) ||
    (mod[name] as ComponentType) ||
    fns[fns.length - 1]
  );
}

function PreviewRenderer({
  componentPath,
  modules,
}: {
  componentPath: string;
  modules: ModuleMap;
}) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setComponent(null);
    setError(null);

    async function loadComponent(): Promise<void> {
      const key = `./components/mockups/${componentPath}.tsx`;
      const loader = modules[key];
      if (!loader) {
        setError(`No component found at ${componentPath}.tsx`);
        return;
      }

      try {
        const mod = await loader();
        if (cancelled) {
          return;
        }
        const name = componentPath.split("/").pop()!;
        const comp = _resolveComponent(mod, name);
        if (!comp) {
          setError(
            `No exported React component found in ${componentPath}.tsx\n\nMake sure the file has at least one exported function component.`,
          );
          return;
        }
        setComponent(() => comp);
      } catch (e) {
        if (cancelled) {
          return;
        }

        const message = e instanceof Error ? e.message : String(e);
        setError(`Failed to load preview.\n${message}`);
      }
    }

    void loadComponent();

    return () => {
      cancelled = true;
    };
  }, [componentPath, modules]);

  if (error) {
    return (
      <pre style={{ color: "red", padding: "2rem", fontFamily: "system-ui" }}>
        {error}
      </pre>
    );
  }

  if (!Component) return null;

  return <Component />;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

function getLocalPath(): string {
  const basePath = getBasePath();
  const { pathname } = window.location;
  const local =
    basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  return local;
}

function App() {
  const [currentPath, setCurrentPath] = useState<string>(getLocalPath());

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getLocalPath());
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  // Check for component preview route: /preview/:componentName
  const matchPreview = currentPath.match(/^\/preview\/(.+)$/);
  if (matchPreview) {
    return (
      <PreviewRenderer
        componentPath={matchPreview[1]}
        modules={discoveredModules}
      />
    );
  }

  // Check for dedicated /admin route
  if (currentPath === "/admin" || currentPath.startsWith("/admin")) {
    return (
      <AdminPanel
        onSwitchToMobileView={() => {
          const basePath = getBasePath();
          const target = basePath ? `${basePath}/` : "/";
          window.history.pushState({}, "", target);
          setCurrentPath("/");
        }}
      />
    );
  }

  // Default to the main How Low Auction application
  return <HowLowAuction />;
}

export default App;
