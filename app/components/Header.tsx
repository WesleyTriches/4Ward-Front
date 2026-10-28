"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, isAuthenticated } from "../login/auth_service";
import { cx } from "../lib/cx";
import { getSessionUser } from "../services/sessionService";
import { NavLink } from "../types/home";
import styles from "./Header.module.css";

// links do menu: ficam numa lista para não repetir o mesmo HTML três vezes
const links: NavLink[] = [
  { label: "Fisioterapeutas", href: "/physiotherapists" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Sobre", href: "/#sobre" },
];

export default function Header() {

  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  // "Minha área" leva para a tela principal de cada perfil
  const [minhaArea, setMinhaArea] = useState("/consultas");

  // o token fica no localStorage, que só existe no navegador,
  // por isso a checagem é feita dentro do useEffect
  useEffect(
    () => {
      setAutenticado(isAuthenticated());

      const user = getSessionUser();
      setMinhaArea(user?.role === "PHYSIOTHERAPIST" ? "/agenda" : "/consultas");
    }, []
  );

  function sair() {
    clearToken();
    setAutenticado(false);
    router.replace("/");
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>

        <Link className={styles.logo} href="/">
          4Ward
        </Link>

        <nav>
          <ul className={styles.nav}>
            {links.map((link) => (
              <li key={link.href}>
                <Link className={styles.navLink} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {!autenticado ? (
          <div className={styles.actions}>
            <Link href="/login" className={cx(styles.button, styles.buttonLight)}>
              Entrar
            </Link>
            <Link href="/register" className={cx(styles.button, styles.buttonPrimary)}>
              Cadastrar
            </Link>
          </div>
        ) : (
          <div className={styles.actions}>
            <Link href={minhaArea} className={cx(styles.button, styles.buttonPrimary)}>
              Minha área
            </Link>
            <button onClick={sair} className={cx(styles.button, styles.buttonLight)}>
              Sair
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
