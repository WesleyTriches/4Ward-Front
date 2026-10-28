"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { getErrorMessage } from "../../services/apiClient";
import {
  getMyPhysiotherapist,
  updateMyPhysiotherapist,
} from "../../services/physiotherapistService";
import { getSessionUser } from "../../services/sessionService";
import { getSpecialties } from "../../services/specialtyService";
import type { Physiotherapist, ServiceMode } from "../../types/physiotherapists";
import type { Specialty } from "../../types/specialty";
import ui from "../ui.module.css";

export default function PerfilProfissionalPage() {
  const router = useRouter();
  const [user] = useState(() => getSessionUser());
  const isPhysio = user?.role === "PHYSIOTHERAPIST";

  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [specialtyId, setSpecialtyId] = useState("");
  const [crefito, setCrefito] = useState("");
  const [city, setCity] = useState("");
  const [sessionPrice, setSessionPrice] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("IN_PERSON");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /** Copia os dados da API para os campos do formulário */
  function fillForm(physio: Physiotherapist) {
    setSpecialtyId(String(physio.specialtyId));
    setCrefito(physio.crefito);
    setCity(physio.city);
    setSessionPrice(String(physio.sessionPrice));
    setExperienceYears(String(physio.experienceYears));
    setServiceMode(physio.serviceMode);
    setBio(physio.bio ?? "");
  }

  useEffect(() => {
    // Tela exclusiva do fisioterapeuta
    if (!isPhysio) {
      router.replace("/consultas");
      return;
    }

    let active = true;

    Promise.all([getMyPhysiotherapist(), getSpecialties()])
      .then(([physio, specialtyList]) => {
        if (!active) return;
        setSpecialties(specialtyList);
        fillForm(physio);
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
  }, [isPhysio, router]);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateMyPhysiotherapist({
        specialtyId: Number(specialtyId),
        crefito: crefito.trim(),
        city: city.trim(),
        sessionPrice: Number(sessionPrice),
        experienceYears: Number(experienceYears),
        serviceMode,
        bio: bio.trim(),
      });
      fillForm(updated);
      setNotice("Perfil profissional atualizado com sucesso!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!isPhysio) return null;

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Perfil profissional</h1>
          <p className={ui.subtitle}>Essas informações aparecem para os pacientes.</p>
        </div>
      </div>

      {notice && (
        <p role="status" className={ui.notice}>
          {notice}
        </p>
      )}

      {error && (
        <p role="alert" className={ui.alert}>
          {error}
        </p>
      )}

      {loading ? (
        <p className={cx(ui.muted, ui.formCard)}>Carregando perfil profissional...</p>
      ) : (
        <form onSubmit={handleSubmit} className={ui.formCard}>
          <div className={ui.fieldRow}>
            <div>
              <label htmlFor="specialty" className={ui.label}>
                Especialidade
              </label>
              <select
                id="specialty"
                value={specialtyId}
                onChange={(event) => setSpecialtyId(event.target.value)}
                required
                className={ui.input}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="crefito" className={ui.label}>
                CREFITO
              </label>
              <input
                id="crefito"
                type="text"
                value={crefito}
                onChange={(event) => setCrefito(event.target.value)}
                placeholder="Ex.: 123456-F"
                required
                className={ui.input}
              />
            </div>
          </div>

          <div className={ui.fieldRow}>
            <div>
              <label htmlFor="city" className={ui.label}>
                Cidade
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                className={ui.input}
              />
            </div>

            <div>
              <label htmlFor="serviceMode" className={ui.label}>
                Modalidade
              </label>
              <select
                id="serviceMode"
                value={serviceMode}
                onChange={(event) => setServiceMode(event.target.value as ServiceMode)}
                className={ui.input}
              >
                <option value="IN_PERSON">Presencial</option>
                <option value="ONLINE">Online</option>
                <option value="BOTH">Presencial e Online</option>
              </select>
            </div>
          </div>

          <div className={ui.fieldRow}>
            <div>
              <label htmlFor="sessionPrice" className={ui.label}>
                Preço da sessão (R$)
              </label>
              <input
                id="sessionPrice"
                type="number"
                min="0"
                step="0.01"
                value={sessionPrice}
                onChange={(event) => setSessionPrice(event.target.value)}
                required
                className={ui.input}
              />
            </div>

            <div>
              <label htmlFor="experienceYears" className={ui.label}>
                Anos de experiência
              </label>
              <input
                id="experienceYears"
                type="number"
                min="0"
                step="1"
                value={experienceYears}
                onChange={(event) => setExperienceYears(event.target.value)}
                required
                className={ui.input}
              />
            </div>
          </div>

          <div className={ui.field}>
            <label htmlFor="bio" className={ui.label}>
              Bio (opcional)
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              placeholder="Conte um pouco sobre você e sua forma de atender"
              className={ui.input}
            />
          </div>

          <div className={ui.formActions}>
            <button type="submit" disabled={saving} className={ui.btnPrimary}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
