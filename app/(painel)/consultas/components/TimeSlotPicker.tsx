"use client";

import WeekPicker from "../../../components/WeekPicker";
import { cx } from "../../../lib/cx";
import { formatDMY, formatLongDate, formatTime } from "../../../lib/date";
import type { Schedule } from "../../../types/schedule";
import styles from "../page.module.css";

type TimeSlotPickerProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedKeys: Set<string>;
  minDate: Date;
  daySlots: Schedule[];
  loadingSlots: boolean;
  scheduleId: number | null;
  onSelectSlot: (scheduleId: number) => void;
};

/** Seletor de semana + grade de horários livres do dia escolhido */
export default function TimeSlotPicker({
  selectedDate,
  onSelectDate,
  markedKeys,
  minDate,
  daySlots,
  loadingSlots,
  scheduleId,
  onSelectSlot,
}: TimeSlotPickerProps) {
  return (
    <>
      <p className={styles.sectionTitle}>Escolha um horário</p>
      <div className={styles.pickerWrap}>
        <WeekPicker
          selected={selectedDate}
          onSelect={onSelectDate}
          markedKeys={markedKeys}
          minDate={minDate}
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
                onClick={() => onSelectSlot(slot.id)}
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
    </>
  );
}
