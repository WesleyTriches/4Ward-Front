"use client";

import { useEffect, useState } from "react";
import { cx } from "../../lib/cx";
import { getErrorMessage } from "../../services/apiClient";
import { getMyProfile, updateMyProfile } from "../../services/profileService";
import { getSessionUser } from "../../services/sessionService";
import type { Profile } from "../../types/profile";
import ui from "../ui.module.css";
import styles from "./page.module.css";

export default function PerfilPage() {
  const [user] = useState(() => getSessionUser());

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  /** Copia os dados da API para os campos do formulário */
  function fillForm(profile: Profile) {
    setFullName(profile.fullName);
    // A API devolve ISO ("1990-05-10T00:00:00.000Z"); o <input type="date"> quer "1990-05-10"
    setBirthDate(profile.birthDate ? profile.birthDate.slice(0, 10) : "");
    setAvatarUrl(profile.avatarUrl ?? "");
  }

  useEffect(() => {
    let active = true;

    getMyProfile()
      .then((profile) => {
        if (active) fillForm(profile);
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
  }, []);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateMyProfile({
        fullName: fullName.trim(),
        birthDate: birthDate || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      fillForm(updated);
      setNotice("Perfil atualizado com sucesso!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const initial = (fullName || user?.name || "?").charAt(0).toUpperCase();

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Meu perfil</h1>
          <p className={ui.subtitle}>Seus dados pessoais.</p>
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
        <p className={cx(ui.muted, ui.formCard)}>Carregando perfil...</p>
      ) : (
        <form onSubmit={handleSubmit} className={ui.formCard}>
          <div className={styles.identity}>
            <div className={styles.avatar}>
              {avatarUrl ? (
                // URL externa digitada pelo usuário: o <Image> do Next exigiria
                // cadastrar cada domínio no next.config
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Foto de perfil" />
              ) : (
                initial
              )}
            </div>
            <div>
              <p className={styles.identityName}>{fullName || user?.name}</p>
              {user && <p className={ui.muted}>{user.email}</p>}
            </div>
          </div>

          <div className={ui.field}>
            <label htmlFor="fullName" className={ui.label}>
              Nome completo
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className={ui.input}
            />
          </div>

          <div className={ui.fieldRow}>
            <div>
              <label htmlFor="birthDate" className={ui.label}>
                Data de nascimento
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className={ui.input}
              />
            </div>

            <div>
              <label htmlFor="avatarUrl" className={ui.label}>
                URL da foto
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://..."
                className={ui.input}
              />
              <p className={ui.hint}>Link de uma imagem já publicada na internet.</p>
            </div>
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
