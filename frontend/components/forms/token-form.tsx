import Link from "next/link";
import { Separator } from "../ui/separator";
import { useState } from "react";
import apiService from "@/services/api";
import { toast } from "sonner";
import { Toast } from "@/components/toast";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function TokenForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const clientId = formData.get("twitch-client-id") as string;
    const oauthToken = formData.get("twitch-oauth-token") as string;

    if (!clientId) {
      setErrors((prev) => ({
        ...prev,
        clientId: "Client ID is required",
      }));
    } else if (!oauthToken) {
      setErrors((prev) => ({
        ...prev,
        oauthToken: "OAuth Token is required",
      }));
    }

    const response = await apiService.saveTokens(clientId, oauthToken);
    if (response.error) {
      toast.custom((t) => (
        <Toast
          t={t}
          variant="error"
          title="Error"
          description={`Failed to update tokens: ${response.message}`}
        />
      ));
    }

    window.location.reload();
  };

  return (
    <div className="w-full flex flex-col items-start justify-start gap-3">
      <Link
        href="http://localhost:42069/api/auth/login"
        className="w-full mt-1.5 cursor-pointer p-2 bg-purple-500 rounded-md text-white text-center hover:bg-purple-600 transition-all duration-100"
      >
        Authenticate with Twitch
      </Link>
      <Separator />
      <form
        onSubmit={onSubmit}
        className="w-full flex flex-col items-start justify-start gap-3"
      >
        <div className="w-full">
          <Label htmlFor="twitch-client-id">Twitch Client ID:</Label>
          <Input
            id="twitch-client-id"
            name="twitch-client-id"
            type="password"
          />
          <p className="text-sm text-red-500">
            {errors?.clientId ? errors.clientId : ""}
          </p>
        </div>
        <div className="w-full">
          <Label htmlFor="twitch-oauth-token">Twitch OAuth Token:</Label>
          <Input
            id="twitch-oauth-token"
            name="twitch-oauth-token"
            type="password"
          />
          <p className="text-sm text-red-500">
            {errors?.oauthToken ? errors.oauthToken : ""}
          </p>
        </div>
        <Button
          variant="secondary"
          type="submit"
          className="w-full mt-1.5 cursor-pointer"
        >
          Save
        </Button>
      </form>
    </div>
  );
}

export default TokenForm;
