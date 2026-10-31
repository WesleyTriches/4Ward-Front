"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "../../../lib/cx";
import { currency } from "../../../lib/currency";
import {
  formatDMY,
  formatLongDate,
  formatTime,
  isSameDay,
  startOfDay,
  toDateKey,
} from "../../../lib/date";
import { getErrorMessage } from "../../../services/apiClient";
import {
  createAppointment,
  getPhysiotherapists,
} from "../../../services/appointmentService";
import { getAvailableSchedules } from "../../../services/scheduleService";
import type { Physiotherapist } from "../../../types/physiotherapists";
import type { Schedule } from "../../../types/schedule";
import ui from "../../ui.module.css";
import styles from "../page.module.css";
import PainLevelPicker from "./PainLevelPicker";
import TimeSlotPicker from "./TimeSlotPicker";

type BookingPanelProps = {
  /** Fisioterapeuta vindo de ?physiotherapistId= (já validado como número) */
  initialPhysioId: number | null;
  onBooked: () => void;
  onClose: () => void;
};

/** Fluxo de agendamento (paciente): profissional → horário → detalhes */
export default function BookingPanel({
  initialPhysioId,
  onBooked,
  onClose,
}: BookingPanelProps) {
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
        if (!active) return;
        setPhysios(data);

        if (initialPhysioId === null) return;
        // Mesmo caminho de quando o paciente escolhe no select
        if (data.some((p) => p.id === initialPhysioId)) {
          void handlePhysioChange(String(initialPhysioId));
        } else {
          // Id que não existe: fecha o painel e mostra a tela normal
          onClose();
        }
      })
      .catch((err: unknown) => {
        if (active) setError(getErrorMessage(err));
      });

    return () => {
      active = false;
    };
    // Roda só ao abrir o painel: a lista é buscada uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <TimeSlotPicker
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setScheduleId(null);
              }}
              markedKeys={markedKeys}
              minDate={startOfDay(now)}
              daySlots={daySlots}
              loadingSlots={loadingSlots}
              scheduleId={scheduleId}
              onSelectSlot={setScheduleId}
            />
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

              <PainLevelPicker value={painLevel} onChange={setPainLevel} />

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
