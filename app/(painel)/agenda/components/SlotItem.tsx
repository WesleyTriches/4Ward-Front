import Link from "next/link";
import { cx } from "../../../lib/cx";
import type { AgendaSlot, SlotState } from "../../../types/schedule";
import styles from "../page.module.css";

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

type SlotItemProps = {
  slot: AgendaSlot;
};

/** Linha de um horário da agenda (hora, estado e paciente, se houver) */
export default function SlotItem({ slot }: SlotItemProps) {
  const slotUi = SLOT_UI[slot.state];

  return (
    <li className={styles.slotItem}>
      <span className={styles.slotTime}>{slot.time}</span>

      <i className={cx("bi", slotUi.icon, slotUi.tone)} aria-hidden="true" />

      <div className={styles.slotText}>
        <p className={styles.slotLabel}>{slotUi.label}</p>
        {slot.patientName && (
          <p className={styles.slotPatient}>Paciente: {slot.patientName}</p>
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
}
