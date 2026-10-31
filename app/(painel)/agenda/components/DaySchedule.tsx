import { cx } from "../../../lib/cx";
import { formatLongDate } from "../../../lib/date";
import type { AgendaSlot } from "../../../types/schedule";
import ui from "../../ui.module.css";
import styles from "../page.module.css";
import SlotItem from "./SlotItem";

type DayScheduleProps = {
  selectedDate: Date;
  /** Data selecionada já formatada (dd/mm/aaaa) */
  selectedDMY: string;
  daySlots: AgendaSlot[];
  loading: boolean;
  onAddClick: () => void;
};

/** Horários do dia selecionado: cabeçalho com resumo + lista (ou estado vazio) */
export default function DaySchedule({
  selectedDate,
  selectedDMY,
  daySlots,
  loading,
  onAddClick,
}: DayScheduleProps) {
  const availableCount = daySlots.filter((s) => s.state === "AVAILABLE").length;
  const bookedCount = daySlots.filter((s) => s.state === "SCHEDULED").length;

  return (
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
            onClick={onAddClick}
            className={cx(ui.linkBrand, styles.emptyAction)}
          >
            Adicionar horário
          </button>
        </div>
      ) : (
        <ul className={cx(ui.card, styles.slotList)}>
          {daySlots.map((slot) => (
            <SlotItem key={slot.scheduleId} slot={slot} />
          ))}
        </ul>
      )}
    </section>
  );
}
