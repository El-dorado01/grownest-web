"use client"

import * as React from "react"
import { 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  ScrollText, 
  ChevronRight,
  LifeBuoy,
  Mail,
  Phone,
  Globe,
  Search
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { ContactSupportDialog } from "@/components/support/contact-support-dialog"

export function SupportSettings() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showContactSupport, setShowContactSupport] = React.useState(false)
  const [activeFaq, setActiveFaq] = React.useState<string>("item-0")

  const faqs = [
    {
      question: "What is NestPurse and how does it work?",
      answer: "NestPurse is your digital wallet on GrowNest. It allows you to hold funds, send and receive money, and make payments within the ecosystem. You need to set up a transaction PIN to secure your funds before you can perform any transaction."
    },
    {
      question: "How do I verify my account?",
      answer: "Account verification is mandatory for security. You'll need to verify your email, phone number, and provide a valid ID through our onboarding flow. Once verified, your transaction limits will be increased."
    },
    {
      question: "What are NestEggs?",
      answer: "NestEggs are our savings products. You can create 'My Eggs' for personal goals or 'Group Nest' to save collectively with friends and family. Each egg can have its own target and maturity date."
    },
    {
      question: "How do I secure my transactions?",
      answer: "Go to Settings > Security to set up your NestPurse PIN. This PIN will be required for all outgoing transactions, including withdrawals and transfers."
    },
    {
      question: "What is the NestMarket?",
      answer: "NestMarket is our integrated marketplace where you can shop for groceries and essentials. You can create 'Market Baskets' and even chat with vendors directly in the app."
    },
    {
      question: "How long do withdrawals take?",
      answer: "Withdrawals to your linked bank account are usually processed instantly. In some cases, it may take up to 24 hours depending on bank processing times."
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Search Section */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Search for answers, guides, and more..." 
          className="pl-12 h-12 rounded-xl border-muted/60 bg-background focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-2 border-y border-foreground border-dashed py-6">
        <button
          onClick={() => window.open("#", "_blank")}
          className="flex items-center gap-4 p-3 rounded-xl border border-muted/60 bg-background hover:bg-muted/50 transition-all group w-full text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold leading-none">Help Centre</h4>
            <p className="text-xs text-muted-foreground mt-1 truncate">Guides and tutorials for every GrowNest feature.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => setShowContactSupport(true)}
          className="flex items-center gap-4 p-3 rounded-xl border border-muted/60 bg-background hover:bg-muted/50 transition-all group w-full text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold leading-none">Send Feedback</h4>
            <p className="text-xs text-muted-foreground mt-1 truncate">Tell us how we can improve your experience.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          className="flex items-center gap-4 p-3 rounded-xl border border-muted/60 bg-background hover:bg-muted/50 transition-all group w-full text-left"
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold leading-none">Community</h4>
            <p className="text-xs text-muted-foreground mt-1 truncate">Join the GrowNest family on social media.</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* FAQs Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xl font-bold tracking-tight">FAQs</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Quick answers to the most common questions. Can&apos;t find what you&apos;re looking for? Reach out to our support team.
          </p>
          <div className="pt-2 space-y-3">
            <button 
              onClick={() => setShowContactSupport(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-muted/60 hover:bg-muted/50 transition-colors text-left"
            >
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                <p className="text-xs font-semibold">support@grownest.africa</p>
              </div>
            </button>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-muted/60">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone</p>
                <p className="text-xs font-semibold">+234 (0) 705 329 0027</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="lg:col-span-2 border-muted/60 shadow-none bg-background rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Accordion 
              type="single" 
              collapsible 
              value={activeFaq}
              onValueChange={setActiveFaq}
              className="w-full"
            >
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="px-5 border-b last:border-b-0 hover:bg-accent/20 transition-colors">
                    <AccordionTrigger className="text-left py-4 hover:no-underline font-semibold text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-xs text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found.</p>
                </div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Legal Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">Terms & Privacy</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Terms of Service", icon: <FileText className="h-4 w-4 text-orange-500" />, bg: "bg-orange-500/10" },
            { title: "Privacy Policy", icon: <ShieldCheck className="h-4 w-4 text-green-500" />, bg: "bg-green-500/10" },
            { title: "Licences", icon: <ScrollText className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10" }
          ].map((item) => (
            <button
              key={item.title}
              className="flex items-center gap-3 p-4 rounded-xl bg-background border border-muted/60 hover:border-primary/40 transition-all group text-left"
            >
              <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <span className="text-sm font-semibold">{item.title}</span>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/40 group-hover:text-primary transition-all" />
            </button>
          ))}
        </div>
      </div>

      <ContactSupportDialog 
        open={showContactSupport} 
        onOpenChange={setShowContactSupport} 
      />
    </div>
  )
}
