"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cx } from "../../lib/cx";
import styles from "./SearchBar.module.css";

export default function SearchBar() {

    const router = useRouter();
    const [busca, setBusca] = useState("");

    function pesquisar(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const params = new URLSearchParams();

        if (busca.trim() != "") {
            params.append("city", busca.trim());
        }

        const query = params.toString();
        router.push(query != "" ? `/physiotherapists?${query}` : "/physiotherapists");
    }

    return (
        <form onSubmit={pesquisar} className={styles.form}>
            <i className={cx("bi bi-search", styles.icon)} aria-hidden="true"></i>
            <input
                type="text"
                className={styles.input}
                placeholder="Busque por cidade"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />
            <button className={styles.button} type="submit" aria-label="Buscar">
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </button>
        </form>
    );
}
