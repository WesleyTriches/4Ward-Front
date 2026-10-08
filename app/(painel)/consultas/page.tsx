"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import WeekPicker from "../../components/WeekPicker";
import { cx } from "../../lib/cx";
import {
  formatDMY,
  formatLongDate,
  formatTime,
  isSameDay,
  startOfDay,
  toDateKey,
} from "../../lib/date";
import {
  cancelAppointment,
  createAppointment,
  getMyAppointments,
  getPhysiotherapists,
} from "../../services/appointmentService";
import { getErrorMessage } from "../../services/apiClient";
import { getAvailableSchedules } from "../../services/scheduleService";
import { getSessionUser } from "../../services/sessionService";
import type { Physiotherapist } from "../../types/physiotherapists";
import type {
  Appointment,
  AppointmentStatus,
  Schedule,
} from "../../types/schedule";
import ui from "../ui.module.css";
import styles from "./page.module.css";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_UI: Record<AppointmentStatus, { label: string; badge: string }> = {
  SCHEDULED: { label: "Agendada", badge: styles.badgeScheduled },
  COMPLETED: { label: "Realizada", badge: styles.badgeCompleted },
  CANCELLED: { label: "Cancelada", badge: styles.badgeCancelled },
  NO_SHOW: { label: "Faltou", badge: styles.badgeNoShow },
};

type Tab = "upcoming" | "history";

/* ------------------------------------------------------------------ */
/* Card de consulta                                                    */
/* ------------------------------------------------------------------ */

type AppointmentCardProps = {
  appointment: Appointment;
  viewerIsPatient: boolean;
  canCancel: boolean;
  onCancelled: () => void;
};

