"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Sidebar from "../components/Sidebar";
import { clearToken } from "../login/auth_service";
import { ApiError } from "../services/apiClient";
import { getMyPhysiotherapist } from "../services/physiotherapistService";
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

    if (session.role !== "PHYSIOTHERAPIST") {
      setUser(session);
      return;
    }

    // Fisio sem perfil profissional (ex.: fechou o navegador no meio do
    // cadastro) volta para completar antes de usar o painel.
    getMyPhysiotherapist()
      .then(() => setUser(session))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          router.replace("/cadastro-profissional");
        } else {
          setUser(session);
        }
      });
  }, [router]);

  if (!user) return null;

  return (
    <div className={styles.shell}>
      <Sidebar role={user.role} userName={user.name} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
