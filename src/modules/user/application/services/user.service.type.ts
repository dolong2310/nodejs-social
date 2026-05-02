export interface CreateUserPayload {
  id: string;
  name: string;
  email: string;
  password?: string;
  birthday: string;
  isEmailVerified?: boolean;
}
