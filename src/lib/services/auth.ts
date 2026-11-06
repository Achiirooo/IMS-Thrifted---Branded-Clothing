// Login rules shared by the form action and the REST API.
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const credentialsSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginResult =
  | {
      ok: true;
      user: {
        id: number;
        username: string;
        displayName: string;
        role: string;
      };
    }
  | { ok: false; error: string };

export async function loginWithPassword(input: unknown): Promise<LoginResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter your username and password." };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  // Same error for "no such user" and "wrong password" so we don't leak which
  // usernames exist.
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return { ok: false, error: "Invalid username or password." };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? user.username,
      role: user.role,
    },
  };
}
