import { Hono } from "hono";
import { AppEnv } from "../types";
import { parsePagination } from "../utils/pagination";

const programs = new Hono<AppEnv>();

// Retrieve all active JKM programs
programs.get("/", async (c) => {
  try {
    const { page, limit, offset } = parsePagination(
        c.req.query("page"),
        c.req.query("limit")
    );

    const db = c.env.jkm_mock_db;

    const countResult = await db
        .prepare(`
        SELECT COUNT(*) AS total
        FROM jkm_programs
        WHERE is_active = 1
      `)
        .first<{ total: number }>();

    const { results } = await db
        .prepare(`
        SELECT
          code,
          name,
          agency,
          category,
          description,
          assistance_type,
          assistance_min_amount,
          assistance_max_amount,
          assistance_frequency,
          assistance_description,
          application_method,
          official_url,
          last_reviewed_at
        FROM jkm_programs
        WHERE is_active = 1
        ORDER BY code
        LIMIT ? OFFSET ?
      `)
        .bind(limit, offset)
        .all();

    const total = countResult?.total ?? 0;

    return c.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve JKM programs:", error);

    return c.json(
        {
          success: false,
          message: "Failed to retrieve JKM programs",
        },
        500
    );
  }
});

// Retrieve eligibility criteria for all active JKM programs
programs.get("/eligibility", async (c) => {
  try {
    const { results } = await c.env.jkm_mock_db
        .prepare(`
          SELECT
            code,
            name,
            eligibility_criteria,
            eligibility_version,
            updated_at
          FROM jkm_programs
          WHERE is_active = 1
            AND eligibility_criteria IS NOT NULL
          ORDER BY code
        `)
        .all<{
          code: string;
          name: string;
          eligibility_criteria: string;
          eligibility_version: number;
          updated_at: string;
        }>();

    const eligibility = results.map((program) => ({
      programCode: program.code,
      programName: program.name,
      version: program.eligibility_version,
      updatedAt: program.updated_at,
      criteria: JSON.parse(program.eligibility_criteria),
    }));

    return c.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    console.error("Failed to retrieve JKM eligibility criteria:", error);

    return c.json(
        {
          success: false,
          message: "Failed to retrieve JKM eligibility criteria",
        },
        500
    );
  }
});

// Retrieve eligibility criteria for a specific JKM program
programs.get("/:code/eligibility", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();

    const program = await c.env.jkm_mock_db
        .prepare(`
          SELECT
            code,
            name,
            eligibility_criteria,
            eligibility_version,
            updated_at
          FROM jkm_programs
          WHERE code = ?
            AND is_active = 1
        `)
        .bind(code)
        .first<{
          code: string;
          name: string;
          eligibility_criteria: string | null;
          eligibility_version: number;
          updated_at: string;
        }>();

    if (!program) {
      return c.json(
          {
            success: false,
            message: "JKM program not found",
          },
          404
      );
    }

    if (!program.eligibility_criteria) {
      return c.json(
          {
            success: false,
            message: "Eligibility criteria are not available for this program",
          },
          404
      );
    }

    return c.json({
      success: true,
      data: {
        programCode: program.code,
        programName: program.name,
        version: program.eligibility_version,
        updatedAt: program.updated_at,
        criteria: JSON.parse(program.eligibility_criteria),
      },
    });
  } catch (error) {
    console.error("Failed to retrieve JKM program eligibility criteria:", error);

    return c.json(
        {
          success: false,
          message: "Failed to retrieve JKM program eligibility criteria",
        },
        500
    );
  }
});

// Retrieve a specific JKM program
programs.get("/:code", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();

    const program = await c.env.jkm_mock_db
        .prepare(`
          SELECT
            id,
            code,
            name,
            agency,
            category,
            description,
            assistance_type,
            assistance_min_amount,
            assistance_max_amount,
            assistance_frequency,
            assistance_description,
            application_method,
            official_url,
            is_active,
            last_reviewed_at
          FROM jkm_programs
          WHERE code = ?
            AND is_active = 1
        `)
        .bind(code)
        .first();

    if (!program) {
      return c.json(
          {
            success: false,
            message: "JKM program not found",
          },
          404
      );
    }

    return c.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error("Failed to retrieve JKM program:", error);

    return c.json(
        {
          success: false,
          message: "Failed to retrieve JKM program",
        },
        500
    );
  }
});

export default programs;
