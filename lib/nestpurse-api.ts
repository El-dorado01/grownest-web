import { api } from "./api";

export interface LinkedAccount {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  label: string | null;
  linkedAt: string | null;
  isPrimary: boolean;
}

export interface VirtualAccount {
  provider: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: string;
  isPrimary: boolean;
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
};
