import { NavLink } from "@/components/NavLink";
import { MessageCircle, Users, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    to: "/",
    icon: MessageCircle,
    label: "陪伴",
  },
  {
    to: "/group",
    icon: Users,
    label: "群聊",
  },
  {
    to: "/archive",
    icon: FileText,
    label: "档案",
  },
  {
    to: "/profile",
    icon: User,
    label: "我的",
  },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-elevated">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300"
              activeClassName="text-primary"
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      isActive && "scale-110"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium transition-all duration-300",
                      isActive ? "opacity-100" : "opacity-60"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
