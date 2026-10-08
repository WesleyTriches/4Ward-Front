"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx } from "../lib/cx";
import { clearToken } from "../login/auth_service";
import type { UserRole } from "../types/schedule";
import styles from "./Sidebar.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Perfis que enxergam o item */
  roles: UserRole[];
};

const ALL_ROLES: UserRole[] = ["PATIENT", "PHYSIOTHERAPIST"];

const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/", icon: "bi-house", roles: ALL_ROLES },
  {
    label: "Fisioterapeutas",
    href: "/physiotherapists",
    icon: "bi-people",
    roles: ALL_ROLES,
  },
  {
    label: "Minhas consultas",
    href: "/consultas",
    icon: "bi-calendar-check",
    roles: ALL_ROLES,
  },
  {
    // Exclusivo do fisioterapeuta
    label: "Minha agenda",
    href: "/agenda",
    icon: "bi-calendar3",
    roles: ["PHYSIOTHERAPIST"],
  },
];

type SidebarProps = {
  role: UserRole;
  userName?: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <>
      {/* Desktop */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo}>
          4Ward
        </Link>

        <nav aria-label="Menu principal" className={styles.nav}>
          {items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(styles.link, active && styles.linkActive)}
              >
                <i className={cx("bi", item.icon, styles.icon)} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          {userName && <p className={styles.userName}>{userName}</p>}
          <button type="button" onClick={handleLogout} className={styles.logout}>
            <i className={cx("bi bi-box-arrow-left", styles.icon)} aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile */}
      <header className={styles.mobileBar}>
        <Link href="/" className={styles.mobileLogo}>
          4Ward
        </Link>
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cx(styles.pill, active && styles.pillActive)}
            >
              <i className={cx("bi", item.icon)} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
          className={cx(styles.pill, styles.pillLogout)}
        >
          <i className="bi bi-box-arrow-left" aria-hidden="true" />
        </button>
      </header>
    </>
  );
}
