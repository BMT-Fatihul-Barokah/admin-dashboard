"use client";

import { Button, ButtonProps } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getRoleTheme } from "@/lib/role-theme";

interface RoleActionButtonProps extends ButtonProps {
  allowedRoles: string[];
  action: string;
  tooltipMessage?: string;
  children: React.ReactNode;
}

export function RoleActionButton({
  allowedRoles,
  action,
  tooltipMessage = "Anda tidak memiliki izin untuk melakukan tindakan ini",
  children,
  className,
  ...props
}: RoleActionButtonProps) {
  const { user } = useAdminAuth();
  
  if (!user) return null;
  
  const isAllowed = allowedRoles.includes(user.role);
  const roleTheme = getRoleTheme(user.role);
  
  // For primary action buttons, apply role-specific colors
  const roleSpecificClass = props.variant === 'default' && isAllowed 
    ? roleTheme.primary 
    : '';
  
  // If the user is not allowed to perform this action, show a tooltip explaining why
  if (!isAllowed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              {...props}
              className={cn(className)}
              disabled={true}
            >
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If the user is allowed, render the button normally with role-specific styling
  return (
    <Button
      {...props}
      className={cn(className, roleSpecificClass)}
    >
      {children}
    </Button>
  );
}
