import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { PermissionGuard } from '@/components/permission-guard';
import { Permission } from '@/hooks/use-permission';

interface RoleBasedButtonProps extends ButtonProps {
  /**
   * The permission required to show this button
   */
  permission?: Permission;
  
  /**
   * Array of permissions - if any of these are granted, button will be shown
   */
  anyPermission?: Permission[];
  
  /**
   * Whether to show a disabled button when permission is denied
   * Default is false - button will be hidden when permission is denied
   */
  showDisabled?: boolean;
  
  /**
   * Tooltip text to show when button is disabled due to lack of permission
   */
  disabledTooltip?: string;
  
  /**
   * Children elements
   */
  children: React.ReactNode;
}

/**
 * A button that is only shown or enabled based on user permissions
 */
export function RoleBasedButton({
  permission,
  anyPermission,
  showDisabled = false,
  disabledTooltip = 'Anda tidak memiliki izin untuk melakukan tindakan ini',
  children,
  ...buttonProps
}: RoleBasedButtonProps) {
  return (
    <PermissionGuard
      permission={permission}
      anyPermission={anyPermission}
      fallback={
        showDisabled ? (
          <Button
            {...buttonProps}
            disabled={true}
            title={disabledTooltip}
          >
            {children}
          </Button>
        ) : null
      }
    >
      <Button {...buttonProps}>
        {children}
      </Button>
    </PermissionGuard>
  );
}
