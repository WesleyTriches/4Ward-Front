"use client";

import { cx } from "../../../lib/cx";
import styles from "../page.module.css";

type PainLevelPickerProps = {
  value: number | null;
  onChange: (level: number | null) => void;
};

/** Escala de dor de 0 a 10; clicar de novo no nível selecionado desmarca */
export default function PainLevelPicker({
  value,
  onChange,
}: PainLevelPickerProps) {
  return (
    <>
      <p className={cx(styles.sectionTitle, styles.block)}>
        Nível de dor <span className={styles.optional}>(opcional)</span>
      </p>
      <div className={styles.painRow}>
        {Array.from({ length: 11 }, (_, level) => (
          <button
            key={level}
            type="button"
            aria-pressed={value === level}
            onClick={() => onChange(value === level ? null : level)}
            className={cx(
              styles.painButton,
              value === level && styles.painButtonSelected,
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
    </>
  );
}
