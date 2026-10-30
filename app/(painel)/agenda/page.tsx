"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import WeekPicker from "../../components/WeekPicker";
import { cx } from "../../lib/cx";
import { formatDMY, toDateKey } from "../../lib/date";
import { getErrorMessage } from "../../services/apiClient";
import { getMySchedules, toAgendaSlot } from "../../services/scheduleService";
import { getSessionUser } from "../../services/sessionService";
import type { AgendaSlot, BatchResult, Schedule } from "../../types/schedule";
import ui from "../ui.module.css";
import AddSlotsForm from "./components/AddSlotsForm";
import DaySchedule from "./components/DaySchedule";
import styles from "./page.module.css";
import { summarize } from "./utils";

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

  async function handleSaved(result: BatchResult) {
    await loadAgenda();
    setNotice(summarize(result, selectedDMY));
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
          onClick={() => setFormOpen((open) => !open)}
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
        <AddSlotsForm
          selectedDMY={selectedDMY}
          daySlots={daySlots}
          today={today}
          onSaved={handleSaved}
          onClose={() => setFormOpen(false)}
        />
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

      <DaySchedule
        selectedDate={selectedDate}
        selectedDMY={selectedDMY}
        daySlots={daySlots}
        loading={loading}
        onAddClick={() => setFormOpen(true)}
      />
    </div>
  );
}
