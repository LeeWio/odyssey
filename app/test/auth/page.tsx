import { notFound } from "next/navigation";
import AuthTestClient from "./auth-test-client";

export default function AuthTestPage() {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_AUTH_TEST_ROUTE !== "1") {
    notFound();
  }
  return <AuthTestClient />;
}
