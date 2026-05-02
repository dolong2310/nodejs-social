export const UserNotFoundException = new Error('User not found');
export const UserAlreadyExistsException = new Error('User already exists');
export const UsernameAlreadyExistsException = new Error('Username already exists');
export const UserAlreadyVerifiedException = new Error('User already verified');
export const CannotViewUserProfileBlockedException = new Error(
  'You cannot view this profile due to a block between accounts'
);
export const UserIsInactiveException = new Error('User is inactive');
// export const UserNotVerifiedYetException = new Error('User not verified yet');
export const UserIsBannedException = new Error('User is banned');
