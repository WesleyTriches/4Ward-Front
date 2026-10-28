export type Profile = {
  id: number;
  userId: number;
  fullName: string;
  phone?: string | null;
  birthDate?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Corpo do PUT /profiles/me. Só os campos enviados são alterados. */
export type UpdateProfileInput = {
  fullName?: string;
  /** "AAAA-MM-DD" */
  birthDate?: string;
  avatarUrl?: string;
};
