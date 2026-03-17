export interface IRegisterRequestBody {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

export interface ILoginRequestBody {
  email: string;
  password: string;
}

export interface ILogoutRequestBody {
  refreshToken: string;
}

export interface IRefreshTokenRequestBody {
  refreshToken: string;
}

export interface IVerifyEmailRequestBody {
  token: string;
}

export interface IForgotPasswordRequestBody {
  email: string;
}

export interface IResetPasswordRequestBody {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IChangePasswordRequestBody {
  password: string;
  confirmPassword: string;
}
