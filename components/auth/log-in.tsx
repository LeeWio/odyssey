"use client";

import React, { useState, useRef } from "react";
import {
  Button,
  Modal,
  Label,
  TextField,
  Link,
  Separator,
  Form,
  Input,
  InputGroup,
  FieldError,
  Alert,
} from "@heroui/react";
import { Envelope, Eye, EyeSlash } from "@gravity-ui/icons";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/lib/features/auth";

export interface LogInProps {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const orDivider = (
  <div className="flex items-center gap-4 py-2">
    <Separator className="flex-1" />
    <p className="text-tiny text-default-500 shrink-0">OR</p>
    <Separator className="flex-1" />
  </div>
);

export const LogIn = ({ isOpen, onOpenChange }: LogInProps) => {
  const router = useRouter();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: containerRef });
  
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await login({ 
        username: data.email as string, 
        password: data.password as string 
      }).unwrap();
      
      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch {
      // Error is handled by RTK query state
    }
  };

  const switchView = contextSafe((showForm: boolean) => {
    const activeViewChildren = containerRef.current?.firstElementChild?.children;
    if (!activeViewChildren || activeViewChildren.length === 0) {
      setIsFormVisible(showForm);
      return;
    }
    
    gsap.to(activeViewChildren, {
      autoAlpha: 0,
      y: showForm ? -10 : 10,
      duration: 0.2,
      ease: "power2.in",
      stagger: 0.02,
      onComplete: () => setIsFormVisible(showForm),
    });
  });

  useGSAP(() => {
    const activeViewChildren = containerRef.current?.firstElementChild?.children;
    if (!activeViewChildren || activeViewChildren.length === 0) return;

    gsap.fromTo(
      activeViewChildren,
      { autoAlpha: 0, y: isFormVisible ? 15 : -15 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.2)", stagger: 0.05, clearProps: "all" }
    );
  }, [isFormVisible]);

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="mb-4 text-xl font-medium">Log In</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div ref={containerRef}>
                {isFormVisible ? (
                  <div
                    className="flex flex-col gap-y-3"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <Form
                      validationBehavior="native"
                      className="flex flex-col gap-4"
                      onSubmit={handleSubmit}
                    >
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
                        <Input placeholder="john@example.com" />
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
                        <InputGroup>
                          <InputGroup.Input
                            placeholder="Enter your password"
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
                              {isVisible ? <Eye className="size-4" /> : <EyeSlash className="size-4" />}
                            </Button>
                          </InputGroup.Suffix>
                        </InputGroup>
                        <FieldError />
                      </TextField>

                      <Button fullWidth type="submit" variant="primary" isPending={isLoading}>
                        Log In
                      </Button>
                    </Form>
                    {orDivider}
                    <Button fullWidth variant="secondary" onPress={() => switchView(false)}>
                      <Icon icon="solar:arrow-left-linear" />
                      Other Login options
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex flex-col gap-y-2 w-full"
                  >
                    <Button fullWidth variant="primary" onPress={() => switchView(true)}>
                      <Envelope className="pointer-events-none text-2xl" />
                      Continue with Email
                    </Button>
                    {orDivider}
                    <div className="flex flex-col gap-2">
                      <Button fullWidth variant="tertiary">
                        <Icon icon="devicon:google" />
                        Continue with Google
                      </Button>
                      <Button fullWidth variant="tertiary">
                        <Icon icon="mdi:github" />
                        Continue with Github
                      </Button>
                    </div>
                    <p className="text-small mt-3 text-center">
                      Need to create an account?&nbsp;
                      <Link href="#" className="no-underline">
                        Sign Up
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};