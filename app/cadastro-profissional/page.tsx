"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { clearToken } from "../login/auth_service";
import { ApiError, getErrorMessage } from "../services/apiClient";
import {
    createPhysiotherapist,
    getMyPhysiotherapist,
} from "../services/physiotherapistService";
import { getSessionUser } from "../services/sessionService";
import { getSpecialties } from "../services/specialtyService";
import type { ServiceMode } from "../types/physiotherapists";
import type { Specialty } from "../types/specialty";
import styles from "../auth.module.css";

export default function CadastroProfissionalPage() {
    const router = useRouter();

    // Só mostra o formulário depois de confirmar que o usuário pode estar aqui
    const [ready, setReady] = useState(false);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);

    const [specialtyId, setSpecialtyId] = useState("");
    const [crefito, setCrefito] = useState("");
    const [city, setCity] = useState("");
    const [sessionPrice, setSessionPrice] = useState("");
    const [experienceYears, setExperienceYears] = useState("");
    const [serviceMode, setServiceMode] = useState<ServiceMode>("IN_PERSON");
    const [bio, setBio] = useState("");

    const [erro, setErro] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const session = getSessionUser();

        if (!session) {
            clearToken();
            router.replace("/login");
            return;
        }

        if (session.role !== "PHYSIOTHERAPIST") {
            router.replace("/consultas");
            return;
        }

        async function load() {
            try {
                // Sucesso = já tem perfil profissional, não precisa cadastrar
                await getMyPhysiotherapist();
                router.replace("/agenda");
                return;
            } catch (error) {
                if (!(error instanceof ApiError && error.status === 404)) {
                    setErro(getErrorMessage(error));
                }
            }

            try {
                setSpecialties(await getSpecialties());
            } catch (error) {
                setErro(getErrorMessage(error));
            }

            setReady(true);
        }

        load();
    }, [router]);

    async function submitForm(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setErro("");
        setSaving(true);

        try {
            await createPhysiotherapist({
                specialtyId: Number(specialtyId),
                crefito,
                city,
                sessionPrice: Number(sessionPrice),
                experienceYears: Number(experienceYears),
                serviceMode,
                bio: bio.trim() || undefined,
            });

            router.replace("/agenda");
        } catch (error) {
            setErro(getErrorMessage(error));
            setSaving(false);
        }
    }

    if (!ready) return null;

    return (
        <main className={styles.page}>
            <div className={styles.container}>

                <div className={styles.logo}>
                    4Ward
                </div>

                <div className={styles.card}>
                    <h1 className={styles.title}>
                        Complete seu perfil profissional
                    </h1>

                    <p className={styles.subtitle}>
                        Essas informações aparecem para os pacientes.
                    </p>

                    {erro && (
                        <p className={styles.error}>
                            {erro}
                        </p>
                    )}

                    <form onSubmit={submitForm}>

                        <div className={styles.field}>
                            <label
                                htmlFor="specialty"
                                className={styles.label}
                            >
                                Especialidade
                            </label>

                            <select
                                id="specialty"
                                className={styles.input}
                                value={specialtyId}
                                onChange={(e) =>
                                    setSpecialtyId(e.target.value)
                                }
                                required
                            >
                                <option value="" disabled>
                                    Selecione
                                </option>

                                {specialties.map((specialty) => (
                                    <option
                                        key={specialty.id}
                                        value={specialty.id}
                                    >
                                        {specialty.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="crefito"
                                className={styles.label}
                            >
                                CREFITO
                            </label>

                            <input
                                id="crefito"
                                type="text"
                                className={styles.input}
                                placeholder="Ex.: 123456-F"
                                value={crefito}
                                onChange={(e) =>
                                    setCrefito(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="city"
                                className={styles.label}
                            >
                                Cidade
                            </label>

                            <input
                                id="city"
                                type="text"
                                className={styles.input}
                                placeholder="Sua cidade"
                                value={city}
                                onChange={(e) =>
                                    setCity(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="sessionPrice"
                                className={styles.label}
                            >
                                Preço da sessão (R$)
                            </label>

                            <input
                                id="sessionPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                className={styles.input}
                                placeholder="150.00"
                                value={sessionPrice}
                                onChange={(e) =>
                                    setSessionPrice(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="experienceYears"
                                className={styles.label}
                            >
                                Anos de experiência
                            </label>

                            <input
                                id="experienceYears"
                                type="number"
                                min="0"
                                step="1"
                                className={styles.input}
                                placeholder="0"
                                value={experienceYears}
                                onChange={(e) =>
                                    setExperienceYears(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="serviceMode"
                                className={styles.label}
                            >
                                Modalidade
                            </label>

                            <select
                                id="serviceMode"
                                className={styles.input}
                                value={serviceMode}
                                onChange={(e) =>
                                    setServiceMode(
                                        e.target.value as ServiceMode
                                    )
                                }
                            >
                                <option value="IN_PERSON">
                                    Presencial
                                </option>

                                <option value="ONLINE">
                                    Online
                                </option>

                                <option value="BOTH">
                                    Presencial e Online
                                </option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="bio"
                                className={styles.label}
                            >
                                Bio (opcional)
                            </label>

                            <textarea
                                id="bio"
                                className={styles.input}
                                placeholder="Conte um pouco sobre você e sua forma de atender"
                                rows={4}
                                value={bio}
                                onChange={(e) =>
                                    setBio(e.target.value)
                                }
                            />
                        </div>

                        <button
                            className={styles.button}
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Salvando..." : "Salvar perfil"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
