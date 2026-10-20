import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SOCIAL_LOGIN_PROVIDERS, startOAuthLogin, type OAuthProvider } from "../utils/oauth";

interface SocialLoginButtonsProps {
  isDisabled?: boolean;
}

export const SocialLoginButtons = ({ isDisabled = false }: SocialLoginButtonsProps) => {
  const t = useTranslations("Auth");
  const [pendingProvider, setPendingProvider] = useState<OAuthProvider | null>(null);
  const isRedirecting = pendingProvider !== null;

  return (
    <div className="flex flex-col gap-2">
      {SOCIAL_LOGIN_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          fullWidth
          isDisabled={isDisabled || isRedirecting || !provider.enabled}
          isPending={pendingProvider === provider.id}
          variant="tertiary"
          onPress={() => {
            setPendingProvider(provider.id);
            startOAuthLogin(provider.id);
          }}
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <Icon icon={provider.icon} aria-hidden="true" />
              )}
              {t("continueWith", { provider: provider.label })}
            </>
          )}
        </Button>
      ))}
    </div>
  );
};
