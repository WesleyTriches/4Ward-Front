import { Profile } from "./profile";
import { Specialty } from "./specialty";

export type ServiceMode =
  | "IN_PERSON"
  | "ONLINE"
  | "BOTH";

export type Physiotherapist = {
  id: number;
  profileId: number;
  specialtyId: number;
  crefito: string;
  bio?: string | null;
  sessionPrice: number;
  city: string;
  serviceMode: ServiceMode;
  experienceYears: number;
  rating?: number | null;

  profile: Profile;
  specialty: Specialty;
};

/** Corpo do POST /physiotherapists. O perfil pessoal vem do token. */
export type CreatePhysiotherapistInput = {
  specialtyId: number;
  crefito: string;
  bio?: string;
  sessionPrice: number;
  city: string;
  serviceMode: ServiceMode;
  experienceYears: number;
};

/** Corpo do PUT /physiotherapists/me. Mesmos campos do cadastro. */
export type UpdatePhysiotherapistInput = Partial<CreatePhysiotherapistInput>;
