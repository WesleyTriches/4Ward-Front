"use client";

import { useState } from "react";
import { cx } from "../../../lib/cx";
import { currency } from "../../../lib/currency";
import { formatDMY, formatTime } from "../../../lib/date";
import { getErrorMessage } from "../../../services/apiClient";
import { cancelAppointment } from "../../../services/appointmentService";
import type { Appointment, AppointmentStatus } from "../../../types/schedule";
import ui from "../../ui.module.css";
import styles from "../page.module.css";

const STATUS_UI: Record<AppointmentStatus, { label: string; badge: string }> = {
  SCHEDULED: { label: "Agendada", badge: styles.badgeScheduled },
  COMPLETED: { label: "Realizada", badge: styles.badgeCompleted },
  CANCELLED: { label: "Cancelada", badge: styles.badgeCancelled },
  NO_SHOW: { label: "Faltou", badge: styles.badgeNoShow },
};

type AppointmentCardProps = {
  appointment: Appointment;
  viewerIsPatient: boolean;
  canCancel: boolean;
  onCancelled: () => void;
};

/** Card de uma consulta, com o fluxo de cancelamento embutido */
export default function AppointmentCard({
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
