import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import TokenForm from "../forms/token-form";
import Link from "next/link";

type Props = {
  open: boolean;
  setOpenAction: (open: boolean) => void;
};

function TokenModal({ open, setOpenAction }: Props) {
  return (
    <Dialog open={open} defaultOpen={open} onOpenChange={setOpenAction}>
      <DialogTrigger className="sr-only">open token modal</DialogTrigger>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Authenticate with Twitch</DialogTitle>
          <DialogDescription>
            Authenticate with twitch or set your Twitch API tokens to enable
            Twitch features. You can generate the token and client ID using{" "}
            <Link
              href="https://twitchtokengenerator.com/"
              className="text-purple-400"
              target="_blank"
            >
              this website
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <TokenForm />
      </DialogContent>
    </Dialog>
  );
}

export default TokenModal;
