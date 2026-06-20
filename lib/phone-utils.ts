/**
 * Converts any Nigerian phone format to the local 0XXXXXXXXXX (11 digits) format.
 * Handles: +2348012345678, 2348012345678, 08012345678
 */
export function normalizeNigerianPhone(phone: string): string {
  const stripped = phone.replace(/[\s\-\+]/g, "")
  if (stripped.startsWith("234") && stripped.length > 10) {
    return "0" + stripped.slice(3)
  }
  return stripped
}

const MTN_PREFIXES = ["0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916", "0703", "0706", "0704"]
const GLO_PREFIXES = ["0805", "0807", "0811", "0815", "0905", "0915", "0705"]
const AIRTEL_PREFIXES = ["0802", "0808", "0812", "0901", "0902", "0904", "0907", "0912", "0701", "0708"]
const NINE_MOBILE_PREFIXES = ["0809", "0817", "0818", "0908", "0909"]

export function detectNigerianNetwork(phone: string): string | null {
  const local = normalizeNigerianPhone(phone)
  if (local.length < 4) return null
  const prefix = local.substring(0, 4)
  if (MTN_PREFIXES.includes(prefix)) return "MTN"
  if (GLO_PREFIXES.includes(prefix)) return "GLO"
  if (AIRTEL_PREFIXES.includes(prefix)) return "AIRTEL"
  if (NINE_MOBILE_PREFIXES.includes(prefix)) return "9MOBILE"
  return null
}
