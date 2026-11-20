import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The admin panel now lives as an admin-only section of /settings.
export const load: PageServerLoad = () => {
  redirect(303, '/settings#admin');
};
