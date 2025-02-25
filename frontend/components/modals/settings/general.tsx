import TokenForm from "@/components/forms/token-form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";

function General() {
  const { isAuthenticated, isAuthLoaded } = useAuth();
  return (
    <>
      {!isAuthenticated && isAuthLoaded && (
        <div className="aspect-video max-w-3xl rounded-xl bg-muted/50 p-3 flex flex-col items-start justify-start gap-2">
          <h1 className="text-xl font-semibold">Twitch API Configuration</h1>
          <Separator className="h-2" />
          <TokenForm />
        </div>
      )}
    </>
  );
}

export default General;
