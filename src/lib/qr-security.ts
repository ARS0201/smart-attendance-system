import crypto from "crypto";

// Default rotation interval: 10 seconds
export const QR_ROTATION_INTERVAL_SECONDS = 10;
// Allowable window skew: current window and immediately prior window (up to 15 seconds grace period)
export const MAX_WINDOW_SKEW = 1;

/**
 * Returns current time-step window index based on rotation interval
 */
export function getCurrentTimeWindow(intervalSeconds = QR_ROTATION_INTERVAL_SECONDS): number {
  return Math.floor(Date.now() / 1000 / intervalSeconds);
}

/**
 * Generates an HMAC-SHA256 rotating token for a session and specific time window
 */
export function generateSessionOtp(sessionId: string, secret: string, timeWindow: number): string {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${sessionId}:${timeWindow}`);
  // Return an 8-character hex token
  return hmac.digest("hex").substring(0, 8).toUpperCase();
}

/**
 * Creates full dynamic QR code payload
 */
export function createDynamicQrPayload(sessionId: string, secret: string, classroom?: string | null) {
  const timeWindow = getCurrentTimeWindow();
  const token = generateSessionOtp(sessionId, secret, timeWindow);
  const now = Date.now();
  const expiresAt = (timeWindow + 1) * QR_ROTATION_INTERVAL_SECONDS * 1000;
  const remainingMs = Math.max(0, expiresAt - now);

  const payload = {
    v: 1, // version
    sid: sessionId,
    t: token,
    w: timeWindow,
    room: classroom || "Standard Classroom",
    ts: now,
  };

  return {
    qrString: JSON.stringify(payload),
    token,
    timeWindow,
    remainingSeconds: Math.ceil(remainingMs / 1000),
  };
}

/**
 * Validates a submitted QR code token against the session secret and acceptable time windows
 */
export function validateDynamicQrToken(
  sessionId: string,
  secret: string,
  submittedToken: string,
  submittedWindow: number
): { isValid: boolean; reason?: string } {
  const currentWindow = getCurrentTimeWindow();

  // Check window freshness (must not be in the future beyond 1, and not older than MAX_WINDOW_SKEW)
  const windowDifference = currentWindow - submittedWindow;

  if (windowDifference < -1 || windowDifference > MAX_WINDOW_SKEW) {
    return {
      isValid: false,
      reason: "QR Code has expired! Screenshots are prevented; please scan the live projector screen.",
    };
  }

  // Generate expected token for the submitted window
  const expectedToken = generateSessionOtp(sessionId, secret, submittedWindow);

  if (expectedToken !== submittedToken.toUpperCase()) {
    return {
      isValid: false,
      reason: "Invalid QR security token or mismatched session secret.",
    };
  }

  return { isValid: true };
}

