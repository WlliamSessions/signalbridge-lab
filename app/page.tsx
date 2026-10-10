
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import APIExplorer from "./components/APIExplorer";

type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  plan: string;
  createdAt: string;
};

type CustomerForm = {
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
};

type Tab = "Overview" | "Customers" | "API Explorer";
type ModalMode = "create" | "edit" | "delete" | null;

const emptyForm: CustomerForm = {
  email: "",
  firstName: "",
  lastName: "",
  plan: "standard",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

const planClass: Record<string, string> = {
  standard: "bg-slate-100 text-slate-700",
  premium: "bg-blue-100 text-blue-700",
  enterprise: "bg-violet-100 text-violet-700",
};

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700",
    POST: "bg-emerald-100 text-emerald-700",
    PATCH: "bg-amber-100 text-amber-700",
    DELETE: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-md px-2.5 py-1 font-mono text-xs font-bold ${
        styles[method] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {method}
    </span>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message ?? "Unable to load customers."
        );
      }

      setCustomers(result.customers ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers.filter((customer) =>
    `${customer.firstName} ${customer.lastName ?? ""} ${customer.email} ${customer.plan}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const enterpriseCount = customers.filter(
    (customer) => customer.plan === "enterprise"
  ).length;

  function openCreate() {
    setSelected(null);
    setForm({ ...emptyForm });
    setFormError(null);
    setNotice(null);
    setModal("create");
  }

  function openEdit(customer: Customer) {
    setSelected(customer);
    setForm({
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName ?? "",
      plan: customer.plan,
    });
    setFormError(null);
    setNotice(null);
    setModal("edit");
  }

  function openDelete(customer: Customer) {
    setSelected(customer);
    setFormError(null);
    setNotice(null);
    setModal("delete");
  }

  function closeModal() {
    if (saving) return;
    setModal(null);
    setSelected(null);
    setFormError(null);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setFormError(null);

    const isEditing = modal === "edit";

    const payload = isEditing
      ? {
          id: selected?.id,
          firstName: form.firstName,
          lastName: form.lastName,
          plan: form.plan,
        }
      : {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          plan: form.plan,
        };

    try {
      const response = await fetch("/api/dashboard", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message ?? "Unable to save customer."
        );
      }

      setModal(null);
      setSelected(null);
      setNotice(
        isEditing
          ? "Customer updated successfully."
          : "Customer created successfully."
      );
      await loadCustomers();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to save customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected || saving) return;

    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch("/api/dashboard", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error?.message ?? "Unable to delete customer."
        );
      }

      setModal(null);
      setSelected(null);
      setNotice("Customer deleted successfully.");
      await loadCustomers();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to delete customer."
      );
    } finally {
      setSaving(false);
    }
  }

  const metrics = [
    {
      label: "Total Customers",
      value: loading ? "..." : customers.length,
      detail: "Live PostgreSQL records",
    },
    {
      label: "Enterprise Plans",
      value: loading ? "..." : enterpriseCount,
      detail: "Enterprise subscriptions",
    },
    {
      label: "API Operations",
      value: 5,
      detail: "Available REST operations",
    },
  ];

  const endpoints = [
    ["GET", "/api/dashboard", "List customers"],
    ["GET", "/api/v1/customers/:id", "Retrieve a customer"],
    ["POST", "/api/v1/customers", "Create a customer"],
    ["PATCH", "/api/v1/customers/:id", "Update a customer"],
    ["DELETE", "/api/v1/customers/:id", "Delete a customer"],
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-[#111b32] text-white md:flex">
          <div className="border-b border-white/10 px-6 py-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-lg font-bold">
                S
              </div>
              <div>
                <div className="text-lg font-bold">SignalBridge</div>
                <div className="text-xs tracking-wide text-slate-400">
                  INTEGRATION LAB
                </div>
              </div>
            </div>
          </div>

          <nav className="px-4 pt-8">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Workspace
            </p>
            {(["Overview", "Customers", "API Explorer"] as Tab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mb-1 flex w-full items-center rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-indigo-500 text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="mr-3">
                    {tab === "Overview"
                      ? "◫"
                      : tab === "Customers"
                      ? "♧"
                      : "⌘"}
                  </span>
                  {tab}
                </button>
              )
            )}
          </nav>

          <div className="mt-auto p-5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">
                  Demo Environment
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-400">
                Explore a fictional SaaS customer integration.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-5 md:px-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                SignalBridge / Workspace
              </p>
              <h1 className="mt-1 text-xl font-semibold">{activeTab}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                Live Database
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                SE
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-9 md:px-10">
            {activeTab === "Overview" && (
              <div className="space-y-10">
                <section className="overflow-hidden rounded-2xl bg-[#111b32] p-8 text-white shadow-sm md:p-10">
                  <div className="mb-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                      Technical Case Study
                    </span>
                    <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-slate-300">
                      REST API Integration
                    </span>
                  </div>

                  <h2 className="max-w-3xl text-3xl font-bold tracking-tight md:text-4xl">
                    Connecting customer systems through a real REST API
                  </h2>

                  <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                    SignalBridge is a fictional SaaS customer management
                    platform built to demonstrate how a Solutions Engineer
                    can translate customer integration requirements into
                    a working technical solution.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab("API Explorer")}
                      className="rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                    >
                      Explore Live API →
                    </button>
                    <button
                      onClick={() => setActiveTab("Customers")}
                      className="rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      View Customer Dashboard
                    </button>
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className={cardClass}>
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-bold">{metric.value}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {metric.detail}
                      </p>
                    </div>
                  ))}
                </div>

                <section>
                  <SectionTitle
                    eyebrow="01 / Business Challenge"
                    title="The customer scenario"
                    description="A fictional B2B SaaS company needs a reliable way to synchronize customer accounts between its internal applications and a subscription management platform."
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className={cardClass}>
                      <h3 className="mb-4 text-lg font-bold">
                        Customer requirements
                      </h3>
                      <ul className="space-y-3 text-sm leading-6 text-slate-600">
                        {[
                          "Create customer records from external applications.",
                          "Retrieve account information using a unique identifier.",
                          "Update customer details and subscription plans.",
                          "Remove obsolete customer records.",
                          "Protect integration endpoints with API authentication.",
                          "Return predictable errors when requests fail.",
                        ].map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="font-bold text-indigo-500">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={cardClass}>
                      <h3 className="mb-4 text-lg font-bold">
                        Proposed solution
                      </h3>
                      <p className="text-sm leading-7 text-slate-600">
                        Build a versioned REST API backed by a PostgreSQL
                        database, with structured JSON responses, Bearer-token
                        authentication for the integration API, and an
                        interactive workspace for demonstrating operations.
                      </p>
                      <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          Success criteria
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          A customer can create, retrieve, update, and delete
                          records, then verify that changes persist in the
                          database.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionTitle
                    eyebrow="02 / Solution Architecture"
                    title="How the integration works"
                    description="The application separates the user interface, API request handling, and persistent storage."
                  />

                  <div className={cardClass}>
                    <div className="grid gap-3 md:grid-cols-4">
                      {[
                        {
                          number: "01",
                          name: "Client",
                          detail: "Browser or Postman",
                        },
                        {
                          number: "02",
                          name: "Next.js API",
                          detail: "Routes and validation",
                        },
                        {
                          number: "03",
                          name: "Supabase",
                          detail: "Database access",
                        },
                        {
                          number: "04",
                          name: "PostgreSQL",
                          detail: "Persistent records",
                        },
                      ].map((step) => (
                        <div
                          key={step.number}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <p className="text-xs font-bold text-indigo-500">
                            {step.number}
                          </p>
                          <h3 className="mt-3 font-bold">{step.name}</h3>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {step.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-xl bg-[#111b32] p-5 font-mono text-xs leading-7 text-slate-200">
                      <p>Client sends HTTP request</p>
                      <p className="pl-5 text-indigo-300">↓</p>
                      <p>Next.js validates request and processes operation</p>
                      <p className="pl-5 text-indigo-300">↓</p>
                      <p>Supabase queries PostgreSQL</p>
                      <p className="pl-5 text-indigo-300">↓</p>
                      <p>API returns HTTP status + JSON response</p>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-slate-500">
                      The API keeps database credentials on the server.
                      External integrations use a Bearer token, while the
                      demonstration dashboard uses a separate server-side
                      endpoint to access customer data.
                    </p>
                  </div>
                </section>

                <section>
                  <SectionTitle
                    eyebrow="03 / API Design"
                    title="Five working API operations"
                    description="The API supports the core customer lifecycle and uses HTTP methods and status codes to communicate outcomes."
                  />

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {endpoints.map(([method, path, description]) => (
                        <div
                          key={`${method}-${path}`}
                          className="flex flex-wrap items-center gap-4 px-6 py-4"
                        >
                          <MethodBadge method={method} />
                          <code className="min-w-0 flex-1 break-all text-xs text-slate-700">
                            {path}
                          </code>
                          <span className="text-xs text-slate-500">
                            {description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <SectionTitle
                    eyebrow="04 / Technical Decisions"
                    title="Why this architecture?"
                    description="The design prioritizes practical integration skills, understandable components, and a short live demonstration."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        title: "REST + JSON",
                        detail:
                          "Widely used integration patterns that make requests and responses straightforward to inspect and troubleshoot.",
                      },
                      {
                        title: "Bearer-token authentication",
                        detail:
                          "Demonstrates how an external system presents credentials when calling protected API endpoints.",
                      },
                      {
                        title: "Supabase + PostgreSQL",
                        detail:
                          "Provides a real persistent database without requiring a custom database server.",
                      },
                      {
                        title: "Structured error handling",
                        detail:
                          "Uses meaningful HTTP status codes and JSON error messages to help clients diagnose failed requests.",
                      },
                      {
                        title: "Next.js + TypeScript",
                        detail:
                          "Keeps the UI and server-side API in one project while providing typed application code.",
                      },
                      {
                        title: "Postman + API Explorer",
                        detail:
                          "Supports both technical testing and a recruiter-friendly interactive demonstration.",
                      },
                    ].map((decision) => (
                      <div key={decision.title} className={cardClass}>
                        <h3 className="font-bold">{decision.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          {decision.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <SectionTitle
                    eyebrow="05 / Demonstration"
                    title="See the integration in action"
                    description="Use the customer workspace to manage records or inspect live requests and responses in the API Explorer."
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className={cardClass}>
                      <div className="mb-4 text-2xl">▤</div>
                      <h3 className="text-lg font-bold">Customer Dashboard</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        Create, search, edit, and delete real customer records
                        stored in Supabase.
                      </p>
                      <button
                        onClick={() => setActiveTab("Customers")}
                        className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Open Customers →
                      </button>
                    </div>

                    <div className={cardClass}>
                      <div className="mb-4 text-2xl">{"{ }"}</div>
                      <h3 className="text-lg font-bold">API Explorer</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-500">
                        Send live HTTP requests and inspect response bodies,
                        status codes, and request timing.
                      </p>
                      <button
                        onClick={() => setActiveTab("API Explorer")}
                        className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Launch API Explorer →
                      </button>
                    </div>
                  </div>
                </section>

                <section className={cardClass}>
                  <SectionTitle
                    eyebrow="06 / Production Considerations"
                    title="What I would improve for production"
                  />

                  <p className="mb-5 text-sm leading-7 text-slate-600">
                    This is a functional demonstration, not a
                    production-hardened customer platform. A real deployment
                    would require additional safeguards and operational
                    capabilities.
                  </p>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      "Replace the shared demo token with managed, scoped credentials and rotation.",
                      "Add user authentication and authorization to the dashboard.",
                      "Introduce rate limiting, monitoring, and audit logs.",
                      "Add pagination and automated integration tests.",
                      "Use separate demo and production databases.",
                      "Provide a safe reset mechanism for public demo data.",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600"
                      >
                        <span className="font-bold text-indigo-500">→</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Sales Engineering Perspective
                  </p>
                  <h3 className="mt-3 text-xl font-bold">
                    What this project demonstrates
                  </h3>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
                    This lab brings together customer discovery, technical
                    requirements, solution design, API implementation,
                    authentication, troubleshooting, and technical
                    communication. The focus is not simply writing code:
                    it is building a working solution and explaining how
                    that solution addresses a customer's integration needs.
                  </p>
                </section>
              </div>
            )}

            {activeTab === "API Explorer" && (
              <APIExplorer
                customers={customers}
                onDataChanged={loadCustomers}
              />
            )}

            {activeTab === "Customers" && (
              <div>
                <SectionTitle
                  eyebrow="Customer Workspace"
                  title="Customer Management"
                  description="Explore live customer records, subscription plans, and REST API operations."
                />

                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className={cardClass}>
                      <p className="text-sm text-slate-500">{metric.label}</p>
                      <p className="mt-3 text-3xl font-bold">{metric.value}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        {metric.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {notice && (
                  <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">
                    <span>{notice}</span>
                    <button
                      onClick={() => setNotice(null)}
                      className="font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-6">
                    <div>
                      <h3 className="text-lg font-bold">Customers</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Customer records stored in Supabase.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void loadCustomers()}
                        disabled={loading}
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={openCreate}
                        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        + Add Customer
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 px-6 py-4">
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search customers..."
                      className="w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>

                  {error && (
                    <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Customer</th>
                          <th className="px-6 py-4">Plan</th>
                          <th className="px-6 py-4">Created</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-12 text-center text-sm text-slate-500"
                            >
                              Loading customer records...
                            </td>
                          </tr>
                        ) : filteredCustomers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-12 text-center text-sm text-slate-500"
                            >
                              {customers.length === 0
                                ? "No customers in the database yet."
                                : "No customers match your search."}
                            </td>
                          </tr>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <tr
                              key={customer.id}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-6 py-5">
                                <p className="text-sm font-semibold">
                                  {customer.firstName}{" "}
                                  {customer.lastName ?? ""}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {customer.email}
                                </p>
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                    planClass[customer.plan] ??
                                    "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {customer.plan}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-500">
                                {new Date(
                                  customer.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-5 text-right">
                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => openEdit(customer)}
                                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDelete(customer)}
                                    className="text-sm font-semibold text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
                    Showing {loading ? "..." : filteredCustomers.length} of{" "}
                    {customers.length} database customers
                  </div>
                </section>

                <section className="mt-8 grid gap-5 lg:grid-cols-2">
                  <div className={cardClass}>
                    <h3 className="text-lg font-bold">
                      Integration Architecture
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      A REST API connecting customer applications to
                      PostgreSQL through Next.js and Supabase.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      {[
                        "Browser",
                        "Next.js API",
                        "Supabase",
                        "PostgreSQL",
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                          {index > 0 && (
                            <span className="text-slate-300">→</span>
                          )}
                          <span className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={cardClass}>
                    <h3 className="text-lg font-bold">API Capabilities</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      REST operations with Bearer authentication and
                      structured JSON responses.
                    </p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        ["POST", "Create"],
                        ["GET", "List / Retrieve"],
                        ["PATCH", "Update"],
                        ["DELETE", "Remove"],
                      ].map(([method, action]) => (
                        <div
                          key={method}
                          className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
                        >
                          <MethodBadge method={method} />
                          <span className="text-sm text-slate-600">
                            {action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            <footer className="mt-10 text-center text-xs text-slate-400">
              SignalBridge Integration Lab · Fictional customer data ·
              Sales Engineering Portfolio
            </footer>
          </div>
        </main>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "create"
                ? "Add Customer"
                : modal === "edit"
                ? "Edit Customer"
                : "Delete Customer"
            }
            className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  {modal === "create"
                    ? "Add Customer"
                    : modal === "edit"
                    ? "Edit Customer"
                    : "Delete Customer"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modal === "create"
                    ? "Create a new customer record."
                    : modal === "edit"
                    ? "Update customer details and subscription."
                    : "This action permanently removes the record."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-2xl text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            {modal === "delete" ? (
              <div>
                <p className="mb-6 text-sm leading-6 text-slate-600">
                  Are you sure you want to delete{" "}
                  <strong>
                    {selected?.firstName} {selected?.lastName}
                  </strong>
                  ? This cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void confirmDelete()}
                    disabled={saving}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Deleting..." : "Delete Customer"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitForm} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold">
                    First Name
                    <input
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          firstName: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="block text-sm font-semibold">
                    Last Name
                    <input
                      value={form.lastName}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          lastName: event.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold">
                  Email
                  <input
                    type="email"
                    required
                    disabled={modal === "edit"}
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Subscription Plan
                  <select
                    value={form.plan}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        plan: event.target.value,
                      })
                    }
                    className={inputClass}
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : modal === "create"
                      ? "Create Customer"
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
