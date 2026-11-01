import React, { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  Flame, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  HelpCircle, 
  Coins, 
  Sparkles, 
  AlertCircle, 
  XCircle, 
  TrendingDown, 
  Users, 
  RefreshCw,
  Lock,
  Unlock,
  ShieldAlert,
  Sliders,
  Eye,
  EyeOff,
  BarChart3,
  Play,
  Pause,
  Trash2,
  CheckCircle2
} from "lucide-react";

interface BidRecord {
  id: string;
  auctionId: string;
  amount: number;
  placedAt: Date;
  status: "lowest_unique" | "unique_higher" | "duplicate";
  userId: string;
  userName: string;
  isUser: boolean;
}

interface AuctionItem {
  id: string;
  title: string;
  subtitle: string;
  retailValue: number;
  category: string;
  image: string;
  initialTimeSeconds: number;
  entryFeeTokens: number;
  totalBidsCount: number;
  description: string;
}

const SAMPLE_AUCTIONS: AuctionItem[] = [
  {
    id: "auc-1",
    title: "Apple iPhone 16 Pro Max 256GB",
    subtitle: "Titanium Desert • A18 Pro Chip • Super Retina XDR",
    retailValue: 1199,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    initialTimeSeconds: 145,
    entryFeeTokens: 1,
    totalBidsCount: 342,
    description: "The ultimate flagship smartphone. The lowest unique bid at the bell takes it home for pennies on the dollar!"
  },
  {
    id: "auc-2",
    title: "Sony PlayStation 5 Pro Console",
    subtitle: "2TB SSD • Advanced Ray Tracing • DualSense Controller",
    retailValue: 699,
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80",
    initialTimeSeconds: 260,
    entryFeeTokens: 1,
    totalBidsCount: 218,
    description: "Experience hyper-realistic gaming performance. Submit your lowest unique bid before time expires."
  },
  {
    id: "auc-3",
    title: "MacBook Pro 14\" M3 Max",
    subtitle: "36GB Unified Memory • 1TB SSD • Liquid Retina XDR",
    retailValue: 3199,
    category: "Computing",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    initialTimeSeconds: 410,
    entryFeeTokens: 2,
    totalBidsCount: 512,
    description: "Unrivaled professional powerhouse. Outsmart other bidders by finding the lowest unchosen price."
  },
  {
    id: "auc-4",
    title: "Dyson Supersonic Nural Hair Dryer",
    subtitle: "Strawberry Bronze • Auto Nural Sensor • Scalp Protect Mode",
    retailValue: 499,
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    initialTimeSeconds: 180,
    entryFeeTokens: 1,
    totalBidsCount: 164,
    description: "Intelligent heat control for ultra-fast healthy drying. Win for as low as a couple of cents!"
  }
];

// Seeded bids
const INITIAL_BIDS: Record<string, BidRecord[]> = {
  "auc-1": [
    { id: "b1", auctionId: "auc-1", amount: 0.01, placedAt: new Date(Date.now() - 120000), status: "duplicate", userId: "u1", userName: "CryptoKing", isUser: false },
    { id: "b2", auctionId: "auc-1", amount: 0.01, placedAt: new Date(Date.now() - 110000), status: "duplicate", userId: "u2", userName: "ApexBidder", isUser: false },
    { id: "b3", auctionId: "auc-1", amount: 0.02, placedAt: new Date(Date.now() - 95000), status: "duplicate", userId: "u3", userName: "PennySniper", isUser: false },
    { id: "b4", auctionId: "auc-1", amount: 0.02, placedAt: new Date(Date.now() - 90000), status: "duplicate", userId: "u4", userName: "Shadow99", isUser: false },
    { id: "b5", auctionId: "auc-1", amount: 0.03, placedAt: new Date(Date.now() - 80000), status: "lowest_unique", userId: "u5", userName: "LuckyStrike", isUser: false },
    { id: "b6", auctionId: "auc-1", amount: 0.05, placedAt: new Date(Date.now() - 65000), status: "unique_higher", userId: "u6", userName: "NovaStar", isUser: false },
    { id: "b7", auctionId: "auc-1", amount: 0.12, placedAt: new Date(Date.now() - 40000), status: "duplicate", userId: "u7", userName: "BidMaster", isUser: false },
    { id: "b8", auctionId: "auc-1", amount: 0.12, placedAt: new Date(Date.now() - 35000), status: "duplicate", userId: "u8", userName: "GhostRider", isUser: false },
    { id: "b9", auctionId: "auc-1", amount: 0.25, placedAt: new Date(Date.now() - 20000), status: "unique_higher", userId: "u9", userName: "ZionGamer", isUser: false },
  ]
};

