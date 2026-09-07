import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { startOAuthLogin, type OAuthProvider } from "./auth-utils";

interface SocialLoginButtonsProps {
  isDisabled?: boolean;
}

const providers: Array<{ id: OAuthProvider; label: string; icon: string }> = [
  { id: "google", label: "Google", icon: "devicon:google" },
  { id: "github", label: "GitHub", icon: "devicon:github" },
];

export const SocialLoginButtons = ({ isDisabled = false }: SocialLoginButtonsProps) => (
  <div className="flex flex-col gap-2">
    {providers.map((provider) => (
      <Button
        key={provider.id}
        fullWidth
        isDisabled={isDisabled}
        variant="tertiary"
        onPress={() => startOAuthLogin(provider.id)}
      >
        <Icon icon={provider.icon} aria-hidden="true" />
        Continue with {provider.label}
      </Button>
    ))}
  </div>
);
