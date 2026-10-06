"use client";

import { useEffect, useState } from "react";
import { getToken } from "../login/auth_service";
import { Physiotherapist } from "../types/physiotherapist";
import { Specialty } from "../types/specialty";

export default function PhysiotherapistsPage() {

    const [physiotherapists, setPhysiotherapists] = useState<Physiotherapist[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);

    const [city, setCity] = useState("");
    const [specialtyId, setSpecialtyId] = useState("");
    const [serviceMode, setServiceMode] = useState("");

    const [erro, setErro] = useState("");

    async function buscarFisioterapeutas() {

        setErro("");

        let url = "http://localhost:3000/api/physiotherapists";

        const params = new URLSearchParams();

        if (city != "") {
            params.append("city", city);
        }

        if (specialtyId != "") {
            params.append("specialtyId", specialtyId);
        }

        if (serviceMode != "") {
            params.append("serviceMode", serviceMode);
        }

        if (params.toString() != "") {
            url += "?" + params.toString();
        }

        const resp = await fetch(url, {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        });

        if (!resp.ok) {
            const error = await resp.json();
            setErro(error.message);
            return;
        }

        const dados = await resp.json();

        setPhysiotherapists(dados);
    }

    async function buscarEspecialidades() {

        const resp = await fetch(
            "http://localhost:3000/api/specialties",
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        if (!resp.ok) {
            return;
        }

        const dados = await resp.json();

        setSpecialties(dados);
    }

    function pesquisar(event: any) {
        event.preventDefault();
        buscarFisioterapeutas();
    }

    useEffect(() => {
        buscarFisioterapeutas();
        buscarEspecialidades();
    }, []);

    return (
        <div className="container py-5">

            <h1 className="mb-4">
                Encontre seu fisioterapeuta
            </h1>

            {erro != "" && (
                <p>{erro}</p>
            )}

            <div className="row">

                {/* FILTROS */}
                <div className="col-md-3">

                    <form
                        onSubmit={pesquisar}
                        className="card p-3"
                    >

                        <h5 className="mb-3">
                            Filtros
                        </h5>

                        <div className="mb-3">

                            <label className="form-label">
                                Cidade
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ex: Marau"
                            />

                        </div>

                        <div className="mb-3">

                            <label className="form-label">
                                Especialidade
                            </label>

                            <select
                                className="form-select"
                                value={specialtyId}
                                onChange={(e) => setSpecialtyId(e.target.value)}
                            >

                                <option value="">
                                    Todas
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

                        <div className="mb-3">

                            <label className="form-label">
                                Modalidade
                            </label>

                            <select
                                className="form-select"
                                value={serviceMode}
                                onChange={(e) => setServiceMode(e.target.value)}
                            >

                                <option value="">
                                    Todas
                                </option>

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

                        <button
                            className="btn btn-dark"
                            type="submit"
                        >
                            Buscar
                        </button>

                    </form>

                </div>


                {/* FISIOTERAPEUTAS */}
                <div className="col-md-9">

                    {physiotherapists.map((physio) => (

                        <div
                            key={physio.id}
                            className="card p-3 mb-3"
                        >

                            <div className="row">

                                <div className="col">

                                    <h5>
                                        {physio.profile.fullName}
                                    </h5>

                                    <p className="mb-1">
                                        {physio.specialty.name}
                                    </p>

                                    <p className="mb-1">
                                        {physio.city}
                                    </p>

                                    <p className="mb-0">
                                        CREFITO: {physio.crefito}
                                    </p>

                                </div>

                                <div className="col-auto">

                                    <strong>
                                        R$ {physio.sessionPrice.toFixed(2)}
                                    </strong>

                                </div>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}