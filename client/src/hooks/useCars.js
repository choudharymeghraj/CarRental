import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

/**
 * Fetches all available cars. Cached for 60s, background refetch on focus.
 */
export const useCars = () =>
    useQuery({
        queryKey: ['cars'],
        queryFn: async () => {
            const { data } = await axios.get('/api/user/cars');
            if (!data.success) throw new Error(data.message || 'Failed to fetch cars');
            return data.cars ?? [];
        },
        staleTime: 60_000,
        retry: 2,
    });
