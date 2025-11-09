import { SignIn } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>登录到 SoulLink</DialogTitle>
          <DialogDescription>
            登录后可以保存你的对话记录、加入群聊，并获得更多个性化功能
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none",
              },
            }}
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
