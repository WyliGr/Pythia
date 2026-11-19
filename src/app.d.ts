import type { ApiKey } from '$lib/server/db/schema';
import type { SessionUser } from '$lib/server/auth';

declare global {
  namespace App {
    interface Locals {
      user: SessionUser | null;
      apiKey: ApiKey | null;
    }
  }
}

export {};
