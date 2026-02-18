import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));

let notificationService: (typeof import('@/lib/services/notificationService'))['notificationService'];

const makeResponse = (data: Record<string, unknown>) => ({
  notification: {
    request: {
      content: {
        data,
      },
    },
  },
});

describe('notificationService.handleNotificationResponse', () => {
  beforeAll(async () => {
    ({ notificationService } = await import('@/lib/services/notificationService'));
  });

  it('routes event notifications by entityId', () => {
    const navigate = vi.fn();
    notificationService.setNavigationHandler(navigate);

    notificationService.handleNotificationResponse(
      makeResponse({ screen: 'event', entityType: 'event', entityId: 'evt-1' }) as any
    );

    expect(navigate).toHaveBeenCalledWith({
      pathname: '/event/[id]',
      params: { id: 'evt-1' },
    });
  });

  it('routes feeding notifications to care tab', () => {
    const navigate = vi.fn();
    notificationService.setNavigationHandler(navigate);

    notificationService.handleNotificationResponse(
      makeResponse({ entityType: 'feeding', entityId: 'sch-1' }) as any
    );

    expect(navigate).toHaveBeenCalledWith('/(tabs)/care');
  });

  it('routes budget notifications with legacy finance screen', () => {
    const navigate = vi.fn();
    notificationService.setNavigationHandler(navigate);

    notificationService.handleNotificationResponse(
      makeResponse({ screen: 'finance' }) as any
    );

    expect(navigate).toHaveBeenCalledWith('/(tabs)/finance');
  });
});
