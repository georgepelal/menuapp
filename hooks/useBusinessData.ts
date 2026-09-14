import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/supabaseData';
import { Business, AppState, MenuCategory, MenuItem, BusinessProfile } from '../types';

const keys = {
  categories: (businessId: string) => ['categories', businessId] as const,
  items: (businessId: string) => ['items', businessId] as const,
  leads: (businessId: string) => ['leads', businessId] as const,
  serviceRequests: (businessId: string) => ['service_requests', businessId] as const,
  feedback: (businessId: string) => ['feedback', businessId] as const,
  stats: (businessId: string) => ['stats', businessId] as const,
};

/**
 * Fetches everything AdminDashboard needs for one business and assembles it
 * into the same `AppState` shape the component already renders, so its JSX
 * needed minimal changes when this hook replaced the old `data`/`onUpdate`
 * props. Each mutation below invalidates only the slice it touched.
 */
export const useBusinessData = (business: Business | null) => {
  const queryClient = useQueryClient();
  const businessId = business?.id ?? null;
  const enabled = !!businessId;

  const categoriesQuery = useQuery({
    queryKey: businessId ? keys.categories(businessId) : ['categories', 'none'],
    queryFn: () => api.fetchCategories(businessId as string),
    enabled,
  });
  const itemsQuery = useQuery({
    queryKey: businessId ? keys.items(businessId) : ['items', 'none'],
    queryFn: () => api.fetchMenuItems(businessId as string),
    enabled,
  });
  const leadsQuery = useQuery({
    queryKey: businessId ? keys.leads(businessId) : ['leads', 'none'],
    queryFn: () => api.fetchLeads(businessId as string),
    enabled,
  });
  const requestsQuery = useQuery({
    queryKey: businessId ? keys.serviceRequests(businessId) : ['service_requests', 'none'],
    queryFn: () => api.fetchServiceRequests(businessId as string),
    enabled,
    refetchInterval: enabled ? 15000 : false, // light polling so new requests show up without a manual refresh
  });
  const feedbackQuery = useQuery({
    queryKey: businessId ? keys.feedback(businessId) : ['feedback', 'none'],
    queryFn: () => api.fetchFeedback(businessId as string),
    enabled,
  });
  const statsQuery = useQuery({
    queryKey: businessId ? keys.stats(businessId) : ['stats', 'none'],
    queryFn: () => api.fetchStats(businessId as string),
    enabled,
  });

  const isLoading =
    enabled &&
    (categoriesQuery.isLoading ||
      itemsQuery.isLoading ||
      leadsQuery.isLoading ||
      requestsQuery.isLoading ||
      feedbackQuery.isLoading ||
      statsQuery.isLoading);

  const categories = categoriesQuery.data ?? [];
  const items = itemsQuery.data ?? [];

  const data: AppState | null = business
    ? {
        profile: api.businessToProfile(business),
        categories,
        items,
        stats: {
          totalViews: statsQuery.data?.totalViews ?? 0,
          itemClicks: statsQuery.data?.itemClicks ?? {},
          lastReset: 0,
        },
        leads: leadsQuery.data ?? [],
        serviceRequests: requestsQuery.data ?? [],
        feedback: feedbackQuery.data ?? [],
      }
    : null;

  // --- Category mutations (optimistic) ---

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) => api.addCategory(businessId as string, name, categories.length),
    onMutate: async (name: string) => {
      const key = keys.categories(businessId as string);
      const previous = queryClient.getQueryData<MenuCategory[]>(key) ?? [];
      const optimistic: MenuCategory = { id: `temp-${Date.now()}`, name, order: previous.length };
      queryClient.setQueryData(key, [...previous, optimistic]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(keys.categories(businessId as string), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.categories(businessId as string) }),
  });

  const renameCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameCategory(id, name),
    onMutate: async ({ id, name }) => {
      const key = keys.categories(businessId as string);
      const previous = queryClient.getQueryData<MenuCategory[]>(key) ?? [];
      queryClient.setQueryData(key, previous.map(c => (c.id === id ? { ...c, name } : c)));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(keys.categories(businessId as string), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.categories(businessId as string) }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onMutate: async (id: string) => {
      const catKey = keys.categories(businessId as string);
      const itemKey = keys.items(businessId as string);
      const previousCats = queryClient.getQueryData<MenuCategory[]>(catKey) ?? [];
      const previousItems = queryClient.getQueryData<MenuItem[]>(itemKey) ?? [];
      queryClient.setQueryData(catKey, previousCats.filter(c => c.id !== id));
      queryClient.setQueryData(itemKey, previousItems.filter(i => i.categoryId !== id));
      return { previousCats, previousItems };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(keys.categories(businessId as string), context.previousCats);
      queryClient.setQueryData(keys.items(businessId as string), context.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories(businessId as string) });
      queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) });
    },
  });

  // --- Item mutations ---

  const saveItemMutation = useMutation({
    mutationFn: (item: MenuItem) => {
      const existing = items.some(i => i.id === item.id);
      const { id, ...rest } = item;
      return existing ? api.updateMenuItem(id, rest) : api.addMenuItem(businessId as string, rest);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.deleteMenuItem(id),
    onMutate: async (id: string) => {
      const key = keys.items(businessId as string);
      const previous = queryClient.getQueryData<MenuItem[]>(key) ?? [];
      queryClient.setQueryData(key, previous.filter(i => i.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(keys.items(businessId as string), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) }),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (item: MenuItem) => api.setItemAvailability(item.id, !item.isAvailable),
    onMutate: async (item: MenuItem) => {
      const key = keys.items(businessId as string);
      const previous = queryClient.getQueryData<MenuItem[]>(key) ?? [];
      queryClient.setQueryData(
        key,
        previous.map(i => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(keys.items(businessId as string), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) }),
  });

  const mergeTranslationsMutation = useMutation({
    mutationFn: async ({ targetLang, byItemId }: { targetLang: string; byItemId: Record<string, { name: string; description: string }> }) => {
      const updates = items
        .filter(item => byItemId[item.id])
        .map(item =>
          api.setItemTranslation(item.id, { ...item.translations, [targetLang]: byItemId[item.id] })
        );
      await Promise.all(updates);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) }),
  });

  const importScannedMenuMutation = useMutation({
    mutationFn: (payload: unknown) => api.importScannedMenu(businessId as string, payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.categories(businessId as string) });
      queryClient.invalidateQueries({ queryKey: keys.items(businessId as string) });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({ itemId, file, ext }: { itemId: string; file: Blob; ext?: string }) =>
      api.uploadItemImage(businessId as string, itemId, file, ext),
  });

  // --- Profile / promotion mutations ---

  const updateProfileFieldMutation = useMutation({
    mutationFn: ({ field, value }: { field: keyof BusinessProfile; value: unknown }) =>
      api.updateBusinessProfileField(businessId as string, field, value as never),
  });

  // --- Service requests ---

  const completeServiceRequestMutation = useMutation({
    mutationFn: (id: string) => api.completeServiceRequest(id),
    onMutate: async (id: string) => {
      const key = keys.serviceRequests(businessId as string);
      const previous = queryClient.getQueryData<any[]>(key) ?? [];
      queryClient.setQueryData(
        key,
        previous.map(r => (r.id === id ? { ...r, status: 'completed' } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(keys.serviceRequests(businessId as string), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.serviceRequests(businessId as string) }),
  });

  return {
    data,
    isLoading,
    addCategory: (name: string) => addCategoryMutation.mutateAsync(name),
    renameCategory: (id: string, name: string) => renameCategoryMutation.mutateAsync({ id, name }),
    deleteCategory: (id: string) => deleteCategoryMutation.mutateAsync(id),
    saveItem: (item: MenuItem) => saveItemMutation.mutateAsync(item),
    deleteItem: (id: string) => deleteItemMutation.mutateAsync(id),
    toggleAvailability: (item: MenuItem) => toggleAvailabilityMutation.mutateAsync(item),
    mergeTranslations: (targetLang: string, byItemId: Record<string, { name: string; description: string }>) =>
      mergeTranslationsMutation.mutateAsync({ targetLang, byItemId }),
    importScannedMenu: (payload: unknown) => importScannedMenuMutation.mutateAsync(payload),
    uploadImage: (itemId: string, file: Blob, ext?: string) => uploadImageMutation.mutateAsync({ itemId, file, ext }),
    updateProfileField: <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) =>
      updateProfileFieldMutation.mutateAsync({ field, value }),
    completeServiceRequest: (id: string) => completeServiceRequestMutation.mutateAsync(id),
  };
};
