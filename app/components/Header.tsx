"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearToken, isAuthenticated } from "../login/auth_service";
import { NavLink } from "../types/home";

// links do menu: ficam numa lista para não repetir o mesmo HTML três vezes
const links: NavLink[] = [
  { label: "Fisioterapeutas", href: "/physiotherapists" },
  { label: "Como funciona", href: "/#como-funciona" },
  { label: "Sobre", href: "/#sobre" },
];

export default function Header() {

  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);

  // o token fica no localStorage, que só existe no navegador,
  // por isso a checagem é feita dentro do useEffect
  useEffect(
    () => {
      setAutenticado(isAuthenticated());
    }, []
  );

  function sair() {
    clearToken();
    setAutenticado(false);
    router.replace("/");
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container">

        <Link className="navbar-brand" href="/">
          4Ward
        </Link>

        <ul className="navbar-nav me-auto">
          {links.map((link) => (
            <li key={link.href} className="nav-item">
              <Link className="nav-link" href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {!autenticado ? (
          <div className="d-flex">
            <Link href="/login" className="btn btn-outline-secondary mx-2">
              Entrar
            </Link>
            <Link href="/register" className="btn btn-dark">
              Cadastrar
            </Link>
          </div>
        ) : (
          <div className="d-flex">
            <Link href="/admin" className="btn btn-outline-secondary mx-2">
              Minha área
            </Link>
            <button onClick={sair} className="btn btn-outline-secondary">
              Sair
            </button>
          </div>
        )}

      </div>
    </nav>
  );
}