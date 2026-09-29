// lib/db.ts - Hardened Prisma Singleton with Retry Logic
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["error", "warn"] 
      : ["error"],
    // OWASP: Don't log queries in production - may leak PII
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Retry wrapper - prevents "Can't reach database server" crash
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delayMs?: number } = {}
): Promise<T> {
  const { retries = 3, delayMs = 500 } = options
  let lastError: unknown

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Only retry on connection errors - not on logic errors
      const isConnectionError =
        error?.code === "P1001" || // Can't reach database server
        error?.code === "P1002" || // Database timeout
        error?.code === "P1008" || // Operations timed out
        error?.message?.includes("Can't reach database server")

      if (!isConnectionError || attempt === retries) throw error

      console.warn(`[db] Connection failed (attempt ${attempt}/${retries}), retrying in ${delayMs * attempt}ms...`)
      await new Promise((r) => setTimeout(r, delayMs * attempt))
    }
  }
  throw lastError
}

export default db

