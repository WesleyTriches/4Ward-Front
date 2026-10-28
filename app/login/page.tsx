"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveToken } from "./auth_service";
import { ApiError } from "../services/apiClient";
import { getMyPhysiotherapist } from "../services/physiotherapistService";
import styles from "../auth.module.css";

export default function LoginPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [erro, setErro] = useState("");

    async function submitForm(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");

        const resp = await fetch(
            "http://localhost:3000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            }
        );

        if (!resp.ok) {
            const error = await resp.json();
            setErro(error.message);
            return;
        }

        const dados = await resp.json();

        saveToken(dados.access_token);

        if (dados.user.role !== "PHYSIOTHERAPIST") {
            router.replace("/consultas");
            return;
        }

        // 404 em /physiotherapists/me = perfil profissional ainda não criado
        try {
            await getMyPhysiotherapist();
            router.replace("/agenda");
        } catch (error) {
            if (error instanceof ApiError && error.status === 404) {
                router.replace("/cadastro-profissional");
            } else {
                router.replace("/agenda");
            }
        }
    }

    return (
        <main className={styles.page}>
            <div className={styles.container}>

                <div className={styles.logo}>
                    4Ward
                </div>

                <div className={styles.card}>
                    <h1 className={styles.title}>
                        Bem-vindo de volta
                    </h1>

                    <p className={styles.subtitle}>
                        Acesse sua conta para continuar.
                    </p>

                    {erro && (
                        <p className={styles.error}>
                            {erro}
                        </p>
                    )}

                    <form onSubmit={submitForm}>

                        <div className={styles.field}>
                            <label
                                htmlFor="email"
                                className={styles.label}
                            >
                                E-mail
                            </label>

                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label
                                htmlFor="password"
                                className={styles.label}
                            >
                                Senha
                            </label>

                            <div className={styles.password}>
                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className={styles.eyeButton}
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye"
                                                : "bi bi-eye-slash"
                                        }
                                    />
                                </button>
                            </div>
                        </div>

                        <button
                            className={styles.button}
                            type="submit"
                        >
                            Entrar
                        </button>

                    </form>

                    <p className={styles.footer}>
                        Ainda não tem uma conta?{" "}
                        <Link
                            href="/register"
                            className={styles.link}
                        >
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}