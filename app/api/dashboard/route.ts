
import { supabase } from "@/lib/supabase";

type CustomerInput = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  plan?: unknown;
  id?: unknown;
};

type DatabaseCustomer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  plan: string;
  created_at: string;
};

const validPlans = ["standard", "premium", "enterprise"];

function formatCustomer(customer: DatabaseCustomer) {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    plan: customer.plan,
    createdAt: customer.created_at,
  };
}

function errorResponse(
  code: string,
  message: string,
  status: number
) {
  return Response.json(
    { error: { code, message } },
    { status }
  );
}

// Public portfolio demo endpoint.
//
// This route uses real Supabase data and allows visitors
// to demonstrate customer CRUD operations.
//
// Only fictional, disposable customer records should
// be stored in this database.
//
// The Supabase secret remains server-side.
// The separate /api/v1/customers endpoints continue
// to require bearer-token authentication.

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id,email,first_name,last_name,plan,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Dashboard GET:", error);

      return errorResponse(
        "database_error",
        "Unable to load customers.",
        500
      );
    }

    return Response.json(
      { customers: (data ?? []).map(formatCustomer) },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard GET:", error);

    return errorResponse(
      "internal_server_error",
      "An unexpected error occurred.",
      500
    );
  }
}

export async function POST(request: Request) {
  let body: CustomerInput;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "invalid_json",
      "Enter valid JSON.",
      400
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.email !== "string" ||
    typeof body.firstName !== "string" ||
    !body.firstName.trim()
  ) {
    return errorResponse(
      "validation_error",
      "Email and first name are required.",
      400
    );
  }

  const email = body.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse(
      "invalid_email",
      "Enter a valid email address.",
      400
    );
  }

  if (
    body.lastName !== undefined &&
    typeof body.lastName !== "string"
  ) {
    return errorResponse(
      "validation_error",
      "Last name must be text.",
      400
    );
  }

  const plan = body.plan ?? "standard";

  if (
    typeof plan !== "string" ||
    !validPlans.includes(plan)
  ) {
    return errorResponse(
      "invalid_plan",
      "Choose a valid subscription plan.",
      400
    );
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        id: `cus_${crypto.randomUUID()}`,
        email,
        first_name: body.firstName.trim(),
        last_name:
          typeof body.lastName === "string"
            ? body.lastName.trim()
            : null,
        plan,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return errorResponse(
          "customer_already_exists",
          "A customer with this email already exists.",
          409
        );
      }

      console.error("Dashboard POST:", error);

      return errorResponse(
        "database_error",
        "Unable to create customer.",
        500
      );
    }

    return Response.json(formatCustomer(data), {
      status: 201,
    });
  } catch (error) {
    console.error("Dashboard POST:", error);

    return errorResponse(
      "internal_server_error",
      "An unexpected error occurred.",
      500
    );
  }
}

export async function PATCH(request: Request) {
  let body: CustomerInput;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "invalid_json",
      "Enter valid JSON.",
      400
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.id !== "string" ||
    !body.id.trim()
  ) {
    return errorResponse(
      "validation_error",
      "A customer ID is required.",
      400
    );
  }

  const updates: Record<string, string | null> = {};

  if (body.firstName !== undefined) {
    if (
      typeof body.firstName !== "string" ||
      !body.firstName.trim()
    ) {
      return errorResponse(
        "validation_error",
        "First name cannot be empty.",
        400
      );
    }

    updates.first_name = body.firstName.trim();
  }

  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string") {
      return errorResponse(
        "validation_error",
        "Last name must be text.",
        400
      );
    }

    updates.last_name = body.lastName.trim();
  }

  if (body.plan !== undefined) {
    if (
      typeof body.plan !== "string" ||
      !validPlans.includes(body.plan)
    ) {
      return errorResponse(
        "invalid_plan",
        "Choose a valid subscription plan.",
        400
      );
    }

    updates.plan = body.plan;
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(
      "empty_request",
      "No changes were provided.",
      400
    );
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", body.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Dashboard PATCH:", error);

      return errorResponse(
        "database_error",
        "Unable to update customer.",
        500
      );
    }

    if (!data) {
      return errorResponse(
        "customer_not_found",
        "Customer not found.",
        404
      );
    }

    return Response.json(formatCustomer(data));
  } catch (error) {
    console.error("Dashboard PATCH:", error);

    return errorResponse(
      "internal_server_error",
      "An unexpected error occurred.",
      500
    );
  }
}

export async function DELETE(request: Request) {
  let body: CustomerInput;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "invalid_json",
      "Enter valid JSON.",
      400
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.id !== "string" ||
    !body.id.trim()
  ) {
    return errorResponse(
      "validation_error",
      "A customer ID is required.",
      400
    );
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", body.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Dashboard DELETE:", error);

      return errorResponse(
        "database_error",
        "Unable to delete customer.",
        500
      );
    }

    if (!data) {
      return errorResponse(
        "customer_not_found",
        "Customer not found.",
        404
      );
    }

    return Response.json({
      message: "Customer deleted successfully.",
      id: data.id,
    });
  } catch (error) {
    console.error("Dashboard DELETE:", error);

    return errorResponse(
      "internal_server_error",
      "An unexpected error occurred.",
      500
    );
  }
}