export default function HowLowAuction() {
  const [activeAuctionId, setActiveAuctionId] = useState<string>("auc-1");
  const [bidsByAuction, setBidsByAuction] = useState<Record<string, BidRecord[]>>(INITIAL_BIDS);
  const [userTokens, setUserTokens] = useState<number>(45);
  const [bidAmountInput, setBidAmountInput] = useState<string>("");
  const [simulatedLiveBids, setSimulatedLiveBids] = useState<boolean>(true);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  
  // ROLE VIEW STATE: False = Regular Bidder, True = Admin Panel
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<"feed" | "distribution" | "controls">("feed");
  const [adminFilter, setAdminFilter] = useState<"all" | "unique" | "duplicates" | "user">("all");
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  const [toastNotification, setToastNotification] = useState<{
    type: "success" | "warning" | "info" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Timers for each auction
  const [auctionTimes, setAuctionTimes] = useState<Record<string, number>>({
    "auc-1": 182,
    "auc-2": 295,
    "auc-3": 440,
    "auc-4": 150
  });

  const activeAuction = useMemo(() => {
    return SAMPLE_AUCTIONS.find((a) => a.id === activeAuctionId) || SAMPLE_AUCTIONS[0];
  }, [activeAuctionId]);

  // Recalculate bid statuses for the active auction
  const currentBids = useMemo(() => {
    const bids = bidsByAuction[activeAuctionId] || [];
    const counts: Record<number, number> = {};
    for (const b of bids) {
      counts[b.amount] = (counts[b.amount] || 0) + 1;
    }

    const uniqueAmounts = Object.keys(counts)
      .map(Number)
      .filter((amt) => counts[amt] === 1)
      .sort((a, b) => a - b);

    const lowestUnique = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

    return bids.map((b) => {
      let status: "lowest_unique" | "unique_higher" | "duplicate" = "duplicate";
      if (counts[b.amount] === 1) {
        if (b.amount === lowestUnique) {
          status = "lowest_unique";
        } else {
          status = "unique_higher";
        }
      } else {
        status = "duplicate";
      }
      return { ...b, status };
    });
  }, [bidsByAuction, activeAuctionId]);

  // Current winning bid info
  const winningBid = useMemo(() => {
    return currentBids.find((b) => b.status === "lowest_unique") || null;
  }, [currentBids]);

  // Filter user's personal bids
  const userBids = useMemo(() => {
    return currentBids.filter((b) => b.isUser).sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
  }, [currentBids]);

  // Does current user hold the winning bid?
  const userHoldsWinningBid = useMemo(() => {
    return winningBid?.isUser ?? false;
  }, [winningBid]);

  // Bid distribution map for Admin
  const bidDistribution = useMemo(() => {
    const counts: Record<number, { count: number; users: string[]; hasUser: boolean }> = {};
    for (const b of currentBids) {
      if (!counts[b.amount]) {
        counts[b.amount] = { count: 0, users: [], hasUser: false };
      }
      counts[b.amount].count += 1;
      counts[b.amount].users.push(b.userName);
      if (b.isUser) counts[b.amount].hasUser = true;
    }
    return Object.entries(counts)
      .map(([amtStr, data]) => ({
        amount: Number(amtStr),
        count: data.count,
        users: data.users,
        hasUser: data.hasUser,
        isLowestUnique: winningBid?.amount === Number(amtStr)
      }))
      .sort((a, b) => a.amount - b.amount);
  }, [currentBids, winningBid]);

  // Timer countdown hook
  useEffect(() => {
    if (isTimerPaused) return;

    const timer = setInterval(() => {
      setAuctionTimes((prev) => {
        const next = { ...prev };
        for (const k in next) {
          if (next[k] > 0) {
            next[k] -= 1;
          } else {
            next[k] = 300;
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerPaused]);

  // Simulated live competitor bids hook
  useEffect(() => {
    if (!simulatedLiveBids || isTimerPaused) return;

    const interval = setInterval(() => {
      const randomAuc = SAMPLE_AUCTIONS[Math.floor(Math.random() * SAMPLE_AUCTIONS.length)].id;
      const competitorNames = ["PixelAce", "VortexX", "NeonRider", "SwiftFox", "Quantum007", "StealthyBid", "AlphaDog", "SilentWinner"];
      const randomName = competitorNames[Math.floor(Math.random() * competitorNames.length)];
      
      const existingBids = bidsByAuction[randomAuc] || [];
      let newAmt: number;

      if (existingBids.length > 0 && Math.random() < 0.35) {
        const target = existingBids[Math.floor(Math.random() * existingBids.length)];
        newAmt = target.amount;
      } else {
        newAmt = Math.round((Math.random() * 0.95 + 0.01) * 100) / 100;
      }

      const newBid: BidRecord = {
        id: "sim-" + Date.now() + "-" + Math.random(),
        auctionId: randomAuc,
        amount: newAmt,
        placedAt: new Date(),
        status: "unique_higher",
        userId: "sim-" + Math.random(),
        userName: randomName,
        isUser: false
      };

      setBidsByAuction((prev) => ({
        ...prev,
        [randomAuc]: [newBid, ...(prev[randomAuc] || [])]
      }));

      setAuctionTimes((prev) => {
        if (prev[randomAuc] < 20) {
          return { ...prev, [randomAuc]: prev[randomAuc] + 15 };
        }
        return prev;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [simulatedLiveBids, bidsByAuction, isTimerPaused]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlaceBid = (customAmount?: number) => {
    const amountToBid = customAmount !== undefined ? customAmount : parseFloat(bidAmountInput);

    if (isNaN(amountToBid) || amountToBid <= 0) {
      showToast("error", "Invalid Bid Amount", "Please enter a positive dollar value (e.g., $0.27).");
      return;
    }

    if (userTokens < activeAuction.entryFeeTokens) {
      showToast("warning", "Insufficient Tokens", "You don't have enough tokens. Click '+ Tokens' to replenish!");
      return;
    }

    const roundedAmount = Math.round(amountToBid * 100) / 100;

    setUserTokens((prev) => prev - activeAuction.entryFeeTokens);

    const userBid: BidRecord = {
      id: "ubid-" + Date.now(),
      auctionId: activeAuctionId,
      amount: roundedAmount,
      placedAt: new Date(),
      status: "lowest_unique",
      userId: "user-current",
      userName: "You (Bidder)",
      isUser: true
    };

    const updatedBids = [userBid, ...(bidsByAuction[activeAuctionId] || [])];

    const counts: Record<number, number> = {};
    for (const b of updatedBids) {
      counts[b.amount] = (counts[b.amount] || 0) + 1;
    }
    const uniqueAmounts = Object.keys(counts)
      .map(Number)
      .filter((amt) => counts[amt] === 1)
      .sort((a, b) => a - b);
    const newLowest = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

    if (counts[roundedAmount] > 1) {
      showToast(
        "warning",
        "Duplicate Bid Placed!",
        `Someone already bid $${roundedAmount.toFixed(2)}. This bid is tied and currently inactive.`
      );
    } else if (roundedAmount === newLowest) {
      showToast(
        "success",
        "🏆 You are in First Place!",
        `$${roundedAmount.toFixed(2)} is now the LOWEST UNIQUE bid! If the timer ends now, you win!`
      );
    } else {
      showToast(
        "info",
        "Unique Bid Placed",
        `$${roundedAmount.toFixed(2)} is unique, but another unique bid is currently lower.`
      );
    }

    setBidsByAuction((prev) => ({
      ...prev,
      [activeAuctionId]: updatedBids
    }));

    setBidAmountInput("");
  };

  const showToast = (type: "success" | "warning" | "info" | "error", title: string, message: string) => {
    setToastNotification({ type, title, message });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  // Admin action triggers
  const triggerSimulatedCompetitorBid = () => {
    const competitorNames = ["StealthySniper", "NightHawk", "DeltaForce", "TitanTrader", "ZeroDay"];
    const randomName = competitorNames[Math.floor(Math.random() * competitorNames.length)];
    const newAmt = Math.round((Math.random() * 0.50 + 0.01) * 100) / 100;

    const newBid: BidRecord = {
      id: "admin-sim-" + Date.now(),
      auctionId: activeAuctionId,
      amount: newAmt,
      placedAt: new Date(),
      status: "unique_higher",
      userId: "sim-admin-" + Math.random(),
      userName: randomName,
      isUser: false
    };

    setBidsByAuction((prev) => ({
      ...prev,
      [activeAuctionId]: [newBid, ...(prev[activeAuctionId] || [])]
    }));
    showToast("info", "Admin Action", `Simulated competitor bid of $${newAmt.toFixed(2)} injected.`);
  };

  const triggerTieOnWinningBid = () => {
    if (!winningBid) {
      showToast("warning", "No Winning Bid", "Cannot tie because there is currently no unique bid.");
      return;
    }
    const targetAmt = winningBid.amount;
    const tieBid: BidRecord = {
      id: "admin-tie-" + Date.now(),
      auctionId: activeAuctionId,
      amount: targetAmt,
      placedAt: new Date(),
      status: "duplicate",
      userId: "sim-tie-" + Math.random(),
      userName: "TieBot9000",
      isUser: false
    };
    setBidsByAuction((prev) => ({
      ...prev,
      [activeAuctionId]: [tieBid, ...(prev[activeAuctionId] || [])]
    }));
    showToast("warning", "Admin Tie Injected", `Tied winning bid of $${targetAmt.toFixed(2)}. It is now duplicated!`);
  };

  const resetAuctionBids = () => {
    setBidsByAuction((prev) => ({
      ...prev,
      [activeAuctionId]: []
    }));
    showToast("info", "Auction Reset", "All bids cleared for this item.");
  };

  const quickBids = [0.04, 0.09, 0.17, 0.33, 0.75, 1.05];

  // Filtered bids for Admin tab
  const filteredAdminBids = useMemo(() => {
    if (adminFilter === "all") return currentBids;
    if (adminFilter === "unique") return currentBids.filter((b) => b.status === "lowest_unique" || b.status === "unique_higher");
    if (adminFilter === "duplicates") return currentBids.filter((b) => b.status === "duplicate");
    if (adminFilter === "user") return currentBids.filter((b) => b.isUser);
    return currentBids;
  }, [currentBids, adminFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-xl shadow-2xl backdrop-blur-md border flex items-start gap-3 ${
            toastNotification.type === "success" 
              ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
              : toastNotification.type === "warning"
              ? "bg-amber-950/90 border-amber-500/50 text-amber-200"
              : toastNotification.type === "error"
              ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
              : "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
          }`}>
            {toastNotification.type === "success" && <Trophy className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toastNotification.type === "warning" && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {toastNotification.type === "error" && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
            {toastNotification.type === "info" && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold text-sm">{toastNotification.title}</p>
              <p className="text-xs opacity-90 mt-0.5">{toastNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Mode Warning Banner (Visible only when in Admin view) */}
      {isAdminView && (
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 border-b border-indigo-500/40 px-4 py-2 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-indigo-200 font-semibold max-w-4xl mx-auto w-full">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>ADMIN PANEL ACTIVE:</strong> You are viewing unmasked competitor bids, live feed audit logs, and distribution heatmaps. Regular users cannot see this data.
            </span>
          </div>
          <button
            onClick={() => setIsAdminView(false)}
            className="text-[11px] bg-indigo-800 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded border border-indigo-400/40 shrink-0 cursor-pointer"
          >
            Exit to User View
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingDown className="w-6 h-6 text-slate-950 font-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-wider text-white">HOW<span className="text-emerald-400">LOW</span></span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Lowest Unique Bid Auction</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">How It Works</span>
            </button>

            {/* Token Balance */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/70 px-3.5 py-1.5 rounded-xl shadow-inner">
              <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
              <div className="text-right">
                <span className="text-sm font-bold text-white tracking-wide">{userTokens}</span>
                <span className="text-[10px] text-slate-400 ml-1">Tokens</span>
              </div>
              <button 
                onClick={() => {
                  setUserTokens((prev) => prev + 25);
                  showToast("success", "Tokens Added!", "Loaded 25 test tokens into your bidding wallet.");
                }}
                className="ml-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-2 py-0.5 rounded shadow transition cursor-pointer"
                title="Add 25 test tokens"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Auction Tabs Carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Active Auctions ({SAMPLE_AUCTIONS.length})
            </h2>
            <span className="text-xs text-slate-400">
              {isAdminView ? "Admin inspection enabled" : "Select an auction to bid"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SAMPLE_AUCTIONS.map((auc) => {
              const isSelected = auc.id === activeAuctionId;
              const timeLeft = auctionTimes[auc.id] || 0;
              return (
                <button
                  key={auc.id}
                  onClick={() => setActiveAuctionId(auc.id)}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 overflow-hidden group cursor-pointer ${
                    isSelected
                      ? "bg-slate-900/90 border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-xl shadow-emerald-500/10"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-3xl flex items-start justify-end p-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={auc.image} 
                      alt={auc.title} 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/50" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">{auc.title}</p>
                      <p className="text-[11px] text-emerald-400 font-bold">${auc.retailValue} MSRP</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400" /> {formatTimer(timeLeft)}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {bidsByAuction[auc.id]?.length || 0} bids
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Active Auction Arena */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Product Showcase & Either User View or Admin Live Feed (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Product Card */}
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {/* Category & Timer Badges */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {activeAuction.category}
                </span>
                
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full font-mono text-sm shadow-inner">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-300">
                    {formatTimer(auctionTimes[activeAuctionId] || 0)}
                  </span>
                  <span className="text-[10px] text-slate-500">remaining</span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {activeAuction.title}
              </h1>
              <p className="text-sm text-slate-400 mb-6">
                {activeAuction.subtitle}
              </p>

              {/* Product Visual & Status Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 aspect-video sm:aspect-square flex items-center justify-center">
                  <img
                    src={activeAuction.image}
                    alt={activeAuction.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-xs text-slate-300">
                    Retail: <span className="font-bold text-white line-through">${activeAuction.retailValue}</span>
                  </div>
                </div>

                {/* Auction State Card: Dynamic based on User vs Admin View */}
                <div className="space-y-4">
                  <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400" /> 
                        {isAdminView ? "Current Winning Bid (Admin View)" : "Winning Bid Status"}
                      </span>
                      {isAdminView ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded border border-amber-500/30">
                          UNMASKED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> SEALED
                        </span>
                      )}
                    </p>
                    
                    {/* IN ADMIN VIEW: Admin sees the exact winning amount and holder */}
                    {isAdminView ? (
                      winningBid ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-emerald-400 tracking-tight font-mono">
                              ${winningBid.amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-emerald-500/90 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                              Lowest & Unique
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                            Bidder: <span className="font-semibold text-slate-200">{winningBid.userName}</span>
                            {winningBid.isUser && <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 rounded">YOU!</span>}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-2xl font-bold text-amber-400">No Unique Bid Yet</p>
                          <p className="text-xs text-slate-400 mt-1">All current bids are duplicate tied.</p>
                        </div>
                      )
                    ) : (
                      /* IN REGULAR USER VIEW: Exact amounts and other users are sealed! */
                      userHoldsWinningBid ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                              ${winningBid?.amount.toFixed(2)}
                            </span>
                            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                              🏆 YOU ARE IN 1ST PLACE!
                            </span>
                          </div>
                          <p className="text-xs text-emerald-300/90 mt-2">
                            Your secret bid is currently the <strong>Lowest Unique</strong> bid!
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-2xl font-black text-slate-300 font-mono tracking-widest bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                              <Lock className="w-4 h-4 text-amber-400" /> $ • • . • •
                            </div>
                            <span className="text-[11px] text-amber-400/90 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              Active Leader Exists
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            A lowest unique bid has been placed by a competitor. Place your secret bid to claim 1st place!
                          </p>
                        </div>
                      )
                    )}

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Total Bids Placed</span>
                        <span className="font-bold text-slate-200 font-mono text-sm">
                          {currentBids.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cost per Bid</span>
                        <span className="font-bold text-amber-400 font-mono text-sm">
                          {activeAuction.entryFeeTokens} Token (${(activeAuction.entryFeeTokens * 0.50).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Tip for User vs Admin Note */}
                  {!isAdminView ? (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Blind Bidding Rule:</strong> Exact competitor bids are sealed from bidders to prevent unfair sniping. Only your own bids are revealed to you!
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Admin Live Feed Mode:</strong> You can inspect all participant bids, test duplicate collisions, or control the clock below.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LOWER LEFT SECTION: Live Feed & Audit Management Panel (Visible in Admin View) */}
            {isAdminView && (
              /* ADMIN PANEL: FULL LIVE FEED, UNMASKED BIDS, AND DISTRIBUTION */
              <div className="bg-slate-900/90 border-2 border-indigo-500/50 rounded-3xl p-6 shadow-2xl relative">
                
                {/* Admin Header with Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-white">Admin Live Feed & Audit Panel</h3>
                    </div>
                    <p className="text-xs text-slate-400">Restricted view: all secret amounts unmasked for inspection</p>
                  </div>

                  {/* Admin Subtabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setAdminTab("feed")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                        adminTab === "feed" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Live Feed ({currentBids.length})
                    </button>
                    <button
                      onClick={() => setAdminTab("distribution")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                        adminTab === "distribution" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Heatmap / Duplicates
                    </button>
                    <button
                      onClick={() => setAdminTab("controls")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                        adminTab === "controls" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Controls
                    </button>
                  </div>
                </div>

                {/* TAB 1: UNMASKED LIVE FEED */}
                {adminTab === "feed" && (
                  <div className="space-y-3">
                    {/* Filters */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <button
                        onClick={() => setAdminFilter("all")}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          adminFilter === "all" ? "bg-slate-800 border-indigo-400 text-white" : "border-slate-800 text-slate-400"
                        }`}
                      >
                        All Bids ({currentBids.length})
                      </button>
                      <button
                        onClick={() => setAdminFilter("unique")}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          adminFilter === "unique" ? "bg-slate-800 border-emerald-400 text-emerald-300" : "border-slate-800 text-slate-400"
                        }`}
                      >
                        Unique Bids ({currentBids.filter(b => b.status !== "duplicate").length})
                      </button>
                      <button
                        onClick={() => setAdminFilter("duplicates")}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          adminFilter === "duplicates" ? "bg-slate-800 border-rose-400 text-rose-300" : "border-slate-800 text-slate-400"
                        }`}
                      >
                        Duplicates ({currentBids.filter(b => b.status === "duplicate").length})
                      </button>
                      <button
                        onClick={() => setAdminFilter("user")}
                        className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                          adminFilter === "user" ? "bg-slate-800 border-amber-400 text-amber-300" : "border-slate-800 text-slate-400"
                        }`}
                      >
                        You ({userBids.length})
                      </button>
                    </div>

                    {/* Table of Unmasked Bids */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {filteredAdminBids.map((bid) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                            bid.status === "lowest_unique"
                              ? "bg-emerald-950/70 border-emerald-500/70 shadow-lg shadow-emerald-500/10"
                              : bid.status === "duplicate"
                              ? "bg-slate-950/70 border-rose-900/40"
                              : "bg-slate-950/70 border-amber-900/40"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-white text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              ${bid.amount.toFixed(2)}
                            </span>
                            <div>
                              <span className={`font-semibold ${bid.isUser ? "text-emerald-300" : "text-slate-300"}`}>
                                {bid.userName}
                              </span>
                              <span className="text-[10px] text-slate-500 ml-2 font-mono">
                                {bid.placedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              bid.status === "lowest_unique"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : bid.status === "unique_higher"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {bid.status === "lowest_unique" && "👑 LOWEST UNIQUE"}
                              {bid.status === "unique_higher" && "Unique (Outbid)"}
                              {bid.status === "duplicate" && "Duplicate Tied"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: BID DISTRIBUTION & HEATMAP */}
                {adminTab === "distribution" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Collisions per price point. Single-occurrence amounts are valid candidates for the win.
                    </p>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {bidDistribution.map((item) => (
                        <div
                          key={item.amount}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                            item.isLowestUnique
                              ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                              : item.count === 1
                              ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
                              : "bg-slate-950/60 border-slate-800 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white text-sm w-16">
                              ${item.amount.toFixed(2)}
                            </span>
                            <span className="text-[11px] opacity-80">
                              {item.users.join(", ")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isLowestUnique
                                ? "bg-emerald-500 text-slate-950"
                                : item.count === 1
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            }`}>
                              {item.count} {item.count === 1 ? "bid (Unique)" : "bids (Tied)"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: ADMIN CONTROLS */}
                {adminTab === "controls" && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Interactive tools to simulate traffic, tie bids, or manipulate the auction state.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={triggerSimulatedCompetitorBid}
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-cyan-400 mb-1" />
                        <span className="text-xs font-bold text-white block">Inject Competitor Bid</span>
                        <span className="text-[10px] text-slate-400">Inserts random AI bid</span>
                      </button>

                      <button
                        onClick={triggerTieOnWinningBid}
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
                        <span className="text-xs font-bold text-white block">Tie Winning Bid</span>
                        <span className="text-[10px] text-slate-400">Forces duplicate on leader</span>
                      </button>

                      <button
                        onClick={() => {
                          setAuctionTimes((prev) => ({
                            ...prev,
                            [activeAuctionId]: (prev[activeAuctionId] || 0) + 60
                          }));
                          showToast("info", "Clock Extended", "+60 seconds added to active item.");
                        }}
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-emerald-400 mb-1" />
                        <span className="text-xs font-bold text-white block">+60s Timer Extension</span>
                        <span className="text-[10px] text-slate-400">Adds time to clock</span>
                      </button>

                      <button
                        onClick={() => setIsTimerPaused(!isTimerPaused)}
                        className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                      >
                        {isTimerPaused ? <Play className="w-4 h-4 text-emerald-400 mb-1" /> : <Pause className="w-4 h-4 text-amber-400 mb-1" />}
                        <span className="text-xs font-bold text-white block">{isTimerPaused ? "Resume Timer" : "Pause Timer"}</span>
                        <span className="text-[10px] text-slate-400">{isTimerPaused ? "Timer is paused" : "Freeze countdown"}</span>
                      </button>
                    </div>

                    <button
                      onClick={resetAuctionBids}
                      className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Reset / Clear All Bids for this Auction
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Right Column: Interactive Bidding Console & User's Dashboard (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* The Bidding Console Box */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Place Your Secret Bid
                </h2>
                <span className="text-xs text-slate-400">
                  Fee: <strong className="text-amber-400">{activeAuction.entryFeeTokens} Token</strong>
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Bid Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 0.47"
                      value={bidAmountInput}
                      onChange={(e) => setBidAmountInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePlaceBid();
                      }}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl py-3.5 pl-9 pr-4 text-xl font-mono font-bold text-white outline-none transition"
                    />
                  </div>
                </div>

                {/* Quick Bid Chips */}
                <div>
                  <span className="text-[11px] text-slate-400 mb-1.5 block">Quick Target Picks:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {quickBids.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handlePlaceBid(amt)}
                        className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white font-mono text-xs font-semibold py-2 px-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        ${amt.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Bid Button */}
                <button
                  onClick={() => handlePlaceBid()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-base tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-slate-950 stroke-none" />
                  CONFIRM & PLACE SECRET BID
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  Protected by blind auction protocol. Only you see your bids.
                </p>
              </div>
            </div>

            {/* User's Bids for this Auction (Always accessible to the user) */}
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Your Private Bids ({userBids.length})
                </h3>
                <span className="text-[11px] text-slate-400">Active auction only</span>
              </div>

              {userBids.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                  <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-400">You haven't placed any secret bids on this item yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Pick an unconventional fraction and claim 1st place!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {userBids.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                        b.status === "lowest_unique"
                          ? "bg-emerald-950/60 border-emerald-500/70 shadow-lg shadow-emerald-500/10"
                          : b.status === "unique_higher"
                          ? "bg-slate-950/70 border-amber-500/30"
                          : "bg-slate-950/70 border-rose-500/30"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-white">
                            ${b.amount.toFixed(2)}
                          </span>
                          {b.status === "lowest_unique" && (
                            <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Trophy className="w-3 h-3" /> 1ST PLACE
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Placed at {b.placedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`text-[11px] font-bold block ${
                          b.status === "lowest_unique"
                            ? "text-emerald-400"
                            : b.status === "unique_higher"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}>
                          {b.status === "lowest_unique" && "Lowest & Unique"}
                          {b.status === "unique_higher" && "Unique (Higher)"}
                          {b.status === "duplicate" && "Tied with another bidder"}
                        </span>
                        
                        {b.status === "duplicate" && (
                          <button
                            onClick={() => handlePlaceBid(Math.round((b.amount + 0.01) * 100) / 100)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline mt-0.5 cursor-pointer"
                          >
                            Bid ${(b.amount + 0.01).toFixed(2)} instead?
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-500 block mb-1">Your Token Wallet</span>
                <span className="text-xl font-bold font-mono text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" /> {userTokens}
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
                <span className="text-[11px] text-slate-500 block mb-1">Your Status</span>
                <span className="text-xl font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                  {userHoldsWinningBid ? "1ST PLACE" : userBids.length > 0 ? "OUTBID" : "NO BIDS"}
                </span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* How It Works Modal Dialog */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">How The Lowest Unique Bid Works</h3>
                <p className="text-xs text-slate-400">A game of strategy, psychology, and probability</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-white block mb-0.5">Secret Bids Only</strong>
                  You can bid any cent amount (e.g., $0.07, $0.23, $1.42). To protect fair play, competitor amounts are hidden from the public.
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-white block mb-0.5">The "Unique" Rule</strong>
                  If two or more people bid the exact same amount (e.g. two people bid $0.05), that amount is <strong>disqualified</strong> as a duplicate!
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-white block mb-0.5">The "Lowest" Rule</strong>
                  Out of all the bids that are strictly unique (only 1 person bid it), the person with the <strong>lowest</strong> dollar amount wins the item!
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
                <div>
                  <strong className="text-white block mb-0.5">Claim Your Prize</strong>
                  When the countdown reaches 00:00, the winner buys the brand-new item for their winning bid price (e.g. a $1,200 iPhone for $0.03)!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition cursor-pointer"
            >
              Got it, let's play!
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>How Low Auction Demo • Lowest Unique Bid Engine • Powered by Vite, React & TailwindCSS</p>
      </footer>
    </div>
  );
}
