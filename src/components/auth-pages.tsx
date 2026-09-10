import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, signIn, signUp } from "@/lib/auth";

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            My
          </span>
          <span className="ml-2 text-xl font-bold tracking-tight">
            Finance Compass
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}

function AuthForm({
  title,
  description,
  submitLabel,
  onSubmit,
  children,
  error,
  notice,
}: {
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  error: string;
  notice: string;
}) {
  return (
    <AuthLayout>
      <Card className="surface-card">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {children}
            {error && (
              <p
                role="alert"
                className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="rounded-md bg-positive-soft px-3 py-2 text-sm text-positive"
              >
                {notice}
              </p>
            )}
            <Button className="h-10 w-full" type="submit">
              {submitLabel}
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          required
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-10"
        />
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await signIn(email, password);
      await navigate({ to: "/" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível entrar agora.",
      );
    }
  };
  return (
    <AuthForm
      title="Entrar"
      description="Acesse seu painel financeiro pessoal."
      submitLabel="Entrar"
      onSubmit={submit}
      error={error}
      notice={notice}
    >
      <Field
        id="email"
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder="Sua senha"
      />
      <div className="flex justify-end">
        <Link
          to="/recuperar-senha"
          className="text-sm text-primary hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          to="/cadastro"
          className="font-medium text-primary hover:underline"
        >
          Criar cadastro
        </Link>
      </p>
    </AuthForm>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const result = await signUp(email, password, fullName);
      if (result.session) await navigate({ to: "/" });
      else setNotice("Cadastro criado. Confirme seu e-mail para entrar.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar sua conta agora.",
      );
    }
  };
  return (
    <AuthForm
      title="Criar cadastro"
      description="Comece a organizar sua vida financeira."
      submitLabel="Criar minha conta"
      onSubmit={submit}
      error={error}
      notice={notice}
    >
      <Field
        id="full-name"
        label="Nome"
        value={fullName}
        onChange={setFullName}
        autoComplete="name"
        placeholder="Seu nome"
      />
      <Field
        id="signup-email"
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />
      <Field
        id="signup-password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        placeholder="Mínimo de 6 caracteres"
      />
      <p className="text-center text-sm text-muted-foreground">
        Já possui uma conta?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthForm>
  );
}

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      await requestPasswordReset(email);
      setNotice(
        "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível solicitar a recuperação.",
      );
    }
  };
  return (
    <AuthForm
      title="Recuperar senha"
      description="Enviaremos um link para redefinir sua senha."
      submitLabel="Enviar instruções"
      onSubmit={submit}
      error={error}
      notice={notice}
    >
      <Field
        id="recovery-email"
        label="E-mail"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthForm>
  );
}
