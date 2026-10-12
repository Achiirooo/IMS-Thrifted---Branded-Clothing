import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Entry point: send users to the dashboard (or login) based on their session.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
