import { PrismaService } from '../../prisma/prisma.service';

export interface AccessScope {
  productIds: string[] | null; // null = unrestricted (no explicit assignments)
  environmentIds: string[] | null;
}

/**
 * A user with zero UserProductAccess/UserEnvironmentAccess rows is unrestricted
 * (the common case - most roles see everything they have module permission for).
 * Once at least one row is assigned, the user is scoped to that allow-list -
 * this is how "Assign Products" / "Assign Environment Access" narrows a user's
 * visible data (e.g. a Client Viewer scoped to a single bank's environment).
 */
export async function getAccessScope(prisma: PrismaService, userId: string): Promise<AccessScope> {
  const [products, environments] = await Promise.all([
    prisma.userProductAccess.findMany({ where: { userId }, select: { productId: true } }),
    prisma.userEnvironmentAccess.findMany({ where: { userId }, select: { environmentId: true } }),
  ]);
  return {
    productIds: products.length ? products.map((p) => p.productId) : null,
    environmentIds: environments.length ? environments.map((e) => e.environmentId) : null,
  };
}

export function applyAccessScope(where: Record<string, any>, scope: AccessScope) {
  if (scope.productIds) where.productId = { in: scope.productIds };
  if (scope.environmentIds) where.environmentId = { in: scope.environmentIds };
  return where;
}
