"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import WeekPicker from "../../components/WeekPicker";
import { cx } from "../../lib/cx";
import {
  combineDMYAndTime,
  formatDMY,
  formatLongDate,
  toDateKey,
} from "../../lib/date";
import { getErrorMessage } from "../../services/apiClient";
import {
  createSchedule,
  getMySchedules,
  toAgendaSlot,
} from "../../services/scheduleService";
import { getSessionUser } from "../../services/sessionService";
import type { AgendaSlot, Schedule, SlotState } from "../../types/schedule";
import ui from "../ui.module.css";
import styles from "./page.module.css";

const SLOT_UI: Record<
  SlotState,
  { label: string; icon: string; tone: string }
> = {
  AVAILABLE: {
    label: "Disponível",
    icon: "bi-check-circle-fill",
    tone: styles.iconAvailable,
  },
  SCHEDULED: {
    label: "Consulta agendada",
    icon: "bi-star-fill",
    tone: styles.iconScheduled,
  },
  COMPLETED: {
    label: "Consulta realizada",
    icon: "bi-check2-all",
    tone: styles.iconCompleted,
  },
  NO_SHOW: {
    label: "Paciente faltou",
    icon: "bi-x-circle-fill",
    tone: styles.iconNoShow,
  },
  UNAVAILABLE: {
    label: "Indisponível",
    icon: "bi-dash-circle-fill",
    tone: styles.iconUnavailable,
  },
};

export default function AgendaPage() {
  const router = useRouter();

  const [user] = useState(() => getSessionUser());
  const [today] = useState(() => new Date());
  const isPhysio = user?.role === "PHYSIOTHERAPIST";

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [time, setTime] = useState("08:00");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAgenda = useCallback(async () => {
    try {
      const data = await getMySchedules();
      setSchedules(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Agenda é exclusiva do fisioterapeuta
    if (!isPhysio) {
      router.replace("/consultas");
      return;
    }
    void loadAgenda();
  }, [isPhysio, router, loadAgenda]);

  const slots = useMemo<AgendaSlot[]>(
    () =>
      schedules
        .map(toAgendaSlot)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [schedules],
  );

  const markedKeys = useMemo(
    () => new Set(slots.map((slot) => toDateKey(new Date(slot.dateTime)))),
    [slots],
  );

  const selectedDMY = formatDMY(selectedDate);
  const daySlots = slots.filter((slot) => slot.date === selectedDMY);
  const availableCount = daySlots.filter((s) => s.state === "AVAILABLE").length;
  const bookedCount = daySlots.filter((s) => s.state === "SCHEDULED").length;

  async function handleAddSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const dateTime = combineDMYAndTime(selectedDMY, time);

    if (new Date(dateTime) <= new Date()) {
      setFormError("Escolha um horário no futuro.");
      return;
    }

    setSaving(true);
    try {
      await createSchedule({ dateTime });
      await loadAgenda();
      setNotice(`Horário ${time} de ${selectedDMY} adicionado.`);
      setFormOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!isPhysio) return null;

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Minha agenda</h1>
          <p className={ui.subtitle}>Gerencie seus horários de atendimento.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormOpen((open) => !open);
            setFormError("");
          }}
          className={ui.btnPrimary}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Adicionar horário
        </button>
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

      {formOpen && (
        <form onSubmit={handleAddSlot} className={cx(ui.card, styles.form)}>
          <div>
            <p className={styles.formLabel}>Data</p>
            <p className={styles.formValue}>{selectedDMY}</p>
          </div>

          <label className={styles.timeField}>
            Horário
            <input
              type="time"
              step={900}
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
              className={styles.timeInput}
            />
          </label>

          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving ? "Salvando..." : "Salvar horário"}
          </button>

          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
        </form>
      )}

      <section className={cx(ui.card, styles.weekCard)}>
        <WeekPicker
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedDate(date);
            setNotice("");
          }}
          markedKeys={markedKeys}
        />
      </section>

      <section className={styles.daySection}>
        <div className={styles.dayHeader}>
          <h2 className={styles.dayTitle}>
            {formatLongDate(selectedDate)}
            <span className={styles.dayDate}>{selectedDMY}</span>
          </h2>
          {daySlots.length > 0 && (
            <p className={styles.daySummary}>
              {availableCount} disponíveis · {bookedCount} agendadas
            </p>
          )}
        </div>

        {loading ? (
          <p className={cx(ui.muted, styles.emptyAction)}>Carregando agenda...</p>
        ) : daySlots.length === 0 ? (
          <div className={ui.emptyBox}>
            <p>Nenhum horário cadastrado para {selectedDMY}.</p>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className={cx(ui.linkBrand, styles.emptyAction)}
            >
              Adicionar horário
            </button>
          </div>
        ) : (
          <ul className={cx(ui.card, styles.slotList)}>
            {daySlots.map((slot) => {
              const slotUi = SLOT_UI[slot.state];
              return (
                <li key={slot.scheduleId} className={styles.slotItem}>
                  <span className={styles.slotTime}>{slot.time}</span>

                  <i
                    className={cx("bi", slotUi.icon, slotUi.tone)}
                    aria-hidden="true"
                  />

                  <div className={styles.slotText}>
                    <p className={styles.slotLabel}>{slotUi.label}</p>
                    {slot.patientName && (
                      <p className={styles.slotPatient}>
                        Paciente: {slot.patientName}
                      </p>
                    )}
                  </div>

                  {slot.appointmentId !== null && (
                    <Link
                      href="/consultas"
                      aria-label={`Ver consulta de ${slot.patientName ?? "paciente"}`}
                      className={styles.menuButton}
                    >
                      <i className="bi bi-three-dots" aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
