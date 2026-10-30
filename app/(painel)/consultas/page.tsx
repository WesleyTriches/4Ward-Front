"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { cx } from "../../lib/cx";
import { getErrorMessage } from "../../services/apiClient";
import { getMyAppointments } from "../../services/appointmentService";
import { getSessionUser } from "../../services/sessionService";
import type { Appointment } from "../../types/schedule";
import ui from "../ui.module.css";
import AppointmentCard from "./components/AppointmentCard";
import AppointmentTabs, { type Tab } from "./components/AppointmentTabs";
import BookingPanel from "./components/BookingPanel";
import styles from "./page.module.css";

/** "12" -> 12; vazio, "abc", "1.5", "-3" -> null */
function parsePhysioId(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return id > 0 ? id : null;
}

type ConsultasPageProps = {
  searchParams: Promise<{ physiotherapistId?: string | string[] }>;
};

export default function ConsultasPage({ searchParams }: ConsultasPageProps) {
  const router = useRouter();
  const { physiotherapistId } = use(searchParams);

  const [user] = useState(() => getSessionUser());
  const [now] = useState(() => new Date());
  const isPatient = user?.role === "PATIENT";

  // Vindo de "Agendar consulta" na lista de fisioterapeutas; só paciente agenda
  const urlPhysioId = isPatient ? parsePhysioId(physiotherapistId) : null;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookingOpen, setBookingOpen] = useState(urlPhysioId !== null);

  const loadAppointments = useCallback(async () => {
    try {
      setAppointments(await getMyAppointments());
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const { upcoming, history } = useMemo(() => {
    const byDate = (a: Appointment, b: Appointment) =>
      a.schedule.dateTime.localeCompare(b.schedule.dateTime);

    return {
      upcoming: appointments.filter((a) => a.status === "SCHEDULED").sort(byDate),
      history: appointments
        .filter((a) => a.status !== "SCHEDULED")
        .sort((a, b) => byDate(b, a)),
    };
  }, [appointments]);

  const visible = tab === "upcoming" ? upcoming : history;

  function handleBooked() {
    setBookingOpen(false);
    setTab("upcoming");
    setNotice("Consulta agendada com sucesso!");
    void loadAppointments();
    // Tira o ?physiotherapistId= para o painel não reabrir ao recarregar
    if (physiotherapistId !== undefined) router.replace("/consultas");
  }

  function handleCancelled() {
    setNotice("Consulta cancelada.");
    void loadAppointments();
  }

  return (
    <div className={ui.page}>
      <div className={ui.header}>
        <div>
          <h1 className={ui.title}>Minhas consultas</h1>
          <p className={ui.subtitle}>
            {isPatient
              ? "Acompanhe seus agendamentos e histórico."
              : "Consultas marcadas com os seus pacientes."}
          </p>
        </div>

        {isPatient && !bookingOpen && (
          <button
            type="button"
            onClick={() => {
              setBookingOpen(true);
              setNotice("");
            }}
            className={ui.btnPrimary}
          >
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Agendar consulta
          </button>
        )}
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

      {isPatient && bookingOpen && (
        <BookingPanel
          initialPhysioId={urlPhysioId}
          onBooked={handleBooked}
          onClose={() => setBookingOpen(false)}
        />
      )}

      <AppointmentTabs
        tab={tab}
        upcomingCount={upcoming.length}
        historyCount={history.length}
        onChange={setTab}
      />

      {loading ? (
        <p className={cx(ui.muted, styles.loading)}>Carregando consultas...</p>
      ) : visible.length === 0 ? (
        <div className={ui.emptyBox}>
          {tab === "upcoming"
            ? "Você não tem consultas agendadas."
            : "Nenhuma consulta no histórico."}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              viewerIsPatient={isPatient}
              canCancel={
                appointment.status === "SCHEDULED" &&
                new Date(appointment.schedule.dateTime) > now
              }
              onCancelled={handleCancelled}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
