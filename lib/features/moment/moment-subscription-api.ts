import { baseApi, transformApiError } from "@/lib/api";

const momentSubscriptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    subscribeToMoments: builder.mutation<void, string>({
      query: (email) => ({
        url: "/api/v1/public/moments/subscription/subscribe",
        method: "POST",
        body: { email },
      }),
      transformErrorResponse: transformApiError,
    }),
    verifyMomentSubscription: builder.mutation<void, string>({
      query: (token) => ({
        url: "/api/v1/public/moments/subscription/verify",
        method: "POST",
        body: { token },
      }),
      transformErrorResponse: transformApiError,
    }),
    unsubscribeFromMoments: builder.mutation<void, string>({
      query: (token) => ({
        url: "/api/v1/public/moments/subscription/unsubscribe",
        method: "POST",
        body: { token },
      }),
      transformErrorResponse: transformApiError,
    }),
  }),
});

export const {
  useSubscribeToMomentsMutation,
  useVerifyMomentSubscriptionMutation,
  useUnsubscribeFromMomentsMutation,
} = momentSubscriptionApi;
