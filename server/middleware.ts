import { rateLimit } from "express-rate-limit";

// Centralized logging helper to avoid circular dependencies
export function log(message: string, source = "express", level: "INFO" | "WARN" | "ERROR" | "SECURITY" = "INFO") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const levelTag = `[${level}]`;
  const padding = " ".repeat(Math.max(0, 10 - levelTag.length));
  console.log(`${formattedTime} ${levelTag}${padding} [${source}] ${message}`);
}

// Specialized Limiters moved here to break circular dependencies
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20, // 20 attempts per IP per 15 mins
  message: { message: "Too many login attempts. High-security lockout active for 15 minutes." },
  skipSuccessfulRequests: true,
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 messages per hour
  message: { message: "Message limit reached. Please wait an hour before sending another." },
});
