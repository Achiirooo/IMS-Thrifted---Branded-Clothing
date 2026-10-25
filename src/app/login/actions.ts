"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter your username and password." };
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  // Same error for "no such user" and "wrong password" so we don't leak
  // which usernames exist.
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    return { error: "Invalid username or password." };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.displayName = user.displayName ?? user.username;
  session.role = user.role;
  await session.save();

  redirect("/dashboard");
}
