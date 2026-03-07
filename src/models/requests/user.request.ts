import { ParamsDictionary } from 'express-serve-static-core';

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

export interface IVerifyEmailRequestBody {
  emailVerificationToken: string;
}

export interface IForgotPasswordRequestBody {
  email: string;
}

export interface IResetPasswordRequestBody {
  forgotPasswordToken: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface IChangePasswordRequestBody {
  password: string;
  confirmPassword: string;
}

export interface IUpdateMeRequestBody {
  name?: string;
  dateOfBirth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export interface IGetUserProfileRequestParams extends ParamsDictionary {
  username: string;
}

export interface IFollowUserRequestBody {
  followedUserId: string;
}

export interface IUnfollowUserRequestParams extends ParamsDictionary {
  userId: string;
}
