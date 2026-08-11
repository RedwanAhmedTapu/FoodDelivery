export type Role = 'SUPER_ADMIN' | 'SHOP_OWNER' | 'CUSTOMER' | 'DELIVERY_BOY';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: { url: string | null };
  address?: string;
  isActive: boolean;
  isVerified: boolean;
  pointsBalance: number;
  totalOrders: number;
  createdAt: string;
}

export interface Store {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  logo?: { url: string | null };
  coverImage?: { url: string | null };
  phone: string;
  email: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] };
  openingTime: string;
  closingTime: string;
  deliveryRadius: number;
  minimumOrder: number;
  estimatedDeliveryTime: number;
  isActive: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  deactivationReason?:
    | 'NONE'
    | 'OWNER_DEACTIVATED'
    | 'SUBSCRIPTION_EXPIRED'
    | 'SUBSCRIPTION_REQUIRED'
    | 'ADMIN_SUSPENDED'
    | 'PENDING_APPROVAL'
    | 'REJECTED';
  subscriptionStatus?: 'NONE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED';
  subscriptionExpiresAt?: string | null;
  theme: { primaryColor: string; secondaryColor: string };
  rating: number;
  totalRatings: number;
  totalOrders: number;
}

export interface FoodCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url: string | null };
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface FoodVariant {
  _id?: string;
  name: string;
  priceModifier: number;
}

export interface FoodAddon {
  _id?: string;
  name: string;
  price: number;
}

export interface Food {
  _id: string;
  storeId: string | Store;
  ownerId: string;
  categoryId: string | FoodCategory;
  name: string;
  slug: string;
  description?: string;
  images: { url: string; publicId: string }[];
  price: number;
  discountPrice?: number | null;
  effectivePrice?: number;
  preparationTime: number;
  variants: FoodVariant[];
  addons: FoodAddon[];
  availability: boolean;
  stock: number | null;
  isFeatured: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  totalOrders: number;
}

export interface CartItem {
  _id: string;
  foodId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variant?: { name: string; priceModifier: number };
  addons: { name: string; price: number }[];
  notes?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  storeId: string | null;
  items: CartItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED_TO_DELIVERY'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export interface OrderItem {
  foodId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variant?: { name: string; priceModifier: number };
  addons: { name: string; price: number }[];
  notes?: string;
  lineTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string | User;
  storeId: string | Store;
  ownerId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointDiscount: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  deliveryAddress: string;
  deliveryLocation: { type: 'Point'; coordinates: [number, number] };
  deliveryBoyId?: string | null;
  pickupPin?: string | null;
  deliveryOtp?: string | null;
  deliveryOtpAttempts?: number;
  dispatchStatus?: 'NOT_STARTED' | 'SEARCHING' | 'ASSIGNED' | 'FAILED';
  estimatedDeliveryTime: number;
  createdAt: string;
  placedAt: string;
  acceptedAt?: string | null;
  preparedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export interface Payment {
  _id: string;
  purpose: 'ORDER' | 'SUBSCRIPTION';
  orderId?: string | null;
  subscriptionId?: string | null;
  customerId: string;
  provider: 'COD' | 'SSLCOMMERZ' | 'BKASH' | 'NAGAD' | 'STRIPE';
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  providerReference?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

export interface SubscriptionPlan {
  _id?: string;
  storeId?: string | null;
  billingCycle: BillingCycle;
  price: number | null;
  currency?: string;
  isActive?: boolean;
  isOverride?: boolean;
  label?: string | null;
}

export interface StoreSubscription {
  _id: string;
  storeId: string;
  ownerId: string;
  planId: string;
  billingCycle: BillingCycle;
  price: number;
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
}

export interface StoreStatusReason {
  code: string;
  message: string;
}

export interface StoreOwnerStatus {
  isLive: boolean;
  reasons: StoreStatusReason[];
  subscriptionStatus: 'NONE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED';
  subscriptionExpiresAt?: string | null;
}

export interface PointTransaction {
  _id: string;
  type: 'EARN' | 'REDEEM' | 'REFERRAL_BONUS' | 'ADMIN_ADJUSTMENT' | 'REFUND' | 'EXPIRED';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  customerId: { _id: string; name: string; avatar?: { url: string | null } } | string;
  orderId: string;
  storeId: string;
  foodId?: string | null;
  type: 'STORE' | 'FOOD' | 'DELIVERY';
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DeliveryBoyProfile {
  _id: string;
  userId: string;
  name: string;
  phone: string;
  profileImage?: { url: string | null; publicId?: string | null };
  vehicleType: string;
  vehicleNumber?: string | null;
  licenseInformation?: string | null;
  isOnline: boolean;
  isAvailable: boolean;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  totalDeliveries: number;
  totalEarnings: number;
  currentLocation: { coordinates: [number, number] };
}

export interface ShopOwnerDocument {
  type: string;
  url: string;
  publicId?: string;
}

export interface ShopOwnerProfile {
  _id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  profileImage?: { url: string | null; publicId?: string | null };
  documents?: ShopOwnerDocument[];
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
}

export type WalletOwnerType = 'SHOP_OWNER' | 'DELIVERY_BOY';

export interface Wallet {
  _id: string;
  ownerType: WalletOwnerType;
  ownerId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  _id: string;
  walletId: string;
  ownerType: WalletOwnerType;
  ownerId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: 'ORDER' | 'PAYOUT' | 'COD_REMITTANCE' | 'ADJUSTMENT';
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export type PayoutMethod = 'BANK' | 'BKASH' | 'NAGAD';
export type PayoutStatus = 'PENDING' | 'PAID' | 'REJECTED';

export interface PayoutRequest {
  _id: string;
  ownerType: WalletOwnerType;
  ownerId: string | { _id: string; name: string; email: string; phone?: string };
  amount: number;
  method: PayoutMethod;
  accountDetails: { accountName: string; accountNumber: string; bankName?: string | null };
  status: PayoutStatus;
  adminNote?: string | null;
  processedAt?: string | null;
  createdAt: string;
}

export type RemittanceMethod = 'CASH_HANDOVER' | 'BANK' | 'BKASH' | 'NAGAD';
export type RemittanceStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED';

export interface CodRemittance {
  _id: string;
  deliveryBoyUserId: string | { _id: string; name: string; email: string; phone?: string };
  amount: number;
  method: RemittanceMethod;
  reference?: string | null;
  status: RemittanceStatus;
  note?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ConversationParticipant {
  userId: string;
  role: string;
}

export interface Conversation {
  _id: string;
  type: 'ORDER' | 'SUPPORT';
  orderId?: string | { _id: string; orderNumber: string; orderStatus: OrderStatus } | null;
  participants: ConversationParticipant[];
  subject?: string | null;
  isClosed: boolean;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  attachments: { url: string; publicId: string }[];
  readBy: string[];
  createdAt: string;
}

export interface DispatchOffer {
  attemptId: string;
  orderId: string;
  orderNumber: string;
  storeName?: string;
  storeAddress?: string;
  deliveryAddress: string;
  distanceKm: number;
  earning: number;
  offerWindowSeconds: number;
  respondBy: string;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  success: false;
  statusCode: number;
  message: string;
  errors: string[];
}
