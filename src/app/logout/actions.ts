"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Destroys the encrypted session cookie and sends the user back to login.
export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
