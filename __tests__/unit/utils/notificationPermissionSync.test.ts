import { describe, expect, it } from 'vitest';

import { resolveNotificationSyncAction } from '@/lib/utils/notificationPermissionSync';

describe('resolveNotificationSyncAction', () => {
  it('disables app notifications when system permission is revoked', () => {
    const action = resolveNotificationSyncAction({
      permissionEnabled: false,
      notificationsEnabled: true,
      disabledBySystemPermission: false,
      previousPermissionEnabled: true,
    });

    expect(action).toBe('disable');
  });

  it('enables app notifications when permission is restored after system-disabled state', () => {
    const action = resolveNotificationSyncAction({
      permissionEnabled: true,
      notificationsEnabled: false,
      disabledBySystemPermission: true,
      previousPermissionEnabled: false,
    });

    expect(action).toBe('enable');
  });

  it('enables app notifications when permission flips false->true in foreground', () => {
    const action = resolveNotificationSyncAction({
      permissionEnabled: true,
      notificationsEnabled: false,
      disabledBySystemPermission: false,
      previousPermissionEnabled: false,
    });

    expect(action).toBe('enable');
  });

  it('keeps app notifications off when user explicitly disabled them', () => {
    const action = resolveNotificationSyncAction({
      permissionEnabled: true,
      notificationsEnabled: false,
      disabledBySystemPermission: false,
      previousPermissionEnabled: true,
    });

    expect(action).toBe('none');
  });

  it('does nothing when both system permission and app toggle are off', () => {
    const action = resolveNotificationSyncAction({
      permissionEnabled: false,
      notificationsEnabled: false,
      disabledBySystemPermission: false,
      previousPermissionEnabled: false,
    });

    expect(action).toBe('none');
  });
});
