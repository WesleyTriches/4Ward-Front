"use client";

import {
  WEEKDAYS_SHORT,
  addDays,
  formatDMY,
  formatMonthYear,
  getWeekDays,
  isSameDay,
  startOfDay,
  toDateKey,
} from "../lib/date";
import { cx } from "../lib/cx";
import styles from "./WeekPicker.module.css";

type WeekPickerProps = {
  selected: Date;
  onSelect: (date: Date) => void;
  /** Dias (YYYY-MM-DD) que recebem um ponto indicador */
  markedKeys?: ReadonlySet<string>;
  /** Dias anteriores a esta data ficam desabilitados */
  minDate?: Date;
};

export default function WeekPicker({
  selected,
  onSelect,
  markedKeys,
  minDate,
}: WeekPickerProps) {
  const days = getWeekDays(selected);
  const floor = minDate ? startOfDay(minDate) : null;

  const firstDay = days[0];
  const lastDay = days[6];
  // Semana anterior só é navegável se o último dia dela ainda for >= minDate
  const prevDisabled = floor !== null && addDays(lastDay, -7) < floor;

  return (
    <div>
      <div className={styles.nav}>
        <button
          type="button"
          aria-label="Semana anterior"
          disabled={prevDisabled}
          onClick={() => onSelect(addDays(selected, -7))}
          className={styles.navButton}
        >
          <i className="bi bi-chevron-left" aria-hidden="true" />
        </button>

        <div className={styles.center}>
          <p className={styles.month}>{formatMonthYear(selected)}</p>
          <p className={styles.range}>
            {formatDMY(firstDay)} – {formatDMY(lastDay)}
          </p>
        </div>

        <button
          type="button"
          aria-label="Próxima semana"
          onClick={() => onSelect(addDays(selected, 7))}
          className={styles.navButton}
        >
          <i className="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.days}>
        {days.map((day) => {
          const isSelected = isSameDay(day, selected);
          const disabled = floor !== null && day < floor;
          const marked = markedKeys?.has(toDateKey(day)) ?? false;

          return (
            <button
              key={toDateKey(day)}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={formatDMY(day)}
              title={formatDMY(day)}
              onClick={() => onSelect(day)}
              className={cx(
                styles.day,
                isSelected && styles.daySelected,
                disabled && styles.dayDisabled,
              )}
            >
              <span className={styles.dayName}>{WEEKDAYS_SHORT[day.getDay()]}</span>
              <span className={styles.dayNumber}>{day.getDate()}</span>
              {marked && (
                <span
                  aria-hidden="true"
                  className={cx(styles.dot, isSelected && styles.dotSelected)}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
