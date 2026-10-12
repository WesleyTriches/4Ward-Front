"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import WeekPicker from "../../components/WeekPicker";
import { cx } from "../../lib/cx";
import {
  buildTimeRange,
  combineDMYAndTime,
  formatDMY,
  formatLongDate,
  timeToMinutes,
  toDateKey,
} from "../../lib/date";
import { getErrorMessage } from "../../services/apiClient";
import {
  createSchedulesBatch,
  getMySchedules,
  toAgendaSlot,
} from "../../services/scheduleService";
import { getSessionUser } from "../../services/sessionService";
import type {
  AgendaSlot,
  BatchResult,
  Schedule,
  SlotState,
  TimeHM,
} from "../../types/schedule";
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

const MAX_BATCH = 24;
const STEP_OPTIONS = [15, 30, 45, 60, 90, 120];

type PlanStatus = "NEW" | "EXISTS" | "PAST";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function summarize(result: BatchResult, date: string): string {
  const parts: string[] = [];

  if (result.created.length > 0) {
    parts.push(
      `${plural(result.created.length, "horário salvo", "horários salvos")} em ${date}`,
    );
  }
  if (result.skipped.length > 0) {
    parts.push(
      `${plural(result.skipped.length, "já existia", "já existiam")}`,
    );
  }

  return parts.join(" · ");
}

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
  const [startTime, setStartTime] = useState<TimeHM>("08:00");
  const [endTime, setEndTime] = useState<TimeHM | "">("");
  const [step, setStep] = useState(60);
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
  const daySlots = useMemo(
    () => slots.filter((slot) => slot.date === selectedDMY),
    [slots, selectedDMY],
  );
  const availableCount = daySlots.filter((s) => s.state === "AVAILABLE").length;
  const bookedCount = daySlots.filter((s) => s.state === "SCHEDULED").length;

  // ---- Pré-visualização do que será salvo ----
  const plannedTimes = useMemo(
    () => buildTimeRange(startTime, endTime, step),
    [startTime, endTime, step],
  );

  const rangeError = useMemo(() => {
    if (!startTime) return "Informe o horário inicial.";
    if (endTime && timeToMinutes(endTime) < timeToMinutes(startTime)) {
      return "O horário final precisa ser depois do inicial.";
    }
    if (plannedTimes.length > MAX_BATCH) {
      return `Máximo de ${MAX_BATCH} horários por vez. Reduza o intervalo.`;
    }
    return "";
  }, [startTime, endTime, plannedTimes.length]);

  const plan = useMemo(() => {
    const existing = new Set(daySlots.map((slot) => slot.time));

    return plannedTimes.map((time): { time: TimeHM; status: PlanStatus } => {
      if (existing.has(time)) return { time, status: "EXISTS" };
      if (new Date(combineDMYAndTime(selectedDMY, time)) <= today) {
        return { time, status: "PAST" };
      }
      return { time, status: "NEW" };
    });
  }, [plannedTimes, daySlots, selectedDMY, today]);

  const timesToSave = plan.filter((item) => item.status === "NEW");

  async function handleAddSlots(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    if (rangeError) {
      setFormError(rangeError);
      return;
    }

    // Reconfere "passado" com a hora real do clique
    const now = new Date();
    const times = timesToSave
      .map((item) => item.time)
      .filter((time) => new Date(combineDMYAndTime(selectedDMY, time)) > now);

    if (times.length === 0) {
      setFormError("Nenhum horário novo para salvar neste dia.");
      return;
    }

    setSaving(true);
    try {
      const result = await createSchedulesBatch(selectedDMY, times);

      // A lista da tela vem sempre do servidor: o que aparece está gravado.
      await loadAgenda();

      const summary = summarize(result, selectedDMY);
      if (summary) setNotice(summary);

      if (result.failed.length > 0) {
        const first = result.failed[0];
        setFormError(
          `${plural(result.failed.length, "horário não foi salvo", "horários não foram salvos")}. ` +
            `Ex.: ${first.time} — ${first.message}`,
        );
      } else {
        setFormOpen(false);
      }
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
        <form onSubmit={handleAddSlots} className={cx(ui.card, styles.form)}>
          <div className={styles.fields}>
            <div>
              <p className={styles.formLabel}>Data</p>
              <p className={styles.formValue}>{selectedDMY}</p>
            </div>

            <label className={styles.timeField}>
              Início
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
                className={styles.timeInput}
              />
            </label>

            <label className={styles.timeField}>
              Até (opcional)
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className={styles.timeInput}
              />
            </label>

            {endTime && (
              <label className={styles.timeField}>
                A cada
                <select
                  value={step}
                  onChange={(event) => setStep(Number(event.target.value))}
                  className={styles.timeInput}
                >
                  {STEP_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {plan.length > 0 && !rangeError && (
            <div>
              <p className={styles.previewTitle}>
                {plural(timesToSave.length, "horário novo", "horários novos")} em{" "}
                {selectedDMY}
              </p>
              <ul className={styles.chips}>
                {plan.map((item) => (
                  <li
                    key={item.time}
                    className={cx(
                      styles.chip,
                      item.status === "NEW" ? styles.chipNew : styles.chipSkip,
                    )}
                  >
                    {item.time}
                    {item.status === "EXISTS" && " · já cadastrado"}
                    {item.status === "PAST" && " · já passou"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(rangeError || formError) && (
            <p role="alert" className={styles.formError}>
              {rangeError || formError}
            </p>
          )}

          <div className={styles.formFooter}>
            <button
              type="submit"
              disabled={saving || timesToSave.length === 0 || rangeError !== ""}
              className={ui.btnPrimary}
            >
              {saving
                ? "Salvando..."
                : timesToSave.length > 1
                  ? `Salvar ${timesToSave.length} horários`
                  : "Salvar horário"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setFormError("");
              }}
              className={ui.btnGhost}
            >
              Cancelar
            </button>
          </div>
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
