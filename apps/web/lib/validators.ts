export const isValidEmail = (value: string): boolean =>
  !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isValidPassword = (value: string): boolean =>
  !!value && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(value);

export const isValidNickname = (value: string): boolean =>
  !!value && /^[가-힣a-zA-Z0-9]{2,12}$/.test(value);
