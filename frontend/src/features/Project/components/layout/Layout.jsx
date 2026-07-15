import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useState } from "react";

const Layout = () => {
  const [open, setOpen] = useState(false);      // mobile
  const [collapsed, setCollapsed] = useState(false); // desktop

  return (
    <div className="flex flex-col h-screen bg-main text-main selection:bg-brand-indigo/30 transition-colors duration-300">

      {/* TOPBAR: FULL WIDTH */}
      <Topbar
        setSidebarOpen={setOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* CONTENT AREA: SIDEBAR + MAIN */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          open={open}
          setOpen={setOpen}
          collapsed={collapsed}
        />

        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;