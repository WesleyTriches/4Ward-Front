"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
        <form onSubmit={pesquisar} className="input-group">
            <input
                type="text"
                className="form-control"
                placeholder="Busque por cidade"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
            />
            <button className="btn btn-dark" type="submit">
                Buscar
            </button>
        </form>
    );
}