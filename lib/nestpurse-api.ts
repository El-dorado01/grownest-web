import { api } from "./api";

export interface LinkedAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  label: string | null;
  linkedAt: string | null;
  isPrimary: boolean;
  bankLogo?: string | null;
  bankName?: string | null;
}

export interface VirtualAccount {
  provider: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  isPrimary: boolean;
}

export interface MandateBank {
  name: string;
  code: string;
  logo?: string;
  bankLogo?: string;
}

export interface Mandate {
  id: string;
  mandateId: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  frequency: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface Provider {
  id: string;
  label: string;
  logo: string;
  color: string;
}

export interface Bank {
  name: string;
  code: string;
  slug?: string;
  logo?: string;
  country?: string;
  currency?: string;
}

export const nestPurseApi = {
  getLinkedAccounts: () => 
    api.get<{ message: string; linkedAccounts: LinkedAccount[]; total: number }>("/api/nestpurse/linked-accounts"),

  getBanks: () =>
    api.get<{ message: string; banks: Bank[] }>("/api/nestpurse/banks"),

  getProviders: () =>
    api.get<{ message: string; providers: Provider[] }>("/api/nestpurse/providers"),

  lookupAccount: (data: { bankCode: string; accountNumber: string }) =>
    api.post<{ message: string; account: { bankCode: string; accountNumber: string; accountName: string } }>("/api/nestpurse/lookup-account", data),

  linkAccount: (data: { bankCode: string; accountNumber: string; accountName: string; label?: string; status: boolean }) =>
    api.patch<{ message: string; linkedAccount: any; totalLinked: number }>("/api/nestpurse/link-account", data),

  unlinkAccount: (data: { bankCode: string; accountNumber: string }) =>
    api.delete<{ message: string; remainingLinked: number }>("/api/nestpurse/unlink-account", data),

  setPrimaryAccount: (data: { bankCode: string; accountNumber: string }) =>
    api.patch<{ message: string; primaryAccount: any }>("/api/nestpurse/linked-accounts/set-primary", data),

  getVirtualAccount: () =>
    api.get<{ 
      message: string; 
      accounts?: VirtualAccount[]; 
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      provider?: string;
      balance?: number;
    }>("/api/nestpurse/virtual-account"),


  initiateTopup: (data: { 
    amount: number; 
    paymentMethod: "card" | "bank";
    redirectUrl?: string;
    cancelUrl?: string;
  }) =>

    api.post<{ 
      message: string; 
      checkoutUrl: string; 
      orderReference: string; 
      amount: number; 
      gateway: string 
    }>("/api/nestpurse/topup", data),

  getMandateBanks: () =>
    api.get<{ status: boolean; message: string; banks: MandateBank[] }>("/api/nestpurse/mandates/banks"),

  createMandate: (data: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate: string;
    narration?: string;
    redirectUrl?: string;
    cancelUrl?: string;
  }) =>
    api.post<{ 
      message: string; 
      checkoutUrl?: string; 
      mandateId: string; 
      status: string;
      mandate: any;
    }>("/api/nestpurse/mandates", data),

  getMandates: () =>
    api.get<{ mandates: Mandate[] }>("/api/nestpurse/mandates"),

  updateMandateStatus: (id: string, status: "SUSPEND" | "ACTIVE") =>
    api.put<{ message: string; mandate: Mandate }>(`/api/nestpurse/mandates/${id}/status`, { status }),

  deleteMandate: (id: string) =>
    api.delete<{ message: string }>(`/api/nestpurse/mandates/${id}`),

  sendMoney: (data: {
    amount: number;
    pin: string;
    narration: string;
    bankDetails: {
      bankCode: string;
      accountNumber: string;
    };
    otp?: string;
  }) =>
    api.post<{ message: string; requiresOtp?: boolean; merchantTxRef?: string }>(
      "/api/nestpurse/send",
      data
    ),

  withdrawMoney: (data: {
    bankCode: string;
    accountNumber: string;
    amount: number;
    pin: string;
    narration: string;
    otp?: string;
  }) =>
    api.post<{ message: string; requiresOtp?: boolean; merchantTxRef?: string }>(
      "/api/nestpurse/withdraw",
      data
    ),

  setupPurse: (data: { linkedAccount?: { bankCode: string; accountNumber: string; label?: string } } = {}) =>
    api.post<{ message: string; accountRef: string; bankAccountNumber: string }>("/api/nestpurse/setup", data),
  
  purchaseAirtime: (data: {
    phoneNumber: string;
    network: string;
    amount: number;
    pin: string;
    usePoints?: boolean;
  }) =>
    api.post<{ message: string; reference: string }>("/api/nestpurse/airtime", data),

