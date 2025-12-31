import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "vitest-mock-extended";

// We need to tell Vitest to mock the @ecosystem/database module where prisma is exported
// This assumes your API routes import `prisma` from `@ecosystem/database`
vi.mock("@ecosystem/database", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma } from "@ecosystem/database";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
