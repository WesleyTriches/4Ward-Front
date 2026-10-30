"use client";

import { useMemo, useState, type FormEvent } from "react";
import { cx } from "../../../lib/cx";
import {
  buildTimeRange,
  combineDMYAndTime,
  timeToMinutes,
} from "../../../lib/date";
import { createSchedulesBatch } from "../../../services/scheduleService";
import type { AgendaSlot, BatchResult, TimeHM } from "../../../types/schedule";
import ui from "../../ui.module.css";
import styles from "../page.module.css";
import { plural } from "../utils";

const MAX_BATCH = 24;
const STEP_OPTIONS = [15, 30, 45, 60, 90, 120];

type PlanStatus = "NEW" | "EXISTS" | "PAST";

type AddSlotsFormProps = {
  /** Data selecionada já formatada (dd/mm/aaaa) */
  selectedDMY: string;
  /** Horários já cadastrados no dia, para marcar os repetidos */
  daySlots: AgendaSlot[];
  today: Date;
  /** Chamado depois que o lote foi gravado (a página recarrega a agenda) */
  onSaved: (result: BatchResult) => Promise<void>;
  onClose: () => void;
};

/** Formulário para cadastrar um ou vários horários no dia selecionado */
export default function AddSlotsForm({
  selectedDMY,
  daySlots,
  today,
  onSaved,
  onClose,
}: AddSlotsFormProps) {
  const [startTime, setStartTime] = useState<TimeHM>("08:00");
  const [endTime, setEndTime] = useState<TimeHM | "">("");
  const [step, setStep] = useState(60);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      await onSaved(result);

      if (result.failed.length > 0) {
        const first = result.failed[0];
        setFormError(
          `${plural(result.failed.length, "horário não foi salvo", "horários não foram salvos")}. ` +
            `Ex.: ${first.time} — ${first.message}`,
        );
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
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
        <button type="button" onClick={onClose} className={ui.btnGhost}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
