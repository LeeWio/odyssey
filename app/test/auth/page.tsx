"use client";

import React, { useState } from "react";
import {
  Card,
  TextField,
  Label,
  Input,
  Button,
  Separator,
  Alert,
  Typography,
  Table,
  Chip,
} from "@heroui/react";
import {
  useLoginMutation,
  useRegisterMutation,
  selectIsAuthenticated,
  selectCurrentToken,
  selectCurrentUser,
  removeCredentials,
} from "@/lib/features/auth";
import { useGetAllUsersQuery } from "@/lib/features/user";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useMounted } from "@/hooks/use-mounted";

export default function AuthTestPage() {
  const mounted = useMounted();
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("Password123!");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [login, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
  const [register, { isLoading: isRegLoading, error: regError }] = useRegisterMutation();

  const { data: users, isLoading: isUsersLoading } = useGetAllUsersQuery(undefined, {
    skip: !mounted,
  });

  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const token = useAppSelector(selectCurrentToken);
  const user = useAppSelector(selectCurrentUser);

  if (!mounted) return null;

  // Helper to extract error message from RTK Query error object
  const getErrorMessage = (error: any) => {
    return error?.data?.message || error?.error || "An unknown error occurred";
  };

  const handleLogin = async () => {
    try {
      await login({ username: loginUsername, password: loginPassword }).unwrap();
    } catch (err) {
      // Error is also available in loginError from the hook
    }
  };

  const handleRegister = async () => {
    try {
      await register({ username: regUsername, email: regEmail, password: regPassword }).unwrap();
      alert("Registration successful!");
    } catch (err) {
      // Error is also available in regError from the hook
    }
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Auth Module Test Page
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* State Monitor */}
        <Card className="col-span-1 md:col-span-2">
          <Card.Header>
            <Card.Title>Redux Auth State</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <span className="font-bold">Authenticated:</span>
              <Typography.Code className={isAuthenticated ? "text-success" : "text-danger"}>
                {String(isAuthenticated)}
              </Typography.Code>
            </div>
            <div className="flex gap-4 items-center">
              <span className="font-bold">Current User:</span>
              <Typography.Code>{user || "null"}</Typography.Code>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-bold">Token:</span>
              <div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap bg-surface-secondary p-2 rounded text-xs border border-border">
                {token || "no token available"}
              </div>
            </div>
            {isAuthenticated && (
              <Button
                color="danger"
                variant="ghost"
                size="sm"
                className="mt-2 w-fit"
                onPress={() => dispatch(removeCredentials())}
              >
                Clear Credentials (Logout)
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Login Test */}
        <Card>
          <Card.Header>
            <Card.Title>Test Login Mutation</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {loginError && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Login Failed</Alert.Title>
                  <Alert.Description>{getErrorMessage(loginError)}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <TextField>
              <Label>Username</Label>
              <Input value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Password</Label>
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </TextField>
            <Button color="primary" isLoading={isLoginLoading} onPress={handleLogin}>
              Execute Login
            </Button>
          </Card.Content>
        </Card>

        {/* Register Test */}
        <Card>
          <Card.Header>
            <Card.Title>Test Register Mutation</Card.Title>
          </Card.Header>
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
              <Label>Username</Label>
              <Input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Email</Label>
              <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Password</Label>
              <Input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </TextField>
            <Button color="primary" isLoading={isRegLoading} onPress={handleRegister}>
              Execute Register
            </Button>
          </Card.Content>
        </Card>
      </div>

      {/* Users List Table */}
      <Card>
        <Card.Header>
          <Card.Title>All Registered Users</Card.Title>
        </Card.Header>
        <Card.Content>
          {isUsersLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <Table aria-label="Users list table">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>ID</Table.Column>
                    <Table.Column>USERNAME</Table.Column>
                    <Table.Column>EMAIL</Table.Column>
                    <Table.Column>STATUS</Table.Column>
                    <Table.Column>ROLES</Table.Column>
                  </Table.Header>
                  <Table.Body renderEmptyState={() => "No users found."}>
                    {(users || []).map((userItem) => (
                      <Table.Row key={userItem.id}>
                        <Table.Cell>{userItem.id}</Table.Cell>
                        <Table.Cell className="font-medium">{userItem.username}</Table.Cell>
                        <Table.Cell>{userItem.email}</Table.Cell>
                        <Table.Cell>
                          <Chip
                            size="sm"
                            color={
                              userItem.status === "ACTIVE"
                                ? "success"
                                : userItem.status === "BANNED" || userItem.status === "DELETED"
                                  ? "danger"
                                  : "warning"
                            }
                            variant="soft"
                          >
                            {userItem.status}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex gap-1 flex-wrap">
                            {userItem.roles?.map((r) => (
                              <Chip key={r} size="sm" variant="soft" color="accent">
                                {r}
                              </Chip>
                            ))}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      <Separator className="my-4" />

      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Testing Instructions</Alert.Title>
          <Alert.Description>
            Use this page to verify your RTK Query Auth implementation. Login will automatically
            update the Redux state above.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    </div>
  );
}
