"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, TextField, Input, Button, Alert, Link, Typography } from "@heroui/react";
import { useRegisterMutation, useLoginMutation } from "@/lib/features/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [register, { isLoading: isRegLoading, error: regError }] = useRegisterMutation();
  const [login] = useLoginMutation();

  const getErrorMessage = (error: unknown) => {
    const err = error as { data?: { message?: string }; error?: string };
    return err?.data?.message || err?.error || "An unknown error occurred";
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ username, email, password }).unwrap();
      // Auto-login after registration
      await login({ username, password }).unwrap();
      router.push("/");
    } catch {
      // Error is handled by RTK query state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <Card.Header className="flex flex-col gap-1 items-start">
          <Typography type="h3" weight="bold">
            Create an Account
          </Typography>
          <p className="text-sm text-muted-foreground">Sign up to get started.</p>
        </Card.Header>

        <form onSubmit={handleRegister}>
          <Card.Content className="flex flex-col gap-4">
            {regError && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Registration Failed</Alert.Title>
                  <Alert.Description>{getErrorMessage(regError)}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <TextField>
              <Input
                aria-label="Username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </TextField>

            <TextField>
              <Input
                type="email"
                aria-label="Email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </TextField>

            <TextField>
              <Input
                type="password"
                aria-label="Password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </TextField>
          </Card.Content>

          <Card.Footer className="flex flex-col gap-4">
            <Button type="submit" variant="primary" className="w-full" isPending={isRegLoading}>
              Sign Up
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary">
                Sign in
              </Link>
            </p>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
}
