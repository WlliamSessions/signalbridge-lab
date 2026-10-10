
import { supabase } from "@/lib/supabase";
import { isAuthorized } from "@/lib/auth";

type CreateCustomerRequest = {
  email?: string;
  firstName?: string;
  lastName?: string;
  plan?: string;
};

export async function POST(request: Request) {
  // Step 1: Authenticate the request.
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

  // Step 2: Parse the incoming JSON.
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

  // Step 3: Validate required fields.
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

  // Step 4: Validate email format.
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

  // Step 5: Validate optional fields.
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

  // Step 6: Save the customer in Supabase.
  try {
    const customerId = `cus_${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from("customers")
      .insert({
        id: customerId,
        email,
        first_name: body.firstName.trim(),
        last_name: body.lastName ?? null,
        plan: body.plan ?? "standard",
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

    // Step 7: Return the stored customer.
    return Response.json(
      {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        plan: data.plan,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);

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
