"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { getToken } from "../../login/auth_service";
import { getSessionUser } from "../../services/sessionService";
import { Physiotherapist } from "../../types/physiotherapists";
import { Specialty } from "../../types/specialty";

import styles from "./page.module.css";

type PhysiotherapistsPageProps = {
    searchParams: Promise<{ city?: string }>;
};

export default function PhysiotherapistsPage({
    searchParams,
}: PhysiotherapistsPageProps) {

    const { city: cityDaUrl } = use(searchParams);

    const [user] = useState(() => getSessionUser());

    const [physiotherapists, setPhysiotherapists] =
        useState<Physiotherapist[]>([]);

    const [specialties, setSpecialties] =
        useState<Specialty[]>([]);

    const [city, setCity] = useState(cityDaUrl ?? "");
    const [specialtyId, setSpecialtyId] = useState("");
    const [serviceMode, setServiceMode] = useState("");

    const [erro, setErro] = useState("");

    const isPatient = user?.role === "PATIENT";

    async function buscarFisioterapeutas() {
        setErro("");

        let url =
            "http://localhost:3000/api/physiotherapists";

        const params = new URLSearchParams();

        if (city != "") {
            params.append("city", city);
        }

        if (specialtyId != "") {
            params.append("specialtyId", specialtyId);
        }

        if (serviceMode != "") {
            params.append("serviceMode", serviceMode);
        }

        if (params.toString() != "") {
            url += "?" + params.toString();
        }

        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
        });

        if (!resp.ok) {
            const error = await resp.json();
            setErro(error.message);
            return;
        }

        const dados = await resp.json();

        setPhysiotherapists(dados);
    }

    async function buscarEspecialidades() {
        const resp = await fetch(
            "http://localhost:3000/api/specialties",
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                },
            }
        );

        if (!resp.ok) {
            return;
        }

        const dados = await resp.json();

        setSpecialties(dados);
    }

    function pesquisar(
        event: React.SubmitEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        buscarFisioterapeutas();
    }

    useEffect(() => {
        buscarFisioterapeutas();
        buscarEspecialidades();
    }, []);

    return (
        <div className={styles.page}>

            <div className={styles.header}>
                <h1 className={styles.title}>
                    Encontre seu fisioterapeuta
                </h1>

                <p className={styles.subtitle}>
                    Busque profissionais por cidade,
                    especialidade ou modalidade.
                </p>
            </div>

            {erro && (
                <p className={styles.error}>
                    {erro}
                </p>
            )}

            <div className={styles.content}>

                {/* FILTROS */}
                <form
                    onSubmit={pesquisar}
                    className={styles.filters}
                >
                    <h2 className={styles.filterTitle}>
                        Filtros
                    </h2>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Cidade
                        </label>

                        <input
                            type="text"
                            className={styles.input}
                            value={city}
                            onChange={(e) =>
                                setCity(e.target.value)
                            }
                            placeholder="Ex: Marau"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Especialidade
                        </label>

                        <select
                            className={styles.input}
                            value={specialtyId}
                            onChange={(e) =>
                                setSpecialtyId(e.target.value)
                            }
                        >
                            <option value="">
                                Todas
                            </option>

                            {specialties.map((specialty) => (
                                <option
                                    key={specialty.id}
                                    value={specialty.id}
                                >
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            Modalidade
                        </label>

                        <select
                            className={styles.input}
                            value={serviceMode}
                            onChange={(e) =>
                                setServiceMode(e.target.value)
                            }
                        >
                            <option value="">
                                Todas
                            </option>

                            <option value="IN_PERSON">
                                Presencial
                            </option>

                            <option value="ONLINE">
                                Online
                            </option>

                            <option value="BOTH">
                                Presencial e Online
                            </option>
                        </select>
                    </div>

                    <button
                        className={styles.searchButton}
                        type="submit"
                    >
                        Buscar
                    </button>
                </form>

                {/* RESULTADOS */}
                <section className={styles.results}>

                    {physiotherapists.length === 0 ? (
                        <div className={styles.empty}>
                            Nenhum fisioterapeuta encontrado.
                        </div>
                    ) : (
                        physiotherapists.map((physio) => (

                            <article
                                key={physio.id}
                                className={styles.card}
                            >
                                <div className={styles.info}>
                                    <h2 className={styles.name}>
                                        {physio.profile.fullName}
                                    </h2>

                                    <p className={styles.specialty}>
                                        {physio.specialty.name}
                                    </p>

                                    <p className={styles.meta}>
                                        <i className="bi bi-geo-alt" />
                                        {physio.city}
                                    </p>

                                    <p className={styles.meta}>
                                        CREFITO: {physio.crefito}
                                    </p>
                                </div>

                                <div className={styles.actions}>
                                    <strong className={styles.price}>
                                        R$ {physio.sessionPrice.toFixed(2)}
                                    </strong>

                                    {isPatient && (
                                        <Link
                                            href={`/consultas?physiotherapistId=${physio.id}`}
                                            className={styles.scheduleButton}
                                        >
                                            <i className="bi bi-calendar-plus" />
                                            Agendar consulta
                                        </Link>
                                    )}
                                </div>
                            </article>

                        ))
                    )}

                </section>

            </div>
        </div>
    );
}