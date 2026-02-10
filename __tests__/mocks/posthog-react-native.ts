const posthogInstance = {
  capture: () => undefined,
  getFeatureFlag: async () => null,
  getFeatureFlagPayload: async () => null,
};

export const usePostHog = () => posthogInstance;

export const useFeatureFlag = () => false;
