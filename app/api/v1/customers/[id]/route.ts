
import { supabase } from "../../../../../lib/supabase";
import { isAuthorized } from "../../../../../lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function unauthorizedResponse() {
  return Response.json(
    {
      error: {
        code: "unauthorized",
        message: "A valid Bearer token is required.",
      },
    },
    { status: 401 }
  );
}

// GET - Retrieve a customer by ID
export async function GET(
  request: Request,
  context: RouteContext
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);

      return Response.json(
        {
          error: {
            code: "database_error",
            message: "Unable to retrieve customer.",
          },
        },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        {
          error: {
            code: "customer_not_found",
            message: "No customer exists with that ID.",
          },
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        plan: data.plan,
        createdAt: data.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET error:", error);

    return Response.json(
      {
        error: {
          code: "internal_server_error",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing customer
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await context.params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: {
            code: "invalid_json",
            message: "Request body must contain valid JSON.",
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return Response.json(
        {
          error: {
            code: "invalid_request",
            message: "Request body must be a JSON object.",
          },
        },
        { status: 400 }
      );
    }

    const fields = body as Record<string, unknown>;

    const allowedFields = [
      "firstName",
      "lastName",
      "plan",
    ];

    const invalidFields = Object.keys(fields).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return Response.json(
        {
          error: {
            code: "invalid_fields",
            message: "One or more fields cannot be updated.",
          },
        },
        { status: 400 }
      );
    }

    if (Object.keys(fields).length === 0) {
      return Response.json(
        {
          error: {
            code: "empty_request",
            message: "At least one field must be provided.",
          },
        },
        { status: 400 }
      );
    }

    for (const [field, value] of Object.entries(fields)) {
      if (
        typeof value !== "string" ||
        value.trim().length === 0
      ) {
        return Response.json(
          {
            error: {
              code: "invalid_field_value",
              message: `${field} must be a non-empty string.`,
            },
          },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, string> = {};

    if (typeof fields.firstName === "string") {
      updates.first_name = fields.firstName.trim();
    }

    if (typeof fields.lastName === "string") {
      updates.last_name = fields.lastName.trim();
    }

    if (typeof fields.plan === "string") {
      const validPlans = [
        "standard",
        "premium",
        "enterprise",
      ];

      if (!validPlans.includes(fields.plan)) {
        return Response.json(
          {
            error: {
              code: "invalid_plan",
              message:
                "Plan must be standard, premium, or enterprise.",
            },
          },
          { status: 400 }
        );
      }

      updates.plan = fields.plan;
    }

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);

      return Response.json(
        {
          error: {
            code: "database_error",
            message: "Unable to update customer.",
          },
        },
        { status: 500 }
      );
    }

    if (!data) {
      return Response.json(
        {
          error: {
            code: "customer_not_found",
            message: "No customer exists with that ID.",
          },
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        plan: data.plan,
        createdAt: data.created_at,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH error:", error);

    return Response.json(
      {
        error: {
          code: "internal_server_error",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Permanently delete a customer
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  // Step 1: Authenticate the request.
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    // Step 2: Identify the customer.
    const { id } = await context.params;

    // Step 3: Delete the customer from Supabase.
    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    // Step 4: Handle database errors.
    if (error) {
      console.error("Supabase error:", error);

      return Response.json(
        {
          error: {
            code: "database_error",
            message: "Unable to delete customer.",
          },
        },
        { status: 500 }
      );
    }

    // Step 5: Handle nonexistent customers.
    if (!data) {
      return Response.json(
        {
          error: {
            code: "customer_not_found",
            message: "No customer exists with that ID.",
          },
        },
        { status: 404 }
      );
    }

    // Step 6: Confirm successful deletion.
    return Response.json(
      {
        message: "Customer deleted successfully.",
        id: data.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE error:", error);

    return Response.json(
      {
        error: {
          code: "internal_server_error",
          message: "An unexpected error occurred.",
        },
      },
      { status: 500 }
    );
  }
}
