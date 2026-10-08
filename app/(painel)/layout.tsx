"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import { clearToken } from "../login/auth_service";
import { getSessionUser, type SessionUser } from "../services/sessionService";
import styles from "./layout.module.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const session = getSessionUser();

    if (!session) {
      clearToken();
      router.replace("/login");
      return;
    }

    setUser(session);
  }, [router]);

  if (!user) return null;

  return (
    <div className={styles.shell}>
      <Sidebar role={user.role} userName={user.name} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
