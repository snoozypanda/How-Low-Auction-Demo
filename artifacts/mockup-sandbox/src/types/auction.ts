export type BidStatus = "lowest_unique" | "unique_higher" | "duplicate";

export type AuctionStatus = "active" | "paused" | "ended" | "scheduled";

export interface BidRecord {
  id: string;
  auctionId: string;
  amount: number;
  placedAt: Date;
  status: BidStatus;
  userId: string;
  userName: string;
  isUser: boolean;
}

export interface AuctionItem {
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
  status: AuctionStatus;
  winner?: {
    userName: string;
    amount: number;
    settledAt: Date;
  } | null;
}

export interface AdminSettings {
  tokenPriceUsd: number;
  antiSnipeBufferSeconds: number;
  antiSnipeAddSeconds: number;
  minBidIncrement: number;
  simulationEnabled: boolean;
  simulationSpeed: "slow" | "normal" | "fast";
}

export const INITIAL_AUCTIONS: AuctionItem[] = [
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
    description: "The ultimate flagship smartphone. The lowest unique bid at the bell takes it home for pennies on the dollar!",
    status: "active"
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
    description: "Experience hyper-realistic gaming performance. Submit your lowest unique bid before time expires.",
    status: "active"
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
    description: "Unrivaled professional powerhouse. Outsmart other bidders by finding the lowest unchosen price.",
    status: "active"
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
    description: "Intelligent heat control for ultra-fast healthy drying. Win for as low as a couple of cents!",
    status: "active"
  }
];

export const INITIAL_BIDS: Record<string, BidRecord[]> = {
  "auc-1": [
    { id: "b1", auctionId: "auc-1", amount: 0.01, placedAt: new Date(Date.now() - 120000), status: "duplicate", userId: "u1", userName: "CryptoKing", isUser: false },
    { id: "b2", auctionId: "auc-1", amount: 0.01, placedAt: new Date(Date.now() - 110000), status: "duplicate", userId: "u2", userName: "ApexBidder", isUser: false },
    { id: "b3", auctionId: "auc-1", amount: 0.02, placedAt: new Date(Date.now() - 95000), status: "duplicate", userId: "u3", userName: "PennySniper", isUser: false },
    { id: "b4", auctionId: "auc-1", amount: 0.02, placedAt: new Date(Date.now() - 90000), status: "duplicate", userId: "u4", userName: "Shadow99", isUser: false },
    { id: "b5", auctionId: "auc-1", amount: 0.03, placedAt: new Date(Date.now() - 80000), status: "lowest_unique", userId: "u5", userName: "LuckyStrike", isUser: false },
    { id: "b6", auctionId: "auc-1", amount: 0.05, placedAt: new Date(Date.now() - 65000), status: "unique_higher", userId: "u6", userName: "NovaStar", isUser: false },
    { id: "b7", auctionId: "auc-1", amount: 0.12, placedAt: new Date(Date.now() - 40000), status: "duplicate", userId: "u7", userName: "BidMaster", isUser: false },
    { id: "b8", auctionId: "auc-1", amount: 0.12, placedAt: new Date(Date.now() - 35000), status: "duplicate", userId: "u8", userName: "GhostRider", isUser: false },
    { id: "b9", auctionId: "auc-1", amount: 0.25, placedAt: new Date(Date.now() - 20000), status: "unique_higher", userId: "u9", userName: "ZionGamer", isUser: false }
  ],
  "auc-2": [
    { id: "b201", auctionId: "auc-2", amount: 0.01, placedAt: new Date(Date.now() - 60000), status: "duplicate", userId: "u1", userName: "SonicGamer", isUser: false },
    { id: "b202", auctionId: "auc-2", amount: 0.01, placedAt: new Date(Date.now() - 55000), status: "duplicate", userId: "u4", userName: "DualSensePro", isUser: false },
    { id: "b203", auctionId: "auc-2", amount: 0.04, placedAt: new Date(Date.now() - 40000), status: "lowest_unique", userId: "u8", userName: "Kratos99", isUser: false }
  ]
};

