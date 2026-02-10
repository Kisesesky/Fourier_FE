// app/(auth)/_model/auth.constants.ts

import type { SignInFormState, SignUpFormState } from "./auth.types";

export const AUTH_PATHS = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  findPassword: "/find-password",
  home: "/",
} as const;

export const SIGN_IN_INITIAL_STATE: SignInFormState = {
  email: "",
  password: "",
};

export const SIGN_UP_INITIAL_STATE: SignUpFormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};
