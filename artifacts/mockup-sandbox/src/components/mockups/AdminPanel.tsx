import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  BarChart3,
  Package,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  ArrowUpRight,
  Flame,
  Layers,
  Settings,
  Smartphone,
  ExternalLink
} from "lucide-react";
import {
  AuctionItem,
  BidRecord,
  AdminSettings,
  INITIAL_AUCTIONS,
  INITIAL_BIDS
} from "../../types/auction";

interface AdminPanelProps {
  auctions?: AuctionItem[];
  bidsByAuction?: Record<string, BidRecord[]>;
  auctionTimes?: Record<string, number>;
  activeAuctionId?: string;
  onSelectAuction?: (id: string) => void;
  onUpdateAuctions?: (auctions: AuctionItem[]) => void;
  onUpdateBids?: (bids: Record<string, BidRecord[]>) => void;
  onUpdateTimes?: (times: Record<string, number>) => void;
  onSwitchToMobileView?: () => void;
}

export default function AdminPanel({
  auctions: propAuctions,
  bidsByAuction: propBids,
  auctionTimes: propTimes,
  activeAuctionId: propActiveId,
  onSelectAuction,
  onUpdateAuctions,
  onUpdateBids,
  onUpdateTimes,
  onSwitchToMobileView
}: AdminPanelProps) {
  // Local state fallbacks if rendered standalone in preview
  const [localAuctions, setLocalAuctions] = useState<AuctionItem[]>(INITIAL_AUCTIONS);
  const [localBids, setLocalBids] = useState<Record<string, BidRecord[]>>(INITIAL_BIDS);
  const [localTimes, setLocalTimes] = useState<Record<string, number>>({
    "auc-1": 182,
    "auc-2": 295,
    "auc-3": 440,
    "auc-4": 150
  });
  const [localActiveId, setLocalActiveId] = useState<string>("auc-1");

  // Effective state bindings
  const auctions = propAuctions ?? localAuctions;
  const bidsByAuction = propBids ?? localBids;
  const auctionTimes = propTimes ?? localTimes;
  const activeAuctionId = propActiveId ?? localActiveId;

  const setActiveId = (id: string) => {
    if (onSelectAuction) onSelectAuction(id);
    else setLocalActiveId(id);
  };

  const setAuctions = (updated: AuctionItem[]) => {
    if (onUpdateAuctions) onUpdateAuctions(updated);
    else setLocalAuctions(updated);
  };

  const setBids = (updated: Record<string, BidRecord[]>) => {
    if (onUpdateBids) onUpdateBids(updated);
    else setLocalBids(updated);
  };

  const setTimes = (updated: Record<string, number>) => {
    if (onUpdateTimes) onUpdateTimes(updated);
    else setLocalTimes(updated);
  };

  // Admin Portal Navigation Tab
  const [currentTab, setCurrentTab] = useState<"overview" | "auctions" | "audit" | "heatmap" | "simulation" | "settings">("overview");

  // Audit Filters
  const [auditAuctionFilter, setAuditAuctionFilter] = useState<string>("all");
  const [auditStatusFilter, setAuditStatusFilter] = useState<"all" | "unique" | "duplicates" | "user">("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");

  // Create Auction Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAuctionForm, setNewAuctionForm] = useState({
    title: "",
    subtitle: "",
    retailValue: 999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    initialTimeMinutes: 5,
    entryFeeTokens: 1,
    description: ""
  });

  // Settings State
  const [settings, setSettings] = useState<AdminSettings>({
    tokenPriceUsd: 0.50,
    antiSnipeBufferSeconds: 20,
    antiSnipeAddSeconds: 15,
    minBidIncrement: 0.01,
    simulationEnabled: true,
    simulationSpeed: "normal"
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" | "info" } | null>(null);

  const notify = (message: string, type: "success" | "warning" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Calculate recalculations for bids across all auctions
  const getProcessedBids = (auctionId: string): BidRecord[] => {
    const raw = bidsByAuction[auctionId] || [];
    const counts: Record<number, number> = {};
    for (const b of raw) {
      counts[b.amount] = (counts[b.amount] || 0) + 1;
    }
    const uniqueAmounts = Object.keys(counts)
      .map(Number)
      .filter((amt) => counts[amt] === 1)
      .sort((a, b) => a - b);
    const lowestUnique = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

    return raw.map((b) => {
      let status: "lowest_unique" | "unique_higher" | "duplicate" = "duplicate";
      if (counts[b.amount] === 1) {
        status = b.amount === lowestUnique ? "lowest_unique" : "unique_higher";
      } else {
        status = "duplicate";
      }
      return { ...b, status };
    });
  };

  // Financial & Platform Metrics
  const platformMetrics = useMemo(() => {
    let totalBids = 0;
    let totalTokensCollected = 0;
    let totalRetailMSRP = 0;
    let totalUniqueBids = 0;
    let totalDuplicateBids = 0;

    auctions.forEach((auc) => {
      const pBids = getProcessedBids(auc.id);
      totalBids += pBids.length;
      totalTokensCollected += pBids.length * auc.entryFeeTokens;
      totalRetailMSRP += auc.retailValue;
      pBids.forEach((b) => {
        if (b.status === "duplicate") totalDuplicateBids++;
        else totalUniqueBids++;
      });
    });

    const grossRevenueUsd = totalTokensCollected * settings.tokenPriceUsd;
    const tieRate = totalBids > 0 ? Math.round((totalDuplicateBids / totalBids) * 100) : 0;
    const uniqueRate = totalBids > 0 ? Math.round((totalUniqueBids / totalBids) * 100) : 0;

    return {
      totalBids,
      totalTokensCollected,
      grossRevenueUsd,
      totalRetailMSRP,
      tieRate,
      uniqueRate,
      activeCount: auctions.filter((a) => a.status === "active").length,
      endedCount: auctions.filter((a) => a.status === "ended").length
    };
  }, [auctions, bidsByAuction, settings.tokenPriceUsd]);

  // Current selected auction's data
  const selectedAuction = useMemo(() => {
    return auctions.find((a) => a.id === activeAuctionId) || auctions[0];
  }, [auctions, activeAuctionId]);

  const selectedBids = useMemo(() => {
    return getProcessedBids(activeAuctionId);
  }, [bidsByAuction, activeAuctionId]);

  const winningBid = useMemo(() => {
    return selectedBids.find((b) => b.status === "lowest_unique") || null;
  }, [selectedBids]);

  // Bid distribution matrix for selected auction
  const selectedDistribution = useMemo(() => {
    const map: Record<number, { count: number; users: string[]; hasUser: boolean }> = {};
    for (const b of selectedBids) {
      if (!map[b.amount]) {
        map[b.amount] = { count: 0, users: [], hasUser: false };
      }
      map[b.amount].count += 1;
      map[b.amount].users.push(b.userName);
      if (b.isUser) map[b.amount].hasUser = true;
    }
    return Object.entries(map)
      .map(([amtStr, data]) => ({
        amount: Number(amtStr),
        count: data.count,
        users: data.users,
        hasUser: data.hasUser,
        isLowestUnique: winningBid?.amount === Number(amtStr)
      }))
      .sort((a, b) => a.amount - b.amount);
  }, [selectedBids, winningBid]);

  // Filtered bids for the Audit tab
  const filteredAuditBids = useMemo(() => {
    let list: BidRecord[] = [];
    if (auditAuctionFilter === "all") {
      auctions.forEach((a) => {
        list.push(...getProcessedBids(a.id));
      });
    } else {
      list = getProcessedBids(auditAuctionFilter);
    }

    if (auditStatusFilter === "unique") {
      list = list.filter((b) => b.status === "lowest_unique" || b.status === "unique_higher");
    } else if (auditStatusFilter === "duplicates") {
      list = list.filter((b) => b.status === "duplicate");
    } else if (auditStatusFilter === "user") {
      list = list.filter((b) => b.isUser);
    }

    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.userName.toLowerCase().includes(q) ||
          b.amount.toFixed(2).includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
  }, [auctions, bidsByAuction, auditAuctionFilter, auditStatusFilter, auditSearchQuery]);

  // Admin Actions
  const handleToggleAuctionPause = (id: string) => {
    const updated = auctions.map((a) => {
      if (a.id === id) {
        const nextStatus = a.status === "active" ? ("paused" as const) : ("active" as const);
        return { ...a, status: nextStatus };
      }
      return a;
    });
    setAuctions(updated);
    notify(`Auction status updated to ${updated.find(a => a.id === id)?.status.toUpperCase()}`);
  };

  const handleExtendTimer = (id: string, seconds: number) => {
    setTimes({
      ...auctionTimes,
      [id]: (auctionTimes[id] || 0) + seconds
    });
    notify(`Extended timer by +${seconds} seconds for auction ${id}`, "success");
  };

  const handleForceEndAuction = (id: string) => {
    const item = auctions.find((a) => a.id === id);
    if (!item) return;

    const pBids = getProcessedBids(id);
    const win = pBids.find((b) => b.status === "lowest_unique");

    const updated = auctions.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: "ended" as const,
          winner: win ? { userName: win.userName, amount: win.amount, settledAt: new Date() } : null
        };
      }
      return a;
    });

    setAuctions(updated);
    setTimes({ ...auctionTimes, [id]: 0 });

    if (win) {
      notify(`Auction ended! Winner: ${win.userName} at $${win.amount.toFixed(2)}`, "success");
    } else {
      notify(`Auction ended with no unique bids! Item unawarded.`, "warning");
    }
  };

  const handleResetBids = (id: string) => {
    setBids({
      ...bidsByAuction,
      [id]: []
    });
    notify(`All bids purged for auction ${id}`, "info");
  };

  const handleInjectCompetitorBid = (targetAuctionId: string = activeAuctionId) => {
    const competitorNames = ["StealthySniper", "AlphaBot", "NightHawk", "PennyPro", "ShadowCaster", "Vortex"];
    const randomName = competitorNames[Math.floor(Math.random() * competitorNames.length)];
    const newAmt = Math.round((Math.random() * 0.45 + 0.01) * 100) / 100;

    const newBid: BidRecord = {
      id: "admin-sim-" + Date.now(),
      auctionId: targetAuctionId,
      amount: newAmt,
      placedAt: new Date(),
      status: "unique_higher",
      userId: "sim-admin-" + Math.random().toString(36).substring(7),
      userName: randomName,
      isUser: false
    };

    setBids({
      ...bidsByAuction,
      [targetAuctionId]: [newBid, ...(bidsByAuction[targetAuctionId] || [])]
    });
    notify(`Injected simulated competitor bid of $${newAmt.toFixed(2)} by ${randomName}`);
  };

  const handleTieWinningBid = (targetAuctionId: string = activeAuctionId) => {
    const pBids = getProcessedBids(targetAuctionId);
    const currWinning = pBids.find((b) => b.status === "lowest_unique");

    if (!currWinning) {
      notify("No unique bid exists to tie!", "warning");
      return;
    }

    const tieBid: BidRecord = {
      id: "admin-tie-" + Date.now(),
      auctionId: targetAuctionId,
      amount: currWinning.amount,
      placedAt: new Date(),
      status: "duplicate",
      userId: "bot-tie-" + Math.random().toString(36).substring(7),
      userName: "TieCollisionBot",
      isUser: false
    };

    setBids({
      ...bidsByAuction,
      [targetAuctionId]: [tieBid, ...(bidsByAuction[targetAuctionId] || [])]
    });
    notify(`Tied current winning bid at $${currWinning.amount.toFixed(2)}! It is now duplicate.`, "warning");
  };

  const handleCreateAuctionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuctionForm.title.trim()) {
      notify("Please provide a title", "warning");
      return;
    }

    const newId = `auc-${Date.now().toString().slice(-4)}`;
    const newAuction: AuctionItem = {
      id: newId,
      title: newAuctionForm.title,
      subtitle: newAuctionForm.subtitle || "Premium Brand New Sealed Item",
      retailValue: Number(newAuctionForm.retailValue) || 499,
      category: newAuctionForm.category,
      image: newAuctionForm.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
      initialTimeSeconds: (Number(newAuctionForm.initialTimeMinutes) || 5) * 60,
      entryFeeTokens: Number(newAuctionForm.entryFeeTokens) || 1,
      totalBidsCount: 0,
      description: newAuctionForm.description || "Lowest unique bid auction.",
      status: "active"
    };

    setAuctions([...auctions, newAuction]);
    setTimes({ ...auctionTimes, [newId]: newAuction.initialTimeSeconds });
    setBids({ ...bidsByAuction, [newId]: [] });
    setActiveId(newId);
    setShowCreateModal(false);
    notify(`Created new auction "${newAuction.title}" successfully!`, "success");
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-xl ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200"
              : toast.type === "warning"
              ? "bg-amber-950/90 border-amber-500/60 text-amber-200"
              : "bg-indigo-950/90 border-indigo-500/60 text-indigo-200"
          }`}>
            {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {toast.type === "info" && <Sparkles className="w-4 h-4 text-indigo-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Admin Command Header */}
      <header className="bg-slate-900/90 border-b border-indigo-500/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">
                  HOW<span className="text-indigo-400">LOW</span>
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md border border-indigo-500/30">
                  ADMIN OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Auction House Operations & Live Feed Audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Link back to Main Public App */}
            <button
              onClick={() => {
                if (onSwitchToMobileView) {
                  onSwitchToMobileView();
                } else {
                  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
                  const target = basePath ? `${basePath}/` : "/";
                  window.history.pushState({}, "", target);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Return to Public Auction App"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Auction (/)</span>
            </button>

            {/* Quick Create Auction Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Auction</span>
            </button>
          </div>

        </div>

        {/* Admin Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setCurrentTab("overview")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "overview"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Overview & Metrics
          </button>

          <button
            onClick={() => setCurrentTab("auctions")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "auctions"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Auction Manager ({auctions.length})
          </button>

          <button
            onClick={() => setCurrentTab("audit")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "audit"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Live Unmasked Audit
          </button>

          <button
            onClick={() => setCurrentTab("heatmap")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "heatmap"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Collision Heatmap
          </button>

          <button
            onClick={() => setCurrentTab("simulation")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "simulation"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Bot Simulation Suite
          </button>

          <button
            onClick={() => setCurrentTab("settings")}
            className={`py-2.5 px-3.5 font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap cursor-pointer ${
              currentTab === "settings"
                ? "border-indigo-500 text-indigo-300 bg-indigo-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Platform Settings
          </button>
        </div>
      </header>

      {/* Main Admin Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

        {/* TAB 1: OVERVIEW & METRICS */}
        {currentTab === "overview" && (
          <div className="space-y-6">
            
            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  Gross Revenue (Tokens)
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    ${platformMetrics.grossRevenueUsd.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">({platformMetrics.totalTokensCollected} tkns)</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">@ ${settings.tokenPriceUsd.toFixed(2)} / token price</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  Total Platform Bids
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {platformMetrics.totalBids}
                  </span>
                  <span className="text-xs text-indigo-400">all auctions</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Across {auctions.length} total drop items</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  Collision / Tie Rate
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-rose-400">
                    {platformMetrics.tieRate}%
                  </span>
                  <span className="text-xs text-slate-400">tied bids</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Disqualified duplicate price points</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-slate-400 text-xs font-medium flex items-center justify-between">
                  Unique Bid Efficiency
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {platformMetrics.uniqueRate}%
                  </span>
                  <span className="text-xs text-slate-400">solo picks</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Uncontested cents in current pool</p>
              </div>

            </div>

            {/* Platform Health & Active Auction Focus */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Active Auctions Economics Breakdown */}
              <div className="lg:col-span-8 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" /> Live Auction Performance & Margins
                    </h3>
                    <p className="text-xs text-slate-400">Real-time profitability tracking against retail cost</p>
                  </div>
                  <span className="text-xs text-indigo-400 font-mono">
                    {platformMetrics.activeCount} Active / {platformMetrics.endedCount} Ended
                  </span>
                </div>

                <div className="space-y-3">
                  {auctions.map((auc) => {
                    const pBids = getProcessedBids(auc.id);
                    const revenue = pBids.length * auc.entryFeeTokens * settings.tokenPriceUsd;
                    const breakEvenPercent = Math.min(100, Math.round((revenue / auc.retailValue) * 100));
                    const isWinning = pBids.find((b) => b.status === "lowest_unique");

                    return (
                      <div
                        key={auc.id}
                        className={`p-4 rounded-xl border transition ${
                          auc.id === activeAuctionId
                            ? "bg-slate-900 border-indigo-500/60 shadow-lg"
                            : "bg-slate-950/50 border-slate-800/80"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={auc.image}
                              alt={auc.title}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{auc.title}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                  auc.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : auc.status === "paused"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-slate-800 text-slate-400"
                                }`}>
                                  {auc.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Retail MSRP: <span className="font-semibold text-slate-200">${auc.retailValue}</span> • Fee: <span className="text-amber-400">{auc.entryFeeTokens} Token</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <span className="text-xs font-bold font-mono text-emerald-400">${revenue.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-500 block">{pBids.length} bids</span>
                            </div>
                            <button
                              onClick={() => {
                                setActiveId(auc.id);
                                setCurrentTab("audit");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>

                        {/* Margin Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Cost Recovery Progress</span>
                            <span>{breakEvenPercent}% of MSRP (${revenue.toFixed(2)} / ${auc.retailValue})</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                breakEvenPercent >= 100
                                  ? "bg-emerald-400"
                                  : breakEvenPercent > 50
                                  ? "bg-indigo-400"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${breakEvenPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Current winning bid status */}
                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Current Leader:</span>
                          {isWinning ? (
                            <span className="font-mono text-emerald-400 font-bold">
                              ${isWinning.amount.toFixed(2)} by {isWinning.userName} {isWinning.isUser && "(User)"}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-mono">No unique bid (all tied)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Quick Action Controls */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Live Simulation Quick Injections
                  </h3>
                  <p className="text-xs text-slate-400">
                    Interact directly with active item <strong className="text-white">({selectedAuction.title})</strong>
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={() => handleInjectCompetitorBid()}
                      className="w-full p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center gap-3 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">Inject Single Competitor Bid</span>
                        <span className="text-[10px] text-slate-400">Simulates random realistic cent choice</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleTieWinningBid()}
                      className="w-full p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/40 text-left transition flex items-center gap-3 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">Tie Current Winning Bid</span>
                        <span className="text-[10px] text-amber-400/80">Forces duplicate collision on leader</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleExtendTimer(activeAuctionId, 60)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center gap-3 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-white block">+60s Emergency Clock Extension</span>
                        <span className="text-[10px] text-slate-400">Prevents auction from closing immediately</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleToggleAuctionPause(activeAuctionId)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center gap-3 cursor-pointer"
                    >
                      {selectedAuction.status === "paused" ? (
                        <Play className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Pause className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {selectedAuction.status === "paused" ? "Resume Auction Countdown" : "Freeze / Pause Countdown"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {selectedAuction.status === "paused" ? "Currently paused" : "Halt the clock for inspection"}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Anti-Collusion Rule Card */}
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 text-xs text-indigo-200/90 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-300">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    Lowest Unique Bid Rules Enforced
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    1. Duplicate amounts are automatically stripped from consideration.<br />
                    2. Lowest unique amount holds the crown.<br />
                    3. Regular bidders can never see other participant amounts in their UI.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: AUCTION CATALOG & INVENTORY MANAGER */}
        {currentTab === "auctions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" /> Auction Inventory Catalog
                </h2>
                <p className="text-xs text-slate-400">Configure retail prices, countdown timers, and settle winners</p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Auction
              </button>
            </div>

            {/* Inventory Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Item Details</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Retail MSRP</th>
                      <th className="py-3.5 px-4">Fee / Bid</th>
                      <th className="py-3.5 px-4">Time Left</th>
                      <th className="py-3.5 px-4">Bids Placed</th>
                      <th className="py-3.5 px-4">Current Leader</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auctions.map((auc) => {
                      const pBids = getProcessedBids(auc.id);
                      const leader = pBids.find((b) => b.status === "lowest_unique");
                      const timeLeft = auctionTimes[auc.id] || 0;

                      return (
                        <tr key={auc.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={auc.image}
                                alt={auc.title}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700"
                              />
                              <div>
                                <span className="font-bold text-white block">{auc.title}</span>
                                <span className="text-[10px] text-slate-400">{auc.subtitle}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-medium">{auc.category}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-200">${auc.retailValue}</td>
                          <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{auc.entryFeeTokens} Tkn</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                            {auc.status === "ended" ? "ENDED" : formatTimer(timeLeft)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-white font-bold">{pBids.length}</td>
                          <td className="py-3.5 px-4">
                            {auc.status === "ended" && auc.winner ? (
                              <span className="font-mono text-emerald-400 font-bold">
                                🏆 {auc.winner.userName} (${auc.winner.amount.toFixed(2)})
                              </span>
                            ) : leader ? (
                              <span className="font-mono text-emerald-400 font-bold">
                                ${leader.amount.toFixed(2)} ({leader.userName})
                              </span>
                            ) : (
                              <span className="text-amber-400 text-[11px]">All Tied</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              auc.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : auc.status === "paused"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-slate-800 text-slate-400"
                            }`}>
                              {auc.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {auc.status !== "ended" && (
                                <>
                                  <button
                                    onClick={() => handleToggleAuctionPause(auc.id)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                    title={auc.status === "paused" ? "Resume" : "Pause"}
                                  >
                                    {auc.status === "paused" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleExtendTimer(auc.id, 60)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 cursor-pointer"
                                    title="+60 Seconds"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleForceEndAuction(auc.id)}
                                    className="px-2 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 font-semibold cursor-pointer"
                                    title="Settle & Declare Winner"
                                  >
                                    End & Settle
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleResetBids(auc.id)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 cursor-pointer"
                                title="Clear All Bids"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE UNMASKED BID AUDIT */}
        {currentTab === "audit" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" /> Live Unmasked Bid Audit Feed
                </h2>
                <p className="text-xs text-slate-400">
                  Inspect secret amounts in real-time. Notice who placed which exact dollar amount.
                </p>
              </div>

              {/* Auction Selector Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Auction:</span>
                <select
                  value={auditAuctionFilter}
                  onChange={(e) => setAuditAuctionFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value="all">All Auctions Combined</option>
                  {auctions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({getProcessedBids(a.id).length} bids)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setAuditStatusFilter("all")}
                  className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer ${
                    auditStatusFilter === "all" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Statuses ({filteredAuditBids.length})
                </button>
                <button
                  onClick={() => setAuditStatusFilter("unique")}
                  className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer ${
                    auditStatusFilter === "unique" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Unique Only
                </button>
                <button
                  onClick={() => setAuditStatusFilter("duplicates")}
                  className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer ${
                    auditStatusFilter === "duplicates" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Duplicates (Tied)
                </button>
                <button
                  onClick={() => setAuditStatusFilter("user")}
                  className={`px-3 py-1 rounded-xl font-medium transition cursor-pointer ${
                    auditStatusFilter === "user" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Real User Bids
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by bidder, amount ($0.03)..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Unmasked Audit Feed Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="py-3 px-4">Unmasked Bid</th>
                      <th className="py-3 px-4">Bidder Name</th>
                      <th className="py-3 px-4">User Type</th>
                      <th className="py-3 px-4">Auction Item</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Computed Status</th>
                      <th className="py-3 px-4 text-right">Collision Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredAuditBids.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                          No bids matching the active filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditBids.map((b) => {
                        const auc = auctions.find((a) => a.id === b.auctionId);
                        return (
                          <tr
                            key={b.id}
                            className={`hover:bg-slate-800/40 transition ${
                              b.status === "lowest_unique"
                                ? "bg-emerald-950/30"
                                : b.status === "duplicate"
                                ? "bg-rose-950/10"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded font-black text-sm ${
                                b.status === "lowest_unique"
                                  ? "bg-emerald-500 text-slate-950 font-bold"
                                  : "text-white bg-slate-800"
                              }`}>
                                ${b.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                              {b.userName}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              {b.isUser ? (
                                <span className="bg-emerald-500/20 text-emerald-300 font-bold text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  REAL USER
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">AI BOT</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-300 truncate max-w-[140px]">
                              {auc?.title || b.auctionId}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {b.placedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                b.status === "lowest_unique"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : b.status === "unique_higher"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}>
                                {b.status === "lowest_unique" && "👑 LOWEST UNIQUE"}
                                {b.status === "unique_higher" && "Unique (Outbid)"}
                                {b.status === "duplicate" && "Duplicate Tied"}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-sans text-[11px] text-right text-slate-400">
                              {b.status === "lowest_unique" ? (
                                <span className="text-emerald-400 font-bold">Current Auction Winner</span>
                              ) : b.status === "duplicate" ? (
                                <span className="text-rose-400/90">Collided with other bidder</span>
                              ) : (
                                <span className="text-slate-500">Unique but higher than leader</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: COLLISION HEATMAP & DISTRIBUTION MATRIX */}
        {currentTab === "heatmap" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Price Point Collision Heatmap
                </h2>
                <p className="text-xs text-slate-400">
                  Visual spectrum of all cent levels placed for active item <strong className="text-white">({selectedAuction.title})</strong>
                </p>
              </div>

              {/* Auction Switcher */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Item:</span>
                <select
                  value={activeAuctionId}
                  onChange={(e) => setActiveId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
                >
                  {auctions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-xl flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0"></span>
                <div>
                  <span className="font-bold text-emerald-300 block">Lowest Unique Bid</span>
                  <span className="text-[11px] text-slate-400">The sole winning price point</span>
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0"></span>
                <div>
                  <span className="font-bold text-amber-300 block">Unique Higher</span>
                  <span className="text-[11px] text-slate-400">Single bid, but higher than winner</span>
                </div>
              </div>

              <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0"></span>
                <div>
                  <span className="font-bold text-rose-300 block">Duplicate Collision</span>
                  <span className="text-[11px] text-slate-400">2 or more people bid the exact same cent</span>
                </div>
              </div>
            </div>

            {/* Distribution List Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Cent Price Point</span>
                <span>Collision Count & Bidders</span>
                <span>System Outcome</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {selectedDistribution.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500">No bids placed on this auction yet.</p>
                ) : (
                  selectedDistribution.map((item) => (
                    <div
                      key={item.amount}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        item.isLowestUnique
                          ? "bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/10 text-emerald-200"
                          : item.count === 1
                          ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
                          : "bg-slate-950/70 border-rose-900/50 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-base text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          ${item.amount.toFixed(2)}
                        </span>
                        <div>
                          <span className="text-xs font-semibold block text-slate-200">
                            {item.users.join(" & ")}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.count} bid{item.count > 1 ? "s registered" : " registered"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.isLowestUnique
                            ? "bg-emerald-500 text-slate-950"
                            : item.count === 1
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}>
                          {item.isLowestUnique && "👑 WINNING CROWN"}
                          {!item.isLowestUnique && item.count === 1 && "Unique (Outbid)"}
                          {item.count > 1 && `Tied (${item.count} Way Collision)`}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: BOT SIMULATION SUITE */}
        {currentTab === "simulation" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Automated Bot Simulation Engine
              </h2>
              <p className="text-xs text-slate-400">
                Configure artificial competitor behavior, stress test duplicate collisions, and monitor bot activity
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bot Controls Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" /> Simulator Behavior Config
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="font-bold text-white block">Auto Competitor Bidding</span>
                      <span className="text-[11px] text-slate-400">Periodically injects bids to simulate active traffic</span>
                    </div>
                    <button
                      onClick={() => {
                        const next = !settings.simulationEnabled;
                        setSettings({ ...settings, simulationEnabled: next });
                        notify(`Simulation ${next ? "Enabled" : "Disabled"}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                        settings.simulationEnabled
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {settings.simulationEnabled ? "ENABLED" : "DISABLED"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1.5 font-medium">Bidding Frequency / Speed</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["slow", "normal", "fast"] as const).map((spd) => (
                        <button
                          key={spd}
                          onClick={() => {
                            setSettings({ ...settings, simulationSpeed: spd });
                            notify(`Bot speed set to ${spd.toUpperCase()}`);
                          }}
                          className={`py-2 rounded-xl font-semibold uppercase text-[11px] border transition cursor-pointer ${
                            settings.simulationSpeed === spd
                              ? "bg-indigo-600 border-indigo-400 text-white shadow"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {spd}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-bold text-white block">Collision Strategy Weight</span>
                    <p className="text-[11px] text-slate-400">
                      Simulated bots intentionally target 35% duplicate collision probability against existing bids to test tie mechanics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Stress Testing Triggers */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" /> Manual Stress & Collision Injections
                </h3>
                <p className="text-xs text-slate-400">Target item: <strong className="text-white">{selectedAuction.title}</strong></p>

                <div className="space-y-3">
                  <button
                    onClick={() => handleInjectCompetitorBid()}
                    className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">Inject 1 AI Competitor Bid</span>
                      <span className="text-[10px] text-slate-400">Random realistic amount from $0.01 to $0.50</span>
                    </div>
                    <Zap className="w-4 h-4 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => handleTieWinningBid()}
                    className="w-full p-3 rounded-xl bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/40 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">Tie The Current Leader</span>
                      <span className="text-[10px] text-amber-400/80">Forces duplicate tie on current 1st place bid</span>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    onClick={() => {
                      for (let i = 0; i < 5; i++) {
                        handleInjectCompetitorBid();
                      }
                      notify("Injected burst of 5 AI bids!", "success");
                    }}
                    className="w-full p-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-600/40 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-indigo-300 block">Inject Rapid Burst (5 Bids)</span>
                      <span className="text-[10px] text-indigo-400/80">Simulates sudden auction rush</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => handleResetBids(activeAuctionId)}
                    className="w-full p-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-rose-300 block">Purge All Bids on Active Item</span>
                      <span className="text-[10px] text-rose-400/80">Clears bid list back to zero</span>
                    </div>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 6: PLATFORM & FINANCIAL SETTINGS */}
        {currentTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" /> Platform Economics & Rules Configuration
              </h2>
              <p className="text-xs text-slate-400">Configure token values, anti-sniping protection, and legal disclosures</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Token Base Pricing (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={settings.tokenPriceUsd}
                    onChange={(e) => setSettings({ ...settings, tokenPriceUsd: parseFloat(e.target.value) || 0.50 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-7 pr-3 text-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Standard cost of 1 bidding token</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Anti-Sniping Clock Extension (Seconds)</label>
                <input
                  type="number"
                  value={settings.antiSnipeAddSeconds}
                  onChange={(e) => setSettings({ ...settings, antiSnipeAddSeconds: parseInt(e.target.value) || 15 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Seconds added to the clock when a bid is submitted in final 20 seconds</p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Minimum Bid Increment</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.minBidIncrement}
                  onChange={(e) => setSettings({ ...settings, minBidIncrement: parseFloat(e.target.value) || 0.01 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Smallest denomination allowable (typically $0.01)</p>
              </div>

              <button
                onClick={() => notify("Settings successfully saved and propagated!", "success")}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Save Economics Configuration
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: CREATE NEW AUCTION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Create New Drop Auction
            </h3>
            <p className="text-xs text-slate-400 mb-4">Set up a new item for lowest unique bidding</p>

            <form onSubmit={handleCreateAuctionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPad Pro M4 13-inch"
                  value={newAuctionForm.title}
                  onChange={(e) => setNewAuctionForm({ ...newAuctionForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Subtitle / Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 512GB OLED • Space Black • Wi-Fi"
                  value={newAuctionForm.subtitle}
                  onChange={(e) => setNewAuctionForm({ ...newAuctionForm, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Retail MSRP ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newAuctionForm.retailValue}
                    onChange={(e) => setNewAuctionForm({ ...newAuctionForm, retailValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Category</label>
                  <select
                    value={newAuctionForm.category}
                    onChange={(e) => setNewAuctionForm({ ...newAuctionForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Computing">Computing</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={newAuctionForm.initialTimeMinutes}
                    onChange={(e) => setNewAuctionForm({ ...newAuctionForm, initialTimeMinutes: parseInt(e.target.value) || 5 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Entry Fee (Tokens)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newAuctionForm.entryFeeTokens}
                    onChange={(e) => setNewAuctionForm({ ...newAuctionForm, entryFeeTokens: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newAuctionForm.image}
                  onChange={(e) => setNewAuctionForm({ ...newAuctionForm, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-white text-[11px] outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Launch Drop Auction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between">
        <span>HOWLOW Administrative System • Internal Operations Only</span>
        <span className="font-mono text-[11px]">System Time: {new Date().toLocaleTimeString()}</span>
      </footer>

    </div>
  );
}

