"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loginWithPassword } from "@/lib/services/auth";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState | null,
  formData: FormData,
): Promise<LoginState> {
  const result = await loginWithPassword({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!result.ok) {
    return { error: result.error };
  }

  const session = await getSession();
  session.userId = result.user.id;
  session.username = result.user.username;
  session.displayName = result.user.displayName;
  session.role = result.user.role;
  await session.save();

  redirect("/dashboard");
}
