export type Specialty = {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
};

/** Corpo do POST /specialties e do PUT /specialties/:id. */
export type SpecialtyInput = {
  /** Obrigatório, 2 a 100 caracteres, único */
  name: string;
  description?: string;
  icon?: string;
};
