// app/(auth)/_model/auth.types.ts

export type SignInFormState = {
  email: string;
  password: string;
};

export type SignUpFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
