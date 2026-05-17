"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, TextField, Input, Button, Alert, Link, Typography } from "@heroui/react";
import { useLoginMutation } from "@/lib/features/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();

  const getErrorMessage = (error: unknown) => {
    const err = error as { data?: { message?: string }; error?: string };
    return err?.data?.message || err?.error || "An unknown error occurred";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
            Welcome Back
          </Typography>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue.</p>
        </Card.Header>

        <form onSubmit={handleLogin}>
          <Card.Content className="flex flex-col gap-4">
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Login Failed</Alert.Title>
                  <Alert.Description>{getErrorMessage(error)}</Alert.Description>
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
            <Button type="submit" variant="primary" className="w-full" isPending={isLoading}>
              Sign In
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary">
                Sign up
              </Link>
            </p>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
}
