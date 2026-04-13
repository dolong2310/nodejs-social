export class GetGoogleAuthUrlPayloadDTO {
  ip: string;
  userAgent: string;
  constructor(payload: { ip: string; userAgent: string }) {
    this.ip = payload.ip;
    this.userAgent = payload.userAgent;
  }
}

export class OAuthGoogleLoginPayloadDTO {
  state: string;
  code: string;
  constructor(payload: { state: string; code: string }) {
    this.state = payload.state;
    this.code = payload.code;
  }
}
