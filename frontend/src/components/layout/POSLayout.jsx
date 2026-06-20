import React, { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChefHat,
  ChevronDown,
  Coffee,
  History,
  LogOut,
  Menu,
  MonitorPlay,
  Power,
  Search,
  Settings,
  ShoppingBag,
  Table2,
  User,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { POSProvider, usePOS } from "../../context/POSContext";

const readJsonStorage = (key) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) return null;
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const getId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || "";
};

const getTableName = (table) => {
  return (
    table?.tableNumber ||
    table?.tableName ||
    table?.name ||
    table?.number ||
    table?.title ||
    (table ? `T-${String(getId(table)).slice(-4)}` : "")
  );
};

const getRoleLabel = (role) => {
  const value = String(role || "").toLowerCase();

  if (value === "admin") return "Admin";
  if (value === "employee") return "Employee";
  if (value === "cashier") return "Cashier";
  if (value === "worker") return "Cashier";
  if (value === "kitchen") return "Kitchen";

  return value || "User";
};

const getInitial = (user) => {
  return (
    user?.name?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U"
  );
};

function NavButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black transition-all ${
        active
          ? "border border-[#FF5722]/30 bg-[#FF5722]/15 text-[#FF5722] shadow-lg shadow-[#FF5722]/5"
          : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span className="hidden xl:inline">{label}</span>
      <span className="xl:hidden">{label.split(" ")[0]}</span>
    </button>
  );
}

