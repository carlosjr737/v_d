import { Button } from "./ui/Button";

type AuthPromptProps = {
  onSignInWithGoogle: () => void;
  onSignInWithEmail: () => void;
};

export const AuthPrompt = ({
  onSignInWithGoogle,
  onSignInWithEmail
}: AuthPromptProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Faça login rapidinho para liberar o Passe Anual.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onSignInWithGoogle}
          fullWidth
        >
          Entrar com Google
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSignInWithEmail}
          fullWidth
        >
          Entrar com Email
        </Button>
      </div>
    </div>
  );
};

export type { AuthPromptProps };