function AppointmentCard({
  appointment,
  viewerIsPatient,
  canCancel,
  onCancelled,
}: AppointmentCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = new Date(appointment.schedule.dateTime);
  const status = STATUS_UI[appointment.status];

  const counterpartName = viewerIsPatient
    ? appointment.physiotherapist.profile.fullName
    : appointment.patient.fullName;
  const counterpartInfo = viewerIsPatient
    ? appointment.physiotherapist.specialty.name
    : "Paciente";

  async function handleCancel() {
    if (!reason.trim()) {
      setError("Informe o motivo do cancelamento.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await cancelAppointment(appointment.id, { cancelReason: reason.trim() });
      onCancelled();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={cx(ui.card, styles.appointment)}>
      <div className={styles.appointmentHead}>
        <div className={styles.counterpart}>
          <p className={styles.counterpartName}>{counterpartName}</p>
          <p className={styles.counterpartInfo}>{counterpartInfo}</p>
        </div>

        <span className={cx(styles.badge, status.badge)}>{status.label}</span>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt className={styles.factLabel}>Data</dt>
          <dd className={styles.factValue}>{formatDMY(start)}</dd>
        </div>
        <div>
          <dt className={styles.factLabel}>Horário</dt>
          <dd className={styles.factValue}>
            {formatTime(appointment.schedule.dateTime)}
          </dd>
        </div>
        <div>
          <dt className={styles.factLabel}>Valor</dt>
          <dd className={styles.factValue}>{currency.format(appointment.price)}</dd>
        </div>
      </dl>

      {appointment.reason && (
        <p className={styles.reason}>
          <span className={styles.reasonLabel}>Motivo: </span>
          {appointment.reason}
        </p>
      )}

      {appointment.status === "CANCELLED" && appointment.cancelReason && (
        <p className={styles.cancelNote}>
          Cancelamento: {appointment.cancelReason}
        </p>
      )}

      {canCancel && !cancelling && (
        <div className={styles.cancelTrigger}>
          <button
            type="button"
            onClick={() => setCancelling(true)}
            className={ui.linkDanger}
          >
            Cancelar consulta
          </button>
        </div>
      )}

      {canCancel && cancelling && (
        <div className={styles.cancelPanel}>
          <label
            htmlFor={`cancel-${appointment.id}`}
            className={styles.cancelLabel}
          >
            Motivo do cancelamento
          </label>
          <textarea
            id={`cancel-${appointment.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            rows={2}
            className={ui.input}
          />
          {error && (
            <p role="alert" className={ui.fieldError}>
              {error}
            </p>
          )}
          <div className={styles.cancelActions}>
            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className={ui.btnDanger}
            >
              {busy ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelling(false);
                setError("");
              }}
              className={ui.btnGhost}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Fluxo de agendamento (paciente)                                     */
/* ------------------------------------------------------------------ */

type BookingPanelProps = {
  onBooked: () => void;
  onClose: () => void;
};

function BookingPanel({ onBooked, onClose }: BookingPanelProps) {
  const [now] = useState(() => new Date());

  const [physios, setPhysios] = useState<Physiotherapist[]>([]);
  const [physioId, setPhysioId] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [scheduleId, setScheduleId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [painLevel, setPainLevel] = useState<number | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getPhysiotherapists()
      .then((data) => {
        if (active) setPhysios(data);
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedPhysio = physios.find((p) => String(p.id) === physioId) ?? null;

  async function handlePhysioChange(value: string) {
    setPhysioId(value);
    setScheduleId(null);
    setSchedules([]);
    setError("");

    if (!value) return;

    setLoadingSlots(true);
    try {
      setSchedules(await getAvailableSchedules(Number(value)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingSlots(false);
    }
  }

  const futureSchedules = useMemo(
    () => schedules.filter((s) => new Date(s.dateTime) > now),
    [schedules, now],
  );

  const markedKeys = useMemo(
    () => new Set(futureSchedules.map((s) => toDateKey(new Date(s.dateTime)))),
    [futureSchedules],
  );

  const daySlots = useMemo(
    () =>
      futureSchedules
        .filter((s) => isSameDay(new Date(s.dateTime), selectedDate))
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
    [futureSchedules, selectedDate],
  );

  const chosen = daySlots.find((s) => s.id === scheduleId) ?? null;

  async function handleConfirm() {
    if (!chosen) return;

    setSubmitting(true);
    setError("");
    try {
      await createAppointment({
        scheduleId: chosen.id,
        reason: reason.trim() || undefined,
        painLevel: painLevel ?? undefined,
      });
      onBooked();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-label="Agendar consulta" className={cx(ui.card, styles.booking)}>
      <div className={styles.bookingHead}>
        <h2 className={styles.bookingTitle}>Agendar consulta</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className={styles.closeButton}
        >
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      </div>

      {/* 1. Profissional */}
      <div className={styles.block}>
        <label htmlFor="booking-physio" className={ui.label}>
          Profissional
        </label>
        <select
          id="booking-physio"
          value={physioId}
          onChange={(event) => void handlePhysioChange(event.target.value)}
          className={ui.input}
        >
          <option value="">Selecione um fisioterapeuta</option>
          {physios.map((physio) => (
            <option key={physio.id} value={physio.id}>
              {physio.profile.fullName} — {physio.specialty.name} ({physio.city})
            </option>
          ))}
        </select>
      </div>

      {selectedPhysio && (
        <>
          {/* 2. Data e horário */}
          <div className={styles.blockLarge}>
            <p className={styles.sectionTitle}>Escolha um horário</p>
            <div className={styles.pickerWrap}>
              <WeekPicker
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setScheduleId(null);
                }}
                markedKeys={markedKeys}
                minDate={startOfDay(now)}
              />
            </div>

            <p className={styles.dayHeading}>
              {formatLongDate(selectedDate)}
              <span className={styles.dayHeadingDate}>{formatDMY(selectedDate)}</span>
            </p>

            {loadingSlots ? (
              <p className={styles.slotHint}>Buscando horários...</p>
            ) : daySlots.length === 0 ? (
              <p className={styles.slotHint}>Sem horários livres nesta data.</p>
            ) : (
              <div className={styles.slotGrid}>
                {daySlots.map((slot) => {
                  const selected = slot.id === scheduleId;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setScheduleId(slot.id)}
                      className={cx(
                        styles.slotButton,
                        selected && styles.slotButtonSelected,
                      )}
                    >
                      {formatTime(slot.dateTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Detalhes */}
          {chosen && (
            <div className={styles.blockLarge}>
              <label htmlFor="booking-reason" className={ui.label}>
                Motivo da consulta
              </label>
              <textarea
                id="booking-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Ex.: dor no joelho, avaliação, acompanhamento..."
                className={ui.input}
              />

              <p className={cx(styles.sectionTitle, styles.block)}>
                Nível de dor <span className={styles.optional}>(opcional)</span>
              </p>
              <div className={styles.painRow}>
                {Array.from({ length: 11 }, (_, level) => (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={painLevel === level}
                    onClick={() => setPainLevel(painLevel === level ? null : level)}
                    className={cx(
                      styles.painButton,
                      painLevel === level && styles.painButtonSelected,
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className={styles.painScale}>
                <span>Sem dor</span>
                <span>Dor intensa</span>
              </div>

              <p className={styles.summary}>
                {formatLongDate(selectedDate)} · {formatDMY(selectedDate)} às{" "}
                {formatTime(chosen.dateTime)} ·{" "}
                {currency.format(selectedPhysio.sessionPrice)}
              </p>
            </div>
          )}
        </>
      )}

      {error && (
        <p role="alert" className={ui.fieldError}>
          {error}
        </p>
      )}

      <div className={styles.confirm}>
        <button
          type="button"
          disabled={!chosen || submitting}
          onClick={handleConfirm}
          className={ui.btnBlock}
        >
          {submitting ? "Agendando..." : "Confirmar agendamento"}
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function ConsultasPage() {
  const [user] = useState(() => getSessionUser());
  const [now] = useState(() => new Date());
  const isPatient = user?.role === "PATIENT";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookingOpen, setBookingOpen] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setAppointments(await getMyAppointments());
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const { upcoming, history } = useMemo(() => {
    const byDate = (a: Appointment, b: Appointment) =>
      a.schedule.dateTime.localeCompare(b.schedule.dateTime);

    return {
      upcoming: appointments.filter((a) => a.status === "SCHEDULED").sort(byDate),
      history: appointments
        .filter((a) => a.status !== "SCHEDULED")
        .sort((a, b) => byDate(b, a)),
    };
  }, [appointments]);

  const visible = tab === "upcoming" ? upcoming : history;

  function handleBooked() {
    setBookingOpen(false);
    setTab("upcoming");
    setNotice("Consulta agendada com sucesso!");
    void loadAppointments();
  }

  function handleCancelled() {
    setNotice("Consulta cancelada.");
    void loadAppointments();
  }

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Minhas consultas</h1>
          <p className={ui.subtitle}>
            {isPatient
              ? "Acompanhe seus agendamentos e histórico."
              : "Consultas marcadas com os seus pacientes."}
          </p>
        </div>

        {isPatient && !bookingOpen && (
          <button
            type="button"
            onClick={() => {
              setBookingOpen(true);
              setNotice("");
            }}
            className={ui.btnPrimary}
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Agendar consulta
          </button>
        )}
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

      {isPatient && bookingOpen && (
        <BookingPanel onBooked={handleBooked} onClose={() => setBookingOpen(false)} />
      )}

      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          className={cx(styles.tab, tab === "upcoming" && styles.tabActive)}
        >
          Próximas ({upcoming.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={cx(styles.tab, tab === "history" && styles.tabActive)}
        >
          Histórico ({history.length})
        </button>
      </div>

      {loading ? (
        <p className={cx(ui.muted, styles.loading)}>Carregando consultas...</p>
      ) : visible.length === 0 ? (
        <div className={ui.emptyBox}>
          {tab === "upcoming"
            ? "Você não tem consultas agendadas."
            : "Nenhuma consulta no histórico."}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              viewerIsPatient={isPatient}
              canCancel={
                appointment.status === "SCHEDULED" &&
                new Date(appointment.schedule.dateTime) > now
              }
              onCancelled={handleCancelled}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
