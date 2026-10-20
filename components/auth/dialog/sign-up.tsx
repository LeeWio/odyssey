"use client";

import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  InputGroup,
  Label,
  Spinner,
  TextField,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterMutation } from "@/lib/features/auth";
import { useRegistrationSession } from "../hooks/use-registration-session";
import { isValidEmail } from "../utils/email";
import { validatePassword } from "../utils/password";
import { AuthDivider, AuthSwitchPrompt } from "./auth-prompts";
import { AuthView } from "./auth-shell";
import { AuthStep } from "./auth-step";
import { SocialLoginButtons } from "./social-login-buttons";

export interface SignupContentProps {
  /** False while the dialog is closed or showing login. A late registration must not open the review step. */
  isActive?: boolean;
  onDone: () => void;
  onSwitchToLogIn?: () => void;
}

export const SignupContent = ({ isActive = true, onDone, onSwitchToLogIn }: SignupContentProps) => {
  const t = useTranslations("Auth");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const wasActive = useRef(false);
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [register, { isLoading: isRegLoading }] = useRegisterMutation();
  const { isPendingReview, submit } = useRegistrationSession(isActive, register);

  useEffect(() => {
    if (!isActive) {
      wasActive.current = false;
      return;
    }
    if (wasActive.current) return;
    wasActive.current = true;
    setIsFormVisible(false);
    setIsVisible(false);
    setPassword("");
    setConfirmPassword("");
  }, [isActive]);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    void submit({
      username: data.username as string,
      email: data.email as string,
      password: data.password as string,
    }).catch(() => {
      // The mutation displays the server error through the shared API toast handler.
    });
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

  if (isPendingReview) {
    return (
      <AuthView title={t("signUp")}>
        <AuthStep stepKey="pending-review">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t("registrationPendingTitle")}</Alert.Title>
              <Alert.Description>{t("registrationPendingBody")}</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button autoFocus fullWidth variant="primary" onPress={onDone}>
            {t("registrationPendingDone")}
          </Button>
        </AuthStep>
      </AuthView>
    );
  }

  return (
    <AuthView title={t("signUp")}>
      {isFormVisible ? (
        <AuthStep stepKey="form">
          <Form validationBehavior="native" className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              isRequired
              minLength={3}
              name="username"
              variant="secondary"
              validate={(value) => (value.length < 3 ? t("usernameMin") : null)}
            >
              <Label>{t("username")}</Label>
              <Input autoFocus className="w-full" placeholder="johndoe" />
              <FieldError />
            </TextField>

            <TextField
              fullWidth
              isRequired
              name="email"
              type="email"
              variant="secondary"
              validate={(value) => (isValidEmail(value) ? null : t("validEmail"))}
            >
              <Label>{t("email")}</Label>
              <Input className="w-full" placeholder="john@example.com" />
              <FieldError />
            </TextField>

            <TextField
              fullWidth
              isRequired
              minLength={8}
              name="password"
              value={password}
              variant="secondary"
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
              <InputGroup fullWidth>
                <InputGroup.Input
                  placeholder="Create a password"
                  type={isVisible ? "text" : "password"}
                />
                <InputGroup.Suffix>
                  <Tooltip delay={300}>
                    <Button
                      isIconOnly
                      aria-label={isVisible ? t("hidePassword") : t("showPassword")}
                      aria-pressed={isVisible}
                      excludeFromTabOrder
                      size="sm"
                      variant="ghost"
                      onPress={() => setIsVisible(!isVisible)}
                    >
                      {isVisible ? (
                        <Icon icon="gravity-ui:eye" className="size-4" aria-hidden="true" />
                      ) : (
                        <Icon icon="gravity-ui:eye-slash" className="size-4" aria-hidden="true" />
                      )}
                    </Button>
                    <Tooltip.Content>
                      {isVisible ? t("hidePassword") : t("showPassword")}
                    </Tooltip.Content>
                  </Tooltip>
                </InputGroup.Suffix>
              </InputGroup>
              <FieldError />
            </TextField>

            <TextField
              fullWidth
              isRequired
              name="confirmPassword"
              type={isVisible ? "text" : "password"}
              value={confirmPassword}
              variant="secondary"
              onChange={setConfirmPassword}
              validate={(value) => (value !== password ? t("passwordMismatch") : null)}
            >
              <Label>{t("confirmPassword")}</Label>
              <Input className="w-full" placeholder="Repeat your password" />
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
            <Icon icon="gravity-ui:arrow-shape-turn-up-left" aria-hidden="true" />
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
