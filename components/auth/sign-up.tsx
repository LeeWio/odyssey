"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMounted } from "@mantine/hooks";
import { Icon } from "@iconify/react";
import { useIsPresent } from "motion/react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useState } from "react";
import { useRegisterMutation } from "@/lib/features/auth";
import { validatePassword } from "./auth-utils";
import { AuthView, AuthDivider, AuthStep, AuthSwitchPrompt } from "./auth-layout";
import { SocialLoginButtons } from "./social-login-buttons";

export interface SignupContentProps {
  onSuccess: () => void;
  onSwitchToLogIn?: () => void;
}

export const SignupContent = ({ onSuccess, onSwitchToLogIn }: SignupContentProps) => {
  const t = useTranslations("Auth");
  const isPresent = useIsPresent();
  const mounted = useMounted();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [register, { isLoading: isRegLoading }] = useRegisterMutation();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const submit = async () => {
      try {
        await register({
          username: data.username as string,
          email: data.email as string,
          password: data.password as string,
        }).unwrap();

        if (mounted && isPresent) onSuccess();
      } catch {
        // The mutation displays the server error through the shared API toast handler.
      }
    };

    void submit();
  };

  const switchView = useCallback((showForm: boolean) => {
    if (showForm) {
      setIsFormVisible(true);
    } else {
      setIsFormVisible(false);
      setIsVisible(false);
      setPassword("");
      setConfirmPassword("");
    }
  }, []);

  return (
    <AuthView title={t("signUp")}>
      {isFormVisible ? (
        <AuthStep stepKey="form">
          <Form validationBehavior="native" className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField
              isRequired
              name="username"
              minLength={3}
              validate={(value) => {
                if (value.length < 3) {
                  return t("usernameMin");
                }
                return null;
              }}
            >
              <Label>{t("username")}</Label>
              <Input
                autoFocus
                id="sign-up-username"
                name="username"
                placeholder="johndoe"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              name="email"
              type="email"
              validate={(value) => {
                if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                  return t("validEmail");
                }
                return null;
              }}
            >
              <Label>{t("email")}</Label>
              <Input
                id="sign-up-email"
                name="email"
                placeholder="john@example.com"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              minLength={8}
              name="password"
              value={password}
              onChange={setPassword}
              validate={(value) =>
                validatePassword(value, {
                  min: t("passwordMin"),
                  uppercase: t("passwordUppercase"),
                  number: t("passwordNumber"),
                })
              }
            >
              <Label>{t("password")}</Label>
              <InputGroup variant="secondary">
                <InputGroup.Input
                  id="sign-up-password"
                  name="password"
                  placeholder="Create a password"
                  type={isVisible ? "text" : "password"}
                />
                <InputGroup.Suffix className="pr-0">
                  <Button
                    isIconOnly
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    aria-pressed={isVisible}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onPress={() => setIsVisible(!isVisible)}
                  >
                    {isVisible ? (
                      <Icon icon="gravity-ui:eye" className="size-4" aria-hidden="true" />
                    ) : (
                      <Icon icon="gravity-ui:eye-slash" className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              <FieldError />
            </TextField>

            <TextField
              isRequired
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              validate={(value) => (value !== password ? t("passwordMismatch") : null)}
            >
              <Label>{t("confirmPassword")}</Label>
              <Input
                id="sign-up-confirm-password"
                name="confirmPassword"
                placeholder="Repeat your password"
                type={isVisible ? "text" : "password"}
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <Button fullWidth type="submit" variant="primary" isPending={isRegLoading}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {t("signUp")}
                </>
              )}
            </Button>
          </Form>
          <AuthDivider />
          <Button fullWidth variant="tertiary" onPress={() => switchView(false)}>
            <Icon icon="solar:arrow-left-linear" aria-hidden="true" />
            {t("otherOptions")}
          </Button>
        </AuthStep>
      ) : (
        <AuthStep stepKey="options" className="gap-y-2">
          <Button autoFocus fullWidth variant="secondary" onPress={() => switchView(true)}>
            <Icon icon="gravity-ui:envelope" aria-hidden="true" />
            {t("continueWithEmail")}
          </Button>
          <AuthDivider />
          <SocialLoginButtons isDisabled={isRegLoading} />
          <AuthSwitchPrompt
            text={t("alreadyHaveAccount")}
            actionLabel={t("login")}
            onAction={onSwitchToLogIn}
          />
        </AuthStep>
      )}
    </AuthView>
  );
};