  getDataPlans: (telco: string) =>
    api.get<{ message: string; plans: Array<{ amount: number; plan: string }> }>(
      `/api/nestpurse/data-plans/${telco.toLowerCase()}`
    ),

  purchaseData: (data: {
    phoneNumber: string;
    network: string;
    amount: number;
    pin: string;
    plan?: string;
    usePoints?: boolean;
  }) =>
    api.post<{ message: string; reference: string }>("/api/nestpurse/data", data),

  getElectricityDiscos: () =>
    api.get<{ message: string; discos: Array<{ id: string; name: string }> }>("/api/nestpurse/electricity/discos"),

  lookupElectricity: (params: { disco: string; customerId: string }) =>
    api.get<{ message: string; name?: string; customerName?: string; customerAddress?: string; customerId?: string }>(
      `/api/nestpurse/electricity/lookup?disco=${encodeURIComponent(params.disco)}&customerId=${encodeURIComponent(params.customerId)}`
    ),

  purchaseElectricity: (data: {
    disco: string;
    amount: number;
    customerId: string;
    meterType: string;
    pin: string;
    payerName?: string;
    usePoints?: boolean;
  }) =>
    api.post<{
      message: string;
      reference: string;
      token: string | null;
      units: string | null;
      meterName: string | null;
      address: string | null;
    }>("/api/nestpurse/electricity/vend", data),

  lookupCable: (params: { cableTvType: string; customerId: string }) =>
    api.get<{ message: string; name?: string; customerName?: string; customerId?: string }>(
      `/api/nestpurse/cabletv/lookup?cableTvType=${encodeURIComponent(params.cableTvType)}&customerId=${encodeURIComponent(params.customerId)}`
    ),

  subscribeCableTv: (data: {
    cableTvType: string;
    amount: number;
    customerId: string;
    pin: string;
    payerName?: string;
    usePoints?: boolean;
  }) =>
    api.post<{ message: string; reference: string }>("/api/nestpurse/cabletv/subscribe", data),

  getTransactions: (params: {
    limit?: number;
    cursor?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    return api.get<{
      transactions: Array<{
        id: string;
        type: "credit" | "debit";
        amount: number;
        status: string;
        method: string;
        reference: string;
        date: string;
        senderName?: string;
        senderBankName?: string;
        senderAccountNumber?: string;
        narration?: string;
      }>;
      pagination: { hasMore: boolean; nextCursor?: string; limit: number };
      filters: { startDate?: string; endDate?: string };
    }>(`/api/nestpurse/transactions?${query.toString()}`);
  },

  getAirtimeTransactions: (params: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    return api.get<{
      transactions: Array<{
        id: string;
        type: "credit" | "debit";
        amount: number;
        status: string;
        method: string;
        reference: string;
        date: string;
        narration?: string;
        metadata?: any;
      }>;
      pagination: { hasMore: boolean; nextCursor?: string; limit: number };
      filters: { startDate?: string; endDate?: string };
    }>(`/api/nestpurse/transactions/airtime?${query.toString()}`);
  },

  getDataTransactions: (params: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    return api.get<{
      transactions: Array<{
        id: string;
        type: "credit" | "debit";
        amount: number;
        status: string;
        method: string;
        reference: string;
        date: string;
        narration?: string;
        metadata?: any;
      }>;
      pagination: { hasMore: boolean; nextCursor?: string; limit: number };
      filters: { startDate?: string; endDate?: string };
    }>(`/api/nestpurse/transactions/data?${query.toString()}`);
  },

  getElectricityTransactions: (params: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    return api.get<{
      transactions: Array<{
        id: string;
        type: "credit" | "debit";
        amount: number;
        status: string;
        method: string;
        reference: string;
        date: string;
        narration?: string;
        metadata?: any;
      }>;
      pagination: { hasMore: boolean; nextCursor?: string; limit: number };
      filters: { startDate?: string; endDate?: string };
    }>(`/api/nestpurse/transactions/electricity?${query.toString()}`);
  },

  getCableTvTransactions: (params: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.cursor) query.set("cursor", params.cursor);
    return api.get<{
      transactions: Array<{
        id: string;
        type: "credit" | "debit";
        amount: number;
        status: string;
        method: string;
        reference: string;
        date: string;
        narration?: string;
        metadata?: any;
      }>;
      pagination: { hasMore: boolean; nextCursor?: string; limit: number };
      filters: { startDate?: string; endDate?: string };
    }>(`/api/nestpurse/transactions/cabletv?${query.toString()}`);
  },
};


