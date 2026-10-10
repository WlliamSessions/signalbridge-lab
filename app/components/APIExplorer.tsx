
"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  plan: string;
  createdAt: string;
};

type Props = {
  customers: Customer[];
  onDataChanged: () => Promise<void>;
};

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type Endpoint = {
  label: string;
  method: Method;
  path: string;
  description: string;
  needsId: boolean;
};

const endpoints: Endpoint[] = [
  {
    label: "List Customers",
    method: "GET",
    path: "/api/dashboard",
    description: "Retrieve customer records from the live database.",
    needsId: false,
  },
  {
    label: "Get Customer",
    method: "GET",
    path: "/api/v1/customers/:id",
    description: "Retrieve a single customer by their unique ID.",
    needsId: true,
  },
  {
    label: "Create Customer",
    method: "POST",
    path: "/api/v1/customers",
    description: "Create a new customer using a JSON request body.",
    needsId: false,
  },
  {
    label: "Update Customer",
    method: "PATCH",
    path: "/api/v1/customers/:id",
    description: "Update an existing customer's subscription plan.",
    needsId: true,
  },
  {
    label: "Delete Customer",
    method: "DELETE",
    path: "/api/v1/customers/:id",
    description: "Permanently remove a customer record.",
    needsId: true,
  },
];

const methodColors: Record<Method, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-emerald-100 text-emerald-700",
  PATCH: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
};

const createExample = {
  email: "demo@northstar.example",
  firstName: "Demo",
  lastName: "Customer",
  plan: "standard",
};

const updateExample = {
  plan: "premium",
};

export default function APIExplorer({
  customers,
  onDataChanged,
}: Props) {
  const [endpointIndex, setEndpointIndex] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(createExample, null, 2)
  );
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [requestError, setRequestError] = useState("");

  const endpoint = endpoints[endpointIndex];

  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
    }
  }, [customers, customerId]);

  function selectEndpoint(index: number) {
    setEndpointIndex(index);
    setResponse("");
    setStatus(null);
    setDuration(null);
    setRequestError("");

    if (endpoints[index].method === "POST") {
      setRequestBody(JSON.stringify(createExample, null, 2));
    } else if (endpoints[index].method === "PATCH") {
      setRequestBody(JSON.stringify(updateExample, null, 2));
    }
  }

  const requestPath = endpoint.needsId
    ? endpoint.path.replace(":id", customerId.trim() || ":id")
    : endpoint.path;

  async function sendRequest() {
    if (endpoint.needsId && !customerId.trim()) {
      setRequestError("Select a customer or enter a customer ID.");
      return;
    }

    if (
      endpoint.path !== "/api/dashboard" &&
      !apiKey.trim()
    ) {
      setRequestError("Enter the demo API key before sending.");
      return;
    }

    let parsedBody: unknown;

    if (endpoint.method === "POST" || endpoint.method === "PATCH") {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch {
        setRequestError("The request body must contain valid JSON.");
        return;
      }
    }

    setLoading(true);
    setRequestError("");
    setResponse("");
    setStatus(null);
    setDuration(null);

    const start = performance.now();

    try {
      const headers: Record<string, string> = {};

      if (endpoint.path !== "/api/dashboard") {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
      }

      if (endpoint.method === "POST" || endpoint.method === "PATCH") {
        headers["Content-Type"] = "application/json";
      }

      const result = await fetch(requestPath, {
        method: endpoint.method,
        headers,
        body:
          endpoint.method === "POST" || endpoint.method === "PATCH"
            ? JSON.stringify(parsedBody)
            : undefined,
        cache: "no-store",
      });

      const elapsed = Math.round(performance.now() - start);
      const raw = await result.text();

      let formatted = raw;

      try {
        formatted = JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        // Show the original text if the response is not JSON.
      }

      setStatus(result.status);
      setDuration(elapsed);
      setResponse(formatted || "(Empty response)");

      if (
        result.ok &&
        ["POST", "PATCH", "DELETE"].includes(endpoint.method)
      ) {
        await onDataChanged();
      }
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "The request could not be completed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">
          API Explorer
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Explore live REST API operations. Select an endpoint,
          configure the request, and inspect the HTTP response.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Endpoints
          </h3>

          <div className="space-y-2">
            {endpoints.map((item, index) => (
              <button
                key={item.label}
                onClick={() => selectEndpoint(index)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-4 text-left transition ${
                  endpointIndex === index
                    ? "border border-indigo-200 bg-indigo-50"
                    : "border border-transparent hover:bg-slate-50"
                }`}
              >
                <span
                  className={`min-w-16 rounded px-2 py-1 text-center font-mono text-xs font-bold ${methodColors[item.method]}`}
                >
                  {item.method}
                </span>
                <span className="text-sm font-semibold">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-700">
              Integration Workflow
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Client → Next.js API → Supabase → PostgreSQL
            </p>
          </div>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold">
                {endpoint.label}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {endpoint.description}
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span
                className={`rounded-md px-3 py-2 font-mono text-xs font-bold ${methodColors[endpoint.method]}`}
              >
                {endpoint.method}
              </span>
              <code className="min-w-0 break-all text-sm text-slate-700">
                {requestPath}
              </code>
            </div>

            {endpoint.needsId && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold">
                  Customer ID
                </label>
                <select
                  value={customerId}
                  onChange={(event) =>
                    setCustomerId(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName ?? ""} —{" "}
                      {customer.id}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Choose a record from the live database.
                </p>
              </div>
            )}

            {endpoint.path !== "/api/dashboard" && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold">
                  Bearer Token
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) =>
                    setApiKey(event.target.value)
                  }
                  placeholder="Enter demo API key"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 font-mono text-sm outline-none focus:border-indigo-400"
                />
                <p className="mt-2 text-xs text-slate-400">
                  The server validates the token before processing
                  protected API requests.
                </p>
              </div>
            )}

            {(endpoint.method === "POST" ||
              endpoint.method === "PATCH") && (
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold">
                    Request Body
                  </label>
                  <span className="text-xs text-slate-400">
                    application/json
                  </span>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(event) =>
                    setRequestBody(event.target.value)
                  }
                  spellCheck={false}
                  rows={9}
                  className="w-full rounded-xl border border-slate-200 bg-[#101827] p-4 font-mono text-sm leading-6 text-emerald-300 outline-none focus:border-indigo-400"
                />
              </div>
            )}

            {endpoint.method === "DELETE" && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Warning: DELETE permanently removes the selected
                customer from the demo database.
              </div>
            )}

            {requestError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {requestError}
              </div>
            )}

            <button
              onClick={() => void sendRequest()}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Request →"}
            </button>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-bold">
                Response
              </h3>

              <div className="flex items-center gap-3">
                {status !== null && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      status >= 200 && status < 300
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    HTTP {status}
                  </span>
                )}
                {duration !== null && (
                  <span className="text-xs text-slate-400">
                    {duration} ms
                  </span>
                )}
              </div>
            </div>

            <div className="p-5">
              {response ? (
                <pre className="max-h-[500px] overflow-auto rounded-xl bg-[#101827] p-5 font-mono text-xs leading-6 text-slate-200">
                  {response}
                </pre>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                  <p className="font-semibold text-slate-600">
                    No response yet
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Send a request to inspect the response status
                    and JSON payload.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-400">
        Demonstration environment using fictional customer data.
        Requests can modify live demo records. The customer list
        endpoint uses the dashboard API; customer-specific
        operations use the versioned REST API.
      </p>
    </div>
  );
}
