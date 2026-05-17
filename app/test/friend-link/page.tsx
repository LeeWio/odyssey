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
} from "@heroui/react";
import {
  useGetPublicFriendLinksQuery,
  useApplyFriendLinkMutation,
  useGetAdminFriendLinksQuery,
  useModerateFriendLinkMutation,
} from "@/lib/features/friend-link";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAuthenticated, selectIsAdmin, selectUserRoles } from "@/lib/features/auth";
import { useMounted } from "@/hooks/use-mounted";

export default function FriendLinkTestPage() {
  const mounted = useMounted();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const roles = useAppSelector(selectUserRoles);

  // Queries
  const { data: publicLinks, isLoading: isPublicLoading } = useGetPublicFriendLinksQuery();
  const {
    data: adminLinks,
    isLoading: isAdminLoading,
    error: adminQueryError,
  } = useGetAdminFriendLinksQuery({ page: 0, size: 10 }, { skip: !isAdmin });

  // Mutations
  const [apply, { isLoading: isApplyLoading, error: applyError }] = useApplyFriendLinkMutation();
  const [moderate, { isLoading: isModerateLoading, error: moderateError }] =
    useModerateFriendLinkMutation();

  if (!mounted) return null;

  // Helper to extract error message from RTK Query error object
  const getErrorMessage = (error: any) => {
    return error?.data?.message || error?.error || "An unknown error occurred";
  };

  const handleApply = async () => {
    try {
      await apply({ name, url, email }).unwrap();
      setName("");
      setUrl("");
      setEmail("");
    } catch (err) {
      // Toast is handled in API layer, Alert is handled in UI below
    }
  };

  const handleModerate = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      await moderate({ id, status }).unwrap();
    } catch (err) {
      // Toast is handled in API layer
    }
  };

  return (
    <div className="container mx-auto p-8 flex flex-col gap-8">
      <Typography type="h1" weight="bold">
        Friend Link Module Test Page
      </Typography>

      <div className="flex gap-4 items-center bg-default-50 p-4 rounded-xl border border-border">
        <span className="font-bold">Auth Info:</span>
        <span className="text-sm">Authenticated: {String(isAuthenticated)}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm">Admin: {String(isAdmin)}</span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-sm">Roles: {roles.join(", ") || "none"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Public List */}
        <Card>
          <Card.Header>
            <Card.Title>Approved Friend Links (Public)</Card.Title>
          </Card.Header>
          <Card.Content>
            {isPublicLoading ? (
              <p>Loading...</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {publicLinks?.map((link) => (
                  <li
                    key={link.id}
                    className="p-2 border border-border rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold">{link.name}</span>
                      <p className="text-xs text-muted">{link.url}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>

        {/* Application Form */}
        <Card>
          <Card.Header>
            <Card.Title>Apply for Friend Link</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            {applyError && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Application Failed</Alert.Title>
                  <Alert.Description>{getErrorMessage(applyError)}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <TextField>
              <Label>Site Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Site URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} />
            </TextField>
            <TextField>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </TextField>
            <Button color="primary" isLoading={isApplyLoading} onPress={handleApply}>
              Submit Application
            </Button>
          </Card.Content>
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <Card className="lg:col-span-2">
            <Card.Header>
              <Card.Title>Friend Link Management (Admin Only)</Card.Title>
            </Card.Header>
            <Card.Content>
              {adminQueryError && (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Query Failed</Alert.Title>
                    <Alert.Description>{getErrorMessage(adminQueryError)}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
              {moderateError && (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Moderation Failed</Alert.Title>
                    <Alert.Description>{getErrorMessage(moderateError)}</Alert.Description>
                  </Alert.Content>
                </Alert>
              )}
              {isAdminLoading ? (
                <p>Loading admin data...</p>
              ) : (
                <Table aria-label="Friend links management table">
                  <Table.ScrollContainer>
                    <Table.Content>
                      <Table.Header>
                        <Table.Column isRowHeader>NAME</Table.Column>
                        <Table.Column>URL</Table.Column>
                        <Table.Column>STATUS</Table.Column>
                        <Table.Column>ACTIONS</Table.Column>
                      </Table.Header>
                      <Table.Body renderEmptyState={() => "No applications found."}>
                        {(adminLinks?.list || []).map((link) => (
                          <Table.Row key={link.id}>
                            <Table.Cell>{link.name}</Table.Cell>
                            <Table.Cell>{link.url}</Table.Cell>
                            <Table.Cell>{link.status}</Table.Cell>
                            <Table.Cell>
                              <div className="flex gap-2">
                                {link.status === "APPLYING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      color="success"
                                      onPress={() => handleModerate(link.id, "APPROVED")}
                                      isLoading={isModerateLoading}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      color="danger"
                                      onPress={() => handleModerate(link.id, "REJECTED")}
                                      isLoading={isModerateLoading}
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}
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
        )}

        {!isAdmin && (
          <Alert status="warning" className="lg:col-span-2">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Admin Access Required</Alert.Title>
              <Alert.Description>Login as an admin to see the management table.</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
    </div>
  );
}
