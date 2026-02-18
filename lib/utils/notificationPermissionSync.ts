export type NotificationSyncAction = "enable" | "disable" | "none";

export interface NotificationSyncInput {
  permissionEnabled: boolean;
  notificationsEnabled: boolean;
  disabledBySystemPermission: boolean;
  previousPermissionEnabled: boolean | null;
}

export const resolveNotificationSyncAction = ({
  permissionEnabled,
  notificationsEnabled,
  disabledBySystemPermission,
  previousPermissionEnabled,
}: NotificationSyncInput): NotificationSyncAction => {
  if (!permissionEnabled && notificationsEnabled) {
    return "disable";
  }

  if (
    permissionEnabled &&
    !notificationsEnabled &&
    (disabledBySystemPermission || previousPermissionEnabled === false)
  ) {
    return "enable";
  }

  return "none";
};
