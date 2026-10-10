
import { supabase } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth";

type CreateCustomerRequest = {
  email?: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
};

function formatCustomer(data: {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  plan: string;
  created_at: string;
}) {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    plan: data.plan,
    createdAt: data.created_at,
  };
}

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

// GET - List all customers
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Supabase error:", error);

      return Response.json(
        {
          error: {
            code: "database_error",
            message: "Unable to retrieve customers.",
          },
        },
        { status: 500 }
      );
    }

    return Response.json(
      {
        customers: (data ?? []).map(formatCustomer),
        count: data?.length ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET customers error:", error);

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

// POST - Create a customer
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        error: {
          code: "invalid_api_key",
          message: "A valid Bearer token is required.",
        },
      },
      { status: 401 }
    );
  }

  let body: CreateCustomerRequest;

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
    Array.isArray(body) ||
    typeof body.email !== "string" ||
    body.email.trim() === "" ||
    typeof body.firstName !== "string" ||
    body.firstName.trim() === ""
  ) {
    return Response.json(
      {
        error: {
          code: "validation_error",
          message: "email and firstName are required strings.",
        },
      },
      { status: 400 }
    );
  }

  const email = body.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      {
        error: {
          code: "invalid_email",
          message: "A valid email address is required.",
        },
      },
      { status: 400 }
    );
  }

  if (
    (body.lastName !== undefined &&
      typeof body.lastName !== "string") ||
    (body.plan !== undefined &&
      typeof body.plan !== "string")
  ) {
    return Response.json(
      {
        error: {
          code: "validation_error",
          message: "lastName and plan must be strings.",
        },
      },
      { status: 400 }
    );
  }

  const validPlans = ["standard", "premium", "enterprise"];
  const plan = body.plan ?? "standard";

  if (!validPlans.includes(plan)) {
    return Response.json(
      {
        error: {
          code: "invalid_plan",
          message: "Plan must be standard, premium, or enterprise.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const customerId = `cus_${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from("customers")
      .insert({
        id: customerId,
        email,
        first_name: body.firstName.trim(),
        last_name: body.lastName ?? null,
        plan,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json(
          {
            error: {
              code: "customer_already_exists",
              message: "A customer with this email already exists.",
            },
          },
          { status: 409 }
        );
      }

      console.error("Supabase error:", error);

      return Response.json(
        {
          error: {
            code: "database_error",
            message: "Unable to create customer.",
          },
        },
        { status: 500 }
      );
    }

    return Response.json(formatCustomer(data), { status: 201 });
  } catch (error) {
    console.error("POST customers error:", error);

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
