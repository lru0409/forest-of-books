export const validateEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const validatePassword = (v: string): boolean =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/.test(v);

export const validateNickname = (v: string): boolean => /^[가-힣a-zA-Z0-9]{2,12}$/.test(v);
