"use client"

import * as React from "react"
import { nestPurseApi, LinkedAccount, Bank } from "@/lib/nestpurse-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Star, 
  Building2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Landmark
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import useSWR from "swr"
import { ErrorState } from "@/components/error-state"

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

export function BankCardsSettings() {
  const { data: accountsRes, error: accountsError, isLoading: accountsLoading, mutate: mutateAccounts } = useSWR(
    "linked-accounts",
    () => nestPurseApi.getLinkedAccounts()
  )

  const { data: banksRes, error: banksError, isLoading: banksLoading } = useSWR(
    "banks-list",
    () => nestPurseApi.getBanks()
  )

  const accounts = accountsRes?.data?.linkedAccounts || []
  const banks = banksRes?.data?.banks || []
  const isLoading = accountsLoading || banksLoading
  const error = !!(accountsError || banksError || accountsRes?.error || banksRes?.error)

  const [searchQuery, setSearchQuery] = React.useState("")
  const [showLinkForm, setShowLinkForm] = React.useState(false)


  // Filtered banks based on search
  const filteredBanks = React.useMemo(() => {
    if (!searchQuery) return banks
    const query = searchQuery.toLowerCase()
    return banks.filter(bank => 
      bank.name.toLowerCase().includes(query) || 
      bank.code.toLowerCase().includes(query)
    )
  }, [banks, searchQuery])

  // Link form state
  const [selectedBankCode, setSelectedBankCode] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Unlink state
  const [accountToUnlink, setAccountToUnlink] = React.useState<LinkedAccount | null>(null)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = React.useState(false)
  const [isUnlinking, setIsUnlinking] = React.useState(false)

  // Set Primary state
  const [isSettingPrimary, setIsSettingPrimary] = React.useState<string | null>(null)




  const handleLookup = async (code: string, number: string) => {
    if (number.length !== 10) return
    
    setIsVerifying(true)
    setAccountName("")
    try {
      const { data, error } = await nestPurseApi.lookupAccount({ 
        bankCode: code, 
        accountNumber: number 
      })
      if (error) {
        toast.error(error)
      } else if (data?.account) {
        setAccountName(data.account.accountName)
      }
    } catch (err) {
      toast.error("Account verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleLink = async () => {
    if (!selectedBankCode || accountNumber.length !== 10 || !accountName) return
    
    setIsSubmitting(true)
    try {
      const { data, error } = await nestPurseApi.linkAccount({
        bankCode: selectedBankCode,
        accountNumber,
        accountName,
        status: accounts.length === 0 // Make primary if first account
      })
      
      if (error) {
        toast.error(error)
      } else {
        toast.success("Account linked successfully")
        setShowLinkForm(false)
        resetForm()
        mutateAccounts()
      }
    } catch (err) {
      toast.error("Failed to link account")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSetPrimary = async (acc: LinkedAccount) => {
    const accId = `${acc.bankCode}-${acc.accountNumber}`
    setIsSettingPrimary(accId)
    try {
      const { error } = await nestPurseApi.setPrimaryAccount({
        bankCode: acc.bankCode,
        accountNumber: acc.accountNumber
      })
      if (error) {
        toast.error(error)
      } else {
        toast.success("Primary account updated")
        await mutateAccounts()
      }
    } catch (err) {
      toast.error("Failed to update primary account")
    } finally {
      setIsSettingPrimary(null)
    }
  }

  const handleUnlink = (acc: LinkedAccount) => {
    setAccountToUnlink(acc)
    setShowUnlinkConfirm(true)
  }

  const confirmUnlink = async () => {
    if (!accountToUnlink) return
    setIsUnlinking(true)
    try {
      const { error } = await nestPurseApi.unlinkAccount({
        bankCode: accountToUnlink.bankCode,
        accountNumber: accountToUnlink.accountNumber
      })
      if (error) {
        toast.error(error)
      } else {
        toast.success("Account unlinked successfully")
        mutateAccounts()
      }
    } catch (err) {
      toast.error("Failed to unlink account")
    } finally {
      setIsUnlinking(false)
      setShowUnlinkConfirm(false)
      setAccountToUnlink(null)
    }
  }

  const resetForm = () => {
    setSelectedBankCode("")
    setAccountNumber("")
    setAccountName("")
  }

  const getBankInfo = (code: string) => {
    return banks.find(b => b.code === code)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading your linked accounts...
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col py-2", showLinkForm ? "gap-0" : "gap-8")}>
      <AnimatePresence mode="wait">
        {!showLinkForm ? (
          <motion.div 
            key="main-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between min-h-[40px] gap-2"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-lg leading-none font-medium tracking-tight">Bank Accounts</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Manage your linked bank accounts for withdrawals and deposits.
              </p>
            </div>

            {!error && !isLoading && (
              <Button 
                size="default" 
                className="gap-2 shadow-lg shadow-primary/10"
                onClick={() => setShowLinkForm(true)}
              >
                <Plus className="h-4 w-4" />
                Link Account
              </Button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorState 
              onRetry={() => mutateAccounts()} 
              isRetrying={isLoading} 
            />
          </motion.div>
        ) : showLinkForm ? (
          <motion.div 
            key="link-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 rounded-full h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowLinkForm(false)
                  resetForm()
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Link Bank Account</h3>
                <p className="text-sm text-muted-foreground">Add a new bank account for withdrawals and deposits.</p>
              </div>
            </div>


            <div className="grid gap-5">
              <Field>
                <FieldLabel className="text-xs">Select Bank</FieldLabel>
                <Combobox 
                  value={banks.find(b => b.code === selectedBankCode)?.name || null} 
                  onValueChange={(val) => {
                    const bank = banks.find(b => b.name === val)
                    if (bank) {
                      setSelectedBankCode(bank.code)
                      setSearchQuery(bank.name)
                      if (accountNumber.length === 10) {
                        handleLookup(bank.code, accountNumber)
                      }
                    }
                  }}
                  inputValue={searchQuery}
                  onInputValueChange={setSearchQuery}
                >
                  <ComboboxInput 
                    placeholder="Search or select a bank..." 
                    className={cn("w-full h-11 rounded-xl", selectedBankCode && "[&_input]:pl-11")}
                  >
                    <AnimatePresence mode="wait">
                      {selectedBankCode && (
                        <motion.div
                          key={selectedBankCode}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-muted overflow-hidden border border-border/50 z-10 pointer-events-none"
                        >
                          {(() => {
                            const bank = banks.find(b => b.code === selectedBankCode)
                            return bank?.logo && bank.logo.startsWith("http") ? (
                              <Image 
                                unoptimized
                                src={bank.logo} 
                                alt="" 
                                width={24} 
                                height={24} 
                                className="h-full w-full object-contain" 
                              />
                            ) : (
                              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                            )
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ComboboxInput>
                  <ComboboxContent className="z-50">
                    <ComboboxList className="pointer-events-auto">
                      {filteredBanks.map((bank) => (
                        <ComboboxItem key={bank.code} value={bank.name} className="gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden border border-border/50">
                            {bank.logo && bank.logo.startsWith("http") ? (
                              <Image 
                                unoptimized
                                src={bank.logo} 
                                alt="" 
                                width={24} 
                                height={24} 
                                className="h-full w-full object-contain" 
                              />
                            ) : (
                              <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="truncate">{bank.name}</span>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                    <ComboboxEmpty>No banks found.</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </Field>

              <Field>
                <FieldLabel>Account Number</FieldLabel>
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="0123456789"
                    className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                    value={accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "")
                      setAccountNumber(val)
                      if (val.length === 10 && selectedBankCode) handleLookup(selectedBankCode, val)
                    }}
                  />
                  {isVerifying && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </Field>

              {accountName && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl bg-primary/10 p-4 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary opacity-70">Verified Name</span>
                      <span className="text-sm font-bold text-primary">{accountName}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-xl h-11"
                onClick={() => {
                  setShowLinkForm(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={!accountName || isSubmitting}
                onClick={handleLink}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Link
              </Button>
            </div>
          </motion.div>
        ) : accounts.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5"
          >
            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h4 className="text-base font-semibold">No bank accounts linked</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
              Link your bank account to start making withdrawals from NestPurse.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-xl gap-2"
              onClick={() => setShowLinkForm(true)}
            >
              <Plus className="h-4 w-4" />
              Link Your First Account
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="accounts-list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="grid gap-4"
          >
            {accounts.map((acc, idx) => {
              const bankInfo = getBankInfo(acc.bankCode)
              const bankLogo = bankInfo?.logo || (bankInfo?.slug ? `https://files.paystack.co/static/assets/logos/banks/nigeria/${bankInfo.slug}.png` : null)

              return (
                <div 
                  key={`${acc.bankCode}-${acc.accountNumber}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md",
                    acc.isPrimary 
                      ? "border-primary/20 bg-primary/5 ring-1 ring-primary/20" 
                      : "border-muted bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors overflow-hidden bg-white",
                        acc.isPrimary ? "border-primary/20" : "border-muted-foreground/10"
                      )}>
                        {bankLogo ? (
                          <img 
                            src={bankLogo} 
                            alt={bankInfo?.name || acc.label || "Bank Logo"} 
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "" // Trigger fallback
                              ;(e.target as HTMLImageElement).classList.add('hidden')
                            }}
                          />
                        ) : (
                          <Building2 className={cn("h-6 w-6", acc.isPrimary ? "text-primary" : "text-muted-foreground")} />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold tracking-tight">{acc.accountName}</span>
                          {acc.isPrimary && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                              Primary
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                          {bankInfo?.name || acc.label || "Verified Bank"} • {acc.accountNumber}
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!acc.isPrimary && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                          title="Set as Primary"
                          disabled={isSettingPrimary === `${acc.bankCode}-${acc.accountNumber}`}
                          onClick={() => handleSetPrimary(acc)}
                        >
                          {isSettingPrimary === `${acc.bankCode}-${acc.accountNumber}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        title="Unlink Account"
                        onClick={() => handleUnlink(acc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  {!acc.isPrimary && (
                    <div className="mt-4 flex gap-2 sm:hidden">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-lg text-xs"
                        disabled={isSettingPrimary === `${acc.bankCode}-${acc.accountNumber}`}
                        onClick={() => handleSetPrimary(acc)}
                      >
                        {isSettingPrimary === `${acc.bankCode}-${acc.accountNumber}` && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        Set Primary
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => handleUnlink(acc)}
                      >
                        Unlink
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Box */}
      <div className={cn(`rounded-2xl border border-dashed border-muted-foreground/20 p-5 bg-muted/5`, showLinkForm && "mt-5")}>
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">About Bank Accounts</p>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              You can link multiple bank accounts to your NestPurse. Primary accounts are used by default for all automated withdrawals and quick-topups.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Unlink Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{accountToUnlink?.label || accountToUnlink?.accountName}</strong> ({accountToUnlink?.accountNumber})? You can always link it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnlinking}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              disabled={isUnlinking}
              onClick={(e) => {
                e.preventDefault()
                confirmUnlink()
              }}
            >
              {isUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlink Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
