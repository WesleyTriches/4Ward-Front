"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cx } from "../../lib/cx";
import { getErrorMessage } from "../../services/apiClient";
import { getSessionUser } from "../../services/sessionService";
import {
  createSpecialty,
  getSpecialties,
  updateSpecialty,
} from "../../services/specialtyService";
import type { Specialty } from "../../types/specialty";
import ui from "../ui.module.css";
import styles from "./page.module.css";

function sortByName(list: Specialty[]): Specialty[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export default function EspecialidadesPage() {
  const router = useRouter();
  const [user] = useState(() => getSessionUser());
  const isPhysio = user?.role === "PHYSIOTHERAPIST";

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  // null = criando uma nova; número = id da especialidade em edição
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const formRef = useRef<HTMLFormElement>(null);

  /** Recarrega a lista depois de criar ou editar */
  async function reloadSpecialties() {
    setSpecialties(sortByName(await getSpecialties()));
  }

  useEffect(() => {
    // Tela exclusiva do fisioterapeuta
    if (!isPhysio) {
      router.replace("/consultas");
      return;
    }

    let active = true;

    getSpecialties()
      .then((list) => {
        if (active) setSpecialties(sortByName(list));
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

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("");
  }

  function startEditing(specialty: Specialty) {
    setEditingId(specialty.id);
    setName(specialty.name);
    setDescription(specialty.description ?? "");
    setIcon(specialty.icon ?? "");
    setError("");
    setNotice("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEditing() {
    resetForm();
    setError("");
  }

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError("O nome deve ter entre 2 e 100 caracteres.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId === null) {
        await createSpecialty({
          name: trimmedName,
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
        });
        setNotice("Especialidade criada com sucesso!");
      } else {
        // Na edição, texto vazio é enviado para permitir apagar o campo
        await updateSpecialty(editingId, {
          name: trimmedName,
          description: description.trim(),
          icon: icon.trim(),
        });
        setNotice("Especialidade atualizada com sucesso!");
      }

      resetForm();
      await reloadSpecialties();
    } catch (err) {
      // Ex.: 409 "Especialidade já cadastrada" — o formulário fica preenchido
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!isPhysio) return null;

  const editing = editingId !== null;

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Especialidades</h1>
          <p className={ui.subtitle}>
            Usadas no cadastro profissional e no filtro de busca.
          </p>
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

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cx(ui.formCard, editing && styles.formEditing)}
      >
        <h2 className={styles.formTitle}>
          {editing ? "Editar especialidade" : "Nova especialidade"}
        </h2>

        <div className={ui.fieldRow}>
          <div>
            <label htmlFor="name" className={ui.label}>
              Nome
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
              placeholder="Ex.: Ortopedia"
              className={ui.input}
            />
          </div>

          <div>
            <label htmlFor="icon" className={ui.label}>
              Ícone <span className={styles.optional}>(opcional)</span>
            </label>
            <input
              id="icon"
              type="text"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              placeholder="Ex.: bi-heart-pulse"
              className={ui.input}
            />
            <p className={ui.hint}>Nome de um ícone do Bootstrap Icons.</p>
          </div>
        </div>

        <div className={ui.field}>
          <label htmlFor="description" className={ui.label}>
            Descrição <span className={styles.optional}>(opcional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={ui.input}
          />
        </div>

        <div className={cx(ui.formActions, styles.formActions)}>
          {editing && (
            <button type="button" onClick={cancelEditing} className={ui.btnGhost}>
              Cancelar
            </button>
          )}
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Criar especialidade"}
          </button>
        </div>
      </form>

      <h2 className={styles.listTitle}>Cadastradas ({specialties.length})</h2>

      {loading ? (
        <p className={cx(ui.muted, styles.loading)}>Carregando especialidades...</p>
      ) : specialties.length === 0 ? (
        <div className={ui.emptyBox}>Nenhuma especialidade cadastrada.</div>
      ) : (
        <ul className={styles.list}>
          {specialties.map((specialty) => (
            <li
              key={specialty.id}
              className={cx(
                ui.card,
                styles.item,
                specialty.id === editingId && styles.itemEditing,
              )}
            >
              <span className={styles.itemIcon} aria-hidden="true">
                <i
                  className={cx(
                    "bi",
                    specialty.icon?.startsWith("bi-") ? specialty.icon : "bi-tag",
                  )}
                />
              </span>

              <div className={styles.itemText}>
                <p className={styles.itemName}>{specialty.name}</p>
                <p className={styles.itemDescription}>
                  {specialty.description || "Sem descrição."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => startEditing(specialty)}
                className={ui.linkBrand}
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
