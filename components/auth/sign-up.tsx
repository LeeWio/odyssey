"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  InputGroup,
  Label,
  Link,
  Modal,
  Separator,
  Spinner,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "motion/react";
import type React from "react";
import { useCallback, useState } from "react";
import { useRegisterMutation } from "@/lib/features/auth";

export interface SignUpProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  onSwitchToLogIn?: () => void;
}

const orDivider = (
  <div className="flex items-center gap-4 py-2">
    <Separator className="flex-1" />
    <p className="text-tiny text-default-500 shrink-0">OR</p>
    <Separator className="flex-1" />
  </div>
);

export const SignUp = ({ isOpen, onOpenChange, onSwitchToLogIn }: SignUpProps) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" as const },
    },
    hidden: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.15, ease: "easeIn" as const },
    },
  };

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

        if (onOpenChange) {
          onOpenChange(false);
        }

        setTimeout(() => {
          setIsFormVisible(false);
          setIsVisible(false);
        }, 500);
      } catch {}
    };

    void submit();
  };

  const switchView = useCallback((showForm: boolean) => {
    setIsFormVisible(showForm);
  }, []);

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (onOpenChange) onOpenChange(open);
          if (!open) {
            setTimeout(() => {
              setIsFormVisible(false);
              setIsVisible(false);
            }, 300);
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-90">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="mb-4 text-xl font-medium">Sign Up</Modal.Heading>
            </Modal.Header>
            <Modal.Body data-scrollbar="none">
              <LazyMotion features={domAnimation}>
                <m.div layout transition={{ duration: 0.25, ease: "easeInOut" }}>
                  <AnimatePresence initial={false} mode="wait">
                    {isFormVisible ? (
                      <m.div
                        key="form"
                        className="flex w-full flex-col gap-y-3"
                        animate="visible"
                        exit="hidden"
                        initial="hidden"
                        variants={variants}
                      >
                        <Form
                          validationBehavior="native"
                          className="flex flex-col gap-4"
                          onSubmit={handleSubmit}
                        >
                          <TextField
                            isRequired
                            name="username"
                            minLength={3}
                            validate={(value) => {
                              if (value.length < 3) {
                                return "Username must be at least 3 characters";
                              }
                              return null;
                            }}
                          >
                            <Label>Username</Label>
                            <Input placeholder="johndoe" variant="secondary" />
                            <FieldError />
                          </TextField>

                          <TextField
                            isRequired
                            name="email"
                            type="email"
                            validate={(value) => {
                              if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
                                return "Please enter a valid email address";
                              }
                              return null;
                            }}
                          >
                            <Label>Email</Label>
                            <Input placeholder="john@example.com" variant="secondary" />
                            <FieldError />
                          </TextField>

                          <TextField
                            isRequired
                            minLength={8}
                            name="password"
                            validate={(value) => {
                              if (value.length < 8) {
                                return "Password must be at least 8 characters";
                              }
                              if (!/[A-Z]/.test(value)) {
                                return "Password must contain at least one uppercase letter";
                              }
                              if (!/[0-9]/.test(value)) {
                                return "Password must contain at least one number";
                              }
                              return null;
                            }}
                          >
                            <Label>Password</Label>
                            <InputGroup variant="secondary">
                              <InputGroup.Input
                                placeholder="Create a password"
                                type={isVisible ? "text" : "password"}
                              />
                              <InputGroup.Suffix className="pr-0">
                                <Button
                                  isIconOnly
                                  aria-label={isVisible ? "Hide password" : "Show password"}
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => setIsVisible(!isVisible)}
                                >
                                  {isVisible ? (
                                    <Icon
                                      icon="gravity-ui:eye"
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <Icon
                                      icon="gravity-ui:eye-slash"
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  )}
                                </Button>
                              </InputGroup.Suffix>
                            </InputGroup>
                            <FieldError />
                          </TextField>

                          <Button
                            fullWidth
                            type="submit"
                            variant="primary"
                            isPending={isRegLoading}
                          >
                            {({ isPending }) => (
                              <>
                                {isPending && <Spinner color="current" size="sm" />}
                                Sign Up
                              </>
                            )}
                          </Button>
                        </Form>
                        {orDivider}
                        <Button fullWidth variant="tertiary" onPress={() => switchView(false)}>
                          <Icon icon="solar:arrow-left-linear" aria-hidden="true" />
                          Other Sign Up options
                        </Button>
                      </m.div>
                    ) : (
                      <m.div
                        key="options"
                        className="flex w-full flex-col gap-y-2"
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={variants}
                      >
                        <Button fullWidth variant="secondary" onPress={() => switchView(true)}>
                          <Icon icon="gravity-ui:envelope" aria-hidden="true" />
                          Continue with Email
                        </Button>
                        {orDivider}
                        <Button fullWidth variant="tertiary">
                          <Icon icon="devicon:google" aria-hidden="true" /> Continue with Google
                        </Button>
                        <Button fullWidth variant="tertiary">
                          <Icon icon="devicon:github" aria-hidden="true" /> Continue with Github
                        </Button>
                        <p className="text-small mt-3 text-center">
                          Already have an account?&nbsp;
                          <Link onPress={onSwitchToLogIn}>Log In</Link>
                        </p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              </LazyMotion>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
