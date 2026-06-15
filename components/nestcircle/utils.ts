// Smart network provider detection based on Nigerian phone prefixes
export function detectNetwork(phone: string): string | null {
  const cleanPhone = phone.replace(/[\s\-\+]/g, "")
  let localPhone = cleanPhone
  if (cleanPhone.startsWith("234")) {
    localPhone = "0" + cleanPhone.slice(3)
  }
  
  if (localPhone.length < 4) return null
  const prefix = localPhone.substring(0, 4)
  
  const mtnPrefixes = ["0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916", "0703", "0706", "0704"]
  const gloPrefixes = ["0805", "0807", "0811", "0815", "0905", "0915", "0705"]
  const airtelPrefixes = ["0802", "0808", "0812", "0901", "0902", "0904", "0907", "0912", "0701", "0708"]
  const nineMobilePrefixes = ["0809", "0817", "0818", "0908", "0909"]
  
  if (mtnPrefixes.includes(prefix)) return "MTN"
  if (gloPrefixes.includes(prefix)) return "GLO"
  if (airtelPrefixes.includes(prefix)) return "AIRTEL"
  if (nineMobilePrefixes.includes(prefix)) return "9MOBILE"
  
  return null
}

export const CABLE_PLANS: Record<string, Array<{ name: string; amount: number }>> = {
  dstv: [
    { name: "DSTV Yanga (₦5,100)", amount: 5100 },
    { name: "DSTV Confam (₦9,300)", amount: 9300 },
    { name: "DSTV Compact (₦15,700)", amount: 15700 },
    { name: "DSTV Compact Plus (₦25,000)", amount: 25000 },
    { name: "DSTV Premium (₦37,000)", amount: 37000 },
  ],
  gotv: [
    { name: "GOTV Lite (₦1,700)", amount: 1700 },
    { name: "GOTV Jinja (₦3,300)", amount: 3300 },
    { name: "GOTV Jolli (₦4,850)", amount: 4850 },
    { name: "GOTV Max (₦7,200)", amount: 7200 },
    { name: "GOTV Supa (₦9,600)", amount: 9600 },
  ],
  startimes: [
    { name: "Nova (₦1,500)", amount: 1500 },
    { name: "Basic (₦3,300)", amount: 3300 },
    { name: "Smart (₦4,500)", amount: 4500 },
    { name: "Classic (₦5,000)", amount: 5000 },
    { name: "Super (₦9,000)", amount: 9000 },
  ],
}

export interface DataPlan {
  amount: number
  plan: string
}

export function parsePlanDetails(planStr: string) {
  const parts = planStr.split("->")
  if (parts.length === 2) {
    const allowance = parts[0].trim()
    const rest = parts[1].trim()
    const validityMatch = rest.match(/^([^(]+)/)
    const priceMatch = rest.match(/\(([^)]+)\)/)
    
    const validity = validityMatch ? validityMatch[1].trim() : ""
    const price = priceMatch ? priceMatch[1].trim().replace(/N/gi, "₦") : ""
    
    return { allowance, validity, price }
  }
  return { allowance: planStr, validity: "", price: "" }
}
