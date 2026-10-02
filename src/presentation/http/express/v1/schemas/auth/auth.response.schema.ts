import { type InferOutput, object, string } from 'valibot';

export const AccessTokenResponseSchema = object({ accessToken: string() });
export type AccessTokenResponse = InferOutput<typeof AccessTokenResponseSchema>;

export const Enable2faResponseSchema = object({ secret: string(), uri: string() });
export type Enable2faResponse = InferOutput<typeof Enable2faResponseSchema>;
