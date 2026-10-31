"use client";

import { cx } from "../../../lib/cx";
import styles from "../page.module.css";

export type Tab = "upcoming" | "history";

type AppointmentTabsProps = {
  tab: Tab;
  upcomingCount: number;
  historyCount: number;
  onChange: (tab: Tab) => void;
};

/** Abas "Próximas" / "Histórico" da lista de consultas */
export default function AppointmentTabs({
  tab,
  upcomingCount,
  historyCount,
  onChange,
}: AppointmentTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        type="button"
        onClick={() => onChange("upcoming")}
        className={cx(styles.tab, tab === "upcoming" && styles.tabActive)}
      >
        Próximas ({upcomingCount})
      </button>
      <button
        type="button"
        onClick={() => onChange("history")}
        className={cx(styles.tab, tab === "history" && styles.tabActive)}
      >
        Histórico ({historyCount})
      </button>
    </div>
  );
}
