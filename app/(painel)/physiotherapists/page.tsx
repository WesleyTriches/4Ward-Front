"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { currency } from "../../lib/currency";
import { getErrorMessage } from "../../services/apiClient";
import { getPhysiotherapists } from "../../services/physiotherapistService";
import { getSessionUser } from "../../services/sessionService";
import { getSpecialties } from "../../services/specialtyService";
import type { Physiotherapist, ServiceMode } from "../../types/physiotherapists";
import type { Specialty } from "../../types/specialty";
import ui from "../ui.module.css";
import styles from "./page.module.css";

type PhysiotherapistsPageProps = {
  searchParams: Promise<{ city?: string }>;
};

export default function PhysiotherapistsPage({
  searchParams,
}: PhysiotherapistsPageProps) {
  // Vindo da busca da home: /physiotherapists?city=Marau
  const { city: cityFromUrl } = use(searchParams);

  const [user] = useState(() => getSessionUser());
  const isPatient = user?.role === "PATIENT";

  const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [city, setCity] = useState(cityFromUrl ?? "");
  const [specialtyId, setSpecialtyId] = useState("");
  const [serviceMode, setServiceMode] = useState<ServiceMode | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Ao abrir a tela: carrega a lista (já filtrando pela cidade da URL) e as especialidades
  useEffect(() => {
    let active = true;

    Promise.all([
      getPhysiotherapists({ city: cityFromUrl }),
      getSpecialties(),
    ])
      .then(([physioList, specialtyList]) => {
        if (!active) return;
        setPhysiotherapists(physioList);
        setSpecialties(specialtyList);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cityFromUrl]);

  async function handleSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    try {
      setPhysiotherapists(
        await getPhysiotherapists({ city, specialtyId, serviceMode }),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Encontre seu fisioterapeuta</h1>
          <p className={ui.subtitle}>
            Busque profissionais por cidade, especialidade ou modalidade.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className={ui.alert}>
          {error}
        </p>
      )}

      <div className={styles.content}>
        {/* Filtros */}
        <form onSubmit={handleSearch} className={cx(ui.card, styles.filters)}>
          <h2 className={styles.filterTitle}>Filtros</h2>

          <div className={styles.field}>
            <label htmlFor="city" className={ui.label}>
              Cidade
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Ex.: Marau"
              className={ui.input}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="specialty" className={ui.label}>
              Especialidade
            </label>
            <select
              id="specialty"
              value={specialtyId}
              onChange={(event) => setSpecialtyId(event.target.value)}
              className={ui.input}
            >
              <option value="">Todas</option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="serviceMode" className={ui.label}>
              Modalidade
            </label>
            <select
              id="serviceMode"
              value={serviceMode}
              onChange={(event) =>
                setServiceMode(event.target.value as ServiceMode | "")
              }
              className={ui.input}
            >
              <option value="">Todas</option>
              <option value="IN_PERSON">Presencial</option>
              <option value="ONLINE">Online</option>
              <option value="BOTH">Presencial e Online</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className={ui.btnBlock}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {/* Resultados */}
        <section className={styles.results}>
          {loading ? (
            <p className={ui.muted}>Carregando fisioterapeutas...</p>
          ) : physiotherapists.length === 0 ? (
            <div className={ui.emptyBox}>Nenhum fisioterapeuta encontrado.</div>
          ) : (
            <ul className={styles.list}>
              {physiotherapists.map((physio) => (
                <li key={physio.id} className={cx(ui.card, styles.card)}>
                  <div className={styles.info}>
                    <h2 className={styles.name}>{physio.profile.fullName}</h2>
                    <p className={styles.specialty}>{physio.specialty.name}</p>
                    <p className={styles.meta}>
                      <i className="bi bi-geo-alt" aria-hidden="true" />
                      {physio.city}
                    </p>
                    <p className={styles.meta}>CREFITO: {physio.crefito}</p>
                  </div>

                  <div className={styles.actions}>
                    <strong className={styles.price}>
                      {currency.format(physio.sessionPrice)}
                    </strong>

                    {isPatient && (
                      <Link
                        href={`/consultas?physiotherapistId=${physio.id}`}
                        className={ui.btnPrimary}
                      >
                        <i className="bi bi-calendar-plus" aria-hidden="true" />
                        Agendar consulta
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
