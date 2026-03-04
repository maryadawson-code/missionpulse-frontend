export async function createClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  }
}
