"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveToken } from "../login/auth_service";
import styles from "../auth.module.css";

export default function RegisterPage() {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("PATIENT");

    const [erro, setErro] = useState("");

    async function submitForm(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setErro("");

        const resp = await fetch(
            "http://localhost:3000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
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

        // Fisioterapeuta recém-cadastrado ainda não tem perfil profissional
        if (role === "PHYSIOTHERAPIST") {
            router.replace("/cadastro-profissional");
        } else {
            router.replace("/consultas");
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
                        Crie sua conta
                    </h1>

                    <p className={styles.subtitle}>
                        Cadastre-se para começar a usar o 4Ward.
                    </p>

                    {erro && (
                        <p className={styles.error}>
                            {erro}
                        </p>
                    )}

                    <form onSubmit={submitForm}>

                        <div className={styles.field}>
                            <label
                                htmlFor="name"
                                className={styles.label}
                            >
                                Nome
                            </label>

                            <input
                                id="name"
                                type="text"
                                className={styles.input}
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />
                        </div>

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

                        <div className={styles.field}>
                            <label
                                htmlFor="role"
                                className={styles.label}
                            >
                                Tipo de usuário
                            </label>

                            <select
                                id="role"
                                className={styles.input}
                                value={role}
                                onChange={(e) =>
                                    setRole(e.target.value)
                                }
                            >
                                <option value="PATIENT">
                                    Paciente
                                </option>

                                <option value="PHYSIOTHERAPIST">
                                    Fisioterapeuta
                                </option>
                            </select>
                        </div>

                        <button
                            className={styles.button}
                            type="submit"
                        >
                            Criar conta
                        </button>
                    </form>

                    <p className={styles.footer}>
                        Já possui uma conta?{" "}
                        <Link
                            href="/login"
                            className={styles.link}
                        >
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}