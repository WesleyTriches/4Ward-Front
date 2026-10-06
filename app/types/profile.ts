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