function DropdownLink({ to, icon: Icon, label, tone = "default", onClick }) {
  const toneClass =
    tone === "warning"
      ? "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
      : tone === "danger"
      ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
      : "text-slate-400 hover:bg-white/5 hover:text-white";

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex w-full items-center rounded-xl px-3 py-3 text-sm font-bold transition ${toneClass}`}
    >
      <Icon className="mr-3 h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

const POSLayoutInner = () => {
  const { user, session, logout, closeSession } = useAuth();
  const { searchTerm, setSearchTerm, activeTable, setActiveTable } = usePOS();

  const location = useLocation();
  const navigate = useNavigate();

  const [closingLoading, setClosingLoading] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [storedTable, setStoredTable] = useState(() =>
    readJsonStorage("cafeflow_current_table")
  );

  const effectiveTable = activeTable || storedTable;
  const activeTableId = getId(effectiveTable);
  const activeTableName = getTableName(effectiveTable);

  const isOrderPage = location.pathname.startsWith("/pos/order");
  const isTablePage =
    location.pathname === "/pos" || location.pathname === "/pos/table-view";
  const isOrdersPage = location.pathname.startsWith("/pos/orders");
  const isCustomersPage = location.pathname.startsWith("/pos/customers");

  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const drawerBalance = useMemo(() => {
    const value = Number(session?.openingBalance || 0);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  }, [session]);

  useEffect(() => {
    const syncTable = () => {
      const savedTable = readJsonStorage("cafeflow_current_table");
      setStoredTable(savedTable);

      if (savedTable && typeof setActiveTable === "function") {
        setActiveTable(savedTable);
      }
    };

    syncTable();

    window.addEventListener("storage", syncTable);
    window.addEventListener("cafeflow_table_changed", syncTable);

    return () => {
      window.removeEventListener("storage", syncTable);
      window.removeEventListener("cafeflow_table_changed", syncTable);
    };
  }, [setActiveTable]);

  useEffect(() => {
    if (activeTable) {
      setStoredTable(activeTable);
      localStorage.setItem("cafeflow_current_table", JSON.stringify(activeTable));
    }
  }, [activeTable]);

  const closeAllMenus = () => {
    setHamburgerOpen(false);
    setProfileDropdownOpen(false);
  };

  const goToPOSOrder = () => {
    closeAllMenus();

    if (activeTableId) {
      navigate(`/pos/order/${activeTableId}`);
    } else {
      navigate("/pos");
    }
  };

  const goToTableView = () => {
    closeAllMenus();
    navigate("/pos");
  };

  const handleCloseSession = async () => {
    setHamburgerOpen(false);

    const balance = window.prompt("Enter closing cash drawer balance (₹):");

    if (balance === null || balance === "") return;

    const parsedBalance = Number(balance);

    if (!Number.isFinite(parsedBalance)) {
      alert("Invalid cash amount.");
      return;
    }

    try {
      setClosingLoading(true);

      const response = await closeSession(parsedBalance);

      if (response?.success) {
        localStorage.removeItem("cafeflow_current_table");
        window.dispatchEvent(new Event("cafeflow_table_changed"));

        alert("POS Session successfully closed.");
        navigate("/pos/open-session");
      } else {
        alert(response?.error || "Failed to close session.");
      }
    } finally {
      setClosingLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cafeflow_current_table");
    window.dispatchEvent(new Event("cafeflow_table_changed"));

    logout();
    navigate("/login");
  };

  return (
    <div
      className="flex h-screen select-none flex-col overflow-hidden bg-[#08090f] text-slate-100"
      style={{ fontFamily: "Inter,sans-serif" }}
    >
      {/* Unified POS Top Navigation */}
      <header className="relative z-40 flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[#0b0d16]/95 px-5 backdrop-blur-xl">
        {/* Left: Brand + Main Links */}
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/"
            onClick={closeAllMenus}
            className="flex shrink-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#f97316] shadow-lg shadow-[#FF5722]/25">
              <Coffee className="h-5 w-5 text-white" />
            </div>

            <div className="hidden lg:block">
              <p
                className="text-sm font-black leading-4 text-white"
                style={{ fontFamily: "Outfit,sans-serif" }}
              >
                CafeFlow POS
              </p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FF5722]">
                Terminal
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavButton
              active={isOrderPage}
              icon={ShoppingBag}
              label="POS Order"
              onClick={goToPOSOrder}
            />

            <NavButton
              active={isTablePage}
              icon={Table2}
              label="Table View"
              onClick={goToTableView}
            />

            <NavButton
              active={isOrdersPage}
              icon={History}
              label="Orders"
              onClick={() => {
                closeAllMenus();
                navigate("/pos/orders");
              }}
            />

            <NavButton
              active={isCustomersPage}
              icon={Users}
              label="Customer"
              onClick={() => {
                closeAllMenus();
                navigate("/pos/customers");
              }}
            />
          </nav>
        </div>

        {/* Center: Search */}
        <div className="mx-4 hidden max-w-xl flex-1 lg:block">
          <div className="relative flex h-12 items-center rounded-2xl border border-white/10 bg-[#0d1120] px-4 transition focus-within:border-[#FF5722]/50">
            <Search className="mr-3 h-4 w-4 shrink-0 text-slate-500" />

            <input
              type="text"
              placeholder={
                isOrderPage
                  ? "Search products..."
                  : isCustomersPage
                  ? "Search customers..."
                  : isOrdersPage
                  ? "Search orders..."
                  : "Search items / guests..."
              }
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-600"
            />

            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Active Table */}
          <button
            type="button"
            onClick={goToTableView}
            className={`hidden h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition sm:flex ${
              effectiveTable
                ? "border-sky-500/25 bg-sky-500/10 text-sky-300 hover:bg-sky-500/15"
                : "border-white/10 bg-white/5 text-slate-500 hover:bg-white/10"
            }`}
            title="Open Table View"
          >
            <Table2 className="h-4 w-4" />
            <span>{effectiveTable ? activeTableName : "No Active Table"}</span>
          </button>

          {/* Employee Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileDropdownOpen((prev) => !prev);
                setHamburgerOpen(false);
              }}
              className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2.5 transition hover:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#FF5722] to-[#f97316] text-sm font-black text-white">
                {getInitial(user)}
              </div>

              <div className="hidden text-left xl:block">
                <p className="max-w-[120px] truncate text-xs font-black text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                  {getRoleLabel(user?.role)}
                </p>
              </div>

              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            {profileDropdownOpen ? (
              <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-white/10 bg-[#0d1120] p-3 shadow-2xl shadow-black/40">
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#f97316] text-base font-black text-white">
                      {getInitial(user)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {user?.name || "User"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-[#FF5722]/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#FF5722]">
                    {getRoleLabel(user?.role)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => {
              setHamburgerOpen((prev) => !prev);
              setProfileDropdownOpen(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1120] text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            {hamburgerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Hamburger Dropdown */}
        {hamburgerOpen ? (
          <div className="absolute right-5 top-[78px] z-50 w-72 rounded-3xl border border-white/10 bg-[#0d1120] p-3 shadow-2xl shadow-black/50">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              POS Operations
            </p>

            <div className="md:hidden">
              <button
                type="button"
                onClick={goToPOSOrder}
                className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <ShoppingBag className="mr-3 h-4 w-4" />
                POS Order
              </button>

              <button
                type="button"
                onClick={goToTableView}
                className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <Table2 className="mr-3 h-4 w-4" />
                Table View
              </button>

              <DropdownLink
                to="/pos/orders"
                icon={History}
                label="Orders"
                onClick={closeAllMenus}
              />

              <DropdownLink
                to="/pos/customers"
                icon={Users}
                label="Customers"
                onClick={closeAllMenus}
              />
            </div>

            <DropdownLink
              to="/kitchen"
              icon={ChefHat}
              label="Kitchen Display"
              tone="warning"
              onClick={closeAllMenus}
            />

            {isAdmin ? (
              <>
                <div className="my-2 border-t border-white/10" />

                <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Admin Backend
                </p>

                <DropdownLink
                  to="/admin"
                  icon={Settings}
                  label="Admin Dashboard"
                  onClick={closeAllMenus}
                />

                <DropdownLink
                  to="/admin/bookings"
                  icon={CalendarDays}
                  label="Bookings"
                  onClick={closeAllMenus}
                />

                <DropdownLink
                  to="/admin/users"
                  icon={User}
                  label="Users / Employees"
                  onClick={closeAllMenus}
                />
              </>
            ) : null}

            <div className="my-3 border-t border-white/10" />

            {session ? (
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Active Session
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Opening Balance</span>
                  <span className="font-mono text-sm font-black text-white">
                    ₹{drawerBalance}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCloseSession}
                  disabled={closingLoading}
                  className="mt-3 flex w-full items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-black text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Power className="mr-2 h-4 w-4" />
                  {closingLoading ? "Closing..." : "Close POS Session"}
                </button>
              </div>
            ) : (
              <Link
                to="/pos/open-session"
                onClick={closeAllMenus}
                className="flex items-center justify-center rounded-2xl border border-[#FF5722]/20 bg-[#FF5722]/10 px-4 py-3 text-sm font-black text-[#FF5722] transition hover:bg-[#FF5722]/20"
              >
                <MonitorPlay className="mr-2 h-4 w-4" />
                Open POS Session
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        ) : null}
      </header>

      {/* Main Workspace */}
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

const POSLayout = () => {
  return (
    <POSProvider>
      <POSLayoutInner />
    </POSProvider>
  );
};

export default POSLayout;