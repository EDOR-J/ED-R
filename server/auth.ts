import type { Express } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

const googleClient = new OAuth2Client();

function sanitizeUser(user: typeof users.$inferSelect) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function registerAuthRoutes(app: Express) {
  // GET /api/auth/config — public config (googleClientId)
  app.get("/api/auth/config", (_req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || null,
    });
  });

  // GET /api/auth/me — returns current session user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    res.json(sanitizeUser(user));
  });

  // POST /api/auth/register — email + password signup
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, displayName, role } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: string;
    };

    if (!email || !password || !displayName) {
      return res.status(400).json({ message: "Email, password, and display name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || displayName;
    const lastName = nameParts.slice(1).join(" ") || "";
    const userRole = role === "artist" ? "artist" : "user";

    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      authProvider: "email",
      displayName: displayName.trim(),
      firstName,
      lastName,
      role: userRole,
    }).returning();

    req.session.userId = newUser.id;
    req.session.userRole = newUser.role ?? "user";

    res.json(sanitizeUser(newUser));
  });

  // POST /api/auth/login/email — email + password login
  app.post("/api/auth/login/email", async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role ?? "user";

    res.json(sanitizeUser(user));
  });

  // POST /api/auth/login/google — verify Google ID token
  app.post("/api/auth/login/google", async (req, res) => {
    const { idToken } = req.body as { idToken?: string };

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google Sign-In is not configured on this server" });
    }
    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(401).json({ message: "Invalid Google token — no email returned" });
      }

      let [user] = await db.select().from(users).where(eq(users.email, payload.email)).limit(1);

      if (!user) {
        const [created] = await db.insert(users).values({
          email: payload.email,
          authProvider: "google",
          displayName: payload.name || payload.email,
          firstName: payload.given_name || payload.email,
          lastName: payload.family_name || "",
          profileImageUrl: payload.picture || null,
          role: "user",
        }).returning();
        user = created;
      } else {
        // Update profile image if changed
        if (payload.picture && payload.picture !== user.profileImageUrl) {
          const [updated] = await db.update(users)
            .set({ profileImageUrl: payload.picture, updatedAt: new Date() })
            .where(eq(users.id, user.id))
            .returning();
          user = updated;
        }
      }

      req.session.userId = user.id;
      req.session.userRole = user.role ?? "user";

      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ message: "Google authentication failed" });
    }
  });

  // POST /api/auth/logout — destroy session
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });
}
