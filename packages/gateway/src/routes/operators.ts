/**
 * Operator discovery routes.
 * Public endpoints - no payment required.
 */

import type { FastifyInstance } from "fastify";
import {
  listOperatorsFromRegistry,
  getOperatorBySlugFromRegistry,
} from "../services/operator-registry.js";

export async function operatorRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /v1/operators
   * List all active operators with optional filtering.
   */
  app.get("/v1/operators", async (request, reply) => {
    const query = request.query as {
      category?: string;
      search?: string;
      sortBy?: string;
      limit?: string;
      offset?: string;
    };

    const result = await listOperatorsFromRegistry({
      category: query.category,
      search: query.search,
      sortBy: (query.sortBy as "trust" | "invocations" | "earnings" | "newest") ?? "trust",
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });

    return reply.send({
      operators: result.operators.map((op) => ({
        id: op._id,
        slug: op.slug,
        name: op.name,
        tagline: op.tagline,
        category: op.category,
        trustScore: op.trustScore,
        priceUsdc: op.priceUsdc,
        totalInvocations: op.totalInvocations,
        avgResponseMs: op.avgResponseMs,
        creatorWallet: op.creatorWallet,
        endpoint: op.endpoint,
        isActive: op.isActive,
      })),
      total: result.total,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      offset: query.offset ? parseInt(query.offset, 10) : 0,
    });
  });

  /**
   * GET /v1/operators/:slug
   * Get single operator details by slug.
   */
  app.get("/v1/operators/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const operator = await getOperatorBySlugFromRegistry(slug);
    if (!operator) {
      return reply.status(404).send({
        error: "operator_not_found",
        message: `No operator found with slug: ${slug}`,
      });
    }

    return reply.send({
      id: operator._id,
      slug: operator.slug,
      name: operator.name,
      tagline: operator.tagline,
      description: operator.description,
      category: operator.category,
      trustScore: operator.trustScore,
      priceUsdc: operator.priceUsdc,
      totalInvocations: operator.totalInvocations,
      successfulInvocations: operator.successfulInvocations,
      avgResponseMs: operator.avgResponseMs,
      creatorWallet: operator.creatorWallet,
      endpoint: operator.endpoint,
      expectedSchema: operator.expectedSchema,
      isActive: operator.isActive,
      createdAt: operator.createdAt,
    });
  });
}
