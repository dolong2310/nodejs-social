import { EUserVerificationStatus } from '@/domain/enums/users.enum';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  dateOfBirth: Date;
  verificationStatus?: EUserVerificationStatus;
  emailVerificationToken?: string;
  forgotPasswordToken?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserEntity {
  private _id!: string;
  private _name!: string;
  private _email!: string;
  private _password!: string;
  private _dateOfBirth!: Date;
  private _verificationStatus!: EUserVerificationStatus;
  private _emailVerificationToken!: string;
  private _forgotPasswordToken!: string;
  private _bio!: string;
  private _location!: string;
  private _website!: string;
  private _username!: string;
  private _avatar!: string;
  private _coverPhoto!: string;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get name(): string {
    return this._name;
  }
  private set name(value: string) {
    this._name = value;
  }

  public get email(): string {
    return this._email;
  }
  private set email(value: string) {
    this._email = value;
  }

  public get password(): string {
    return this._password;
  }
  private set password(value: string) {
    this._password = value;
  }

  public get dateOfBirth(): Date {
    return this._dateOfBirth;
  }
  private set dateOfBirth(value: Date) {
    this._dateOfBirth = value;
  }

  public get verificationStatus(): EUserVerificationStatus {
    return this._verificationStatus;
  }
  private set verificationStatus(value: EUserVerificationStatus) {
    this._verificationStatus = value;
  }

  public get emailVerificationToken(): string {
    return this._emailVerificationToken;
  }
  private set emailVerificationToken(value: string) {
    this._emailVerificationToken = value;
  }

  public get forgotPasswordToken(): string {
    return this._forgotPasswordToken;
  }
  private set forgotPasswordToken(value: string) {
    this._forgotPasswordToken = value;
  }

  public get bio(): string {
    return this._bio;
  }
  private set bio(value: string) {
    this._bio = value;
  }

  public get location(): string {
    return this._location;
  }
  private set location(value: string) {
    this._location = value;
  }

  public get website(): string {
    return this._website;
  }
  private set website(value: string) {
    this._website = value;
  }

  public get username(): string {
    return this._username;
  }
  private set username(value: string) {
    this._username = value;
  }

  public get avatar(): string {
    return this._avatar;
  }
  private set avatar(value: string) {
    this._avatar = value;
  }

  public get coverPhoto(): string {
    return this._coverPhoto;
  }
  private set coverPhoto(value: string) {
    this._coverPhoto = value;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
  private set createdAt(value: Date) {
    this._createdAt = value;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }
  private set updatedAt(value: Date) {
    this._updatedAt = value;
  }

  private constructor(data: IUser) {
    const date = new Date();
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.dateOfBirth = data.dateOfBirth;
    this.verificationStatus = data.verificationStatus ?? EUserVerificationStatus.UNVERIFIED;
    this.emailVerificationToken = data.emailVerificationToken ?? '';
    this.forgotPasswordToken = data.forgotPasswordToken ?? '';
    this.bio = data.bio ?? '';
    this.location = data.location ?? '';
    this.website = data.website ?? '';
    this.username = data.username ?? '';
    this.avatar = data.avatar ?? '';
    this.coverPhoto = data.coverPhoto ?? '';
    this.createdAt = data.createdAt ?? date;
    this.updatedAt = data.updatedAt ?? date;
  }

  public static create(data: IUser): UserEntity {
    return new UserEntity(data);
  }
}
