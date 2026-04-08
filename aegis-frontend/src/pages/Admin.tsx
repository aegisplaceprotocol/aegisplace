import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

/* ── Stat Card ─────────────────────────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] p-5">
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-normal text-white tabular-nums">{value}</div>
    </div>
  );
}

/* ── Operators Table ───────────────────────────────────────────────────── */

function OperatorsTable() {
  const utils = trpc.useUtils();
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = trpc.operator.list.useQuery({
    limit,
    offset: page * limit,
    sortBy: "newest",
  });

  const verifyMutation = trpc.admin.verifyOperator.useMutation({
    onSuccess: () => {
      toast.success("Operator verified");
      utils.operator.list.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const suspendMutation = trpc.admin.suspendOperator.useMutation({
    onSuccess: () => {
      toast.success("Operator suspended");
      utils.operator.list.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSuspend(operatorId: number) {
    const reason = window.prompt("Suspension reason:");
    if (!reason) return;
    suspendMutation.mutate({ operatorId, reason });
  }

  if (isLoading) {
    return <div className="text-zinc-500 text-sm py-8 text-center">Loading operators...</div>;
  }

  const operators = data?.operators ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="py-3 pr-4">ID</th>
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4">Trust</th>
              <th className="py-3 pr-4">Invocations</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Verified</th>
              <th className="py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.id} className="border-b border-white/[0.06]/50 hover:bg-zinc-800/30 transition-colors">
                <td className="py-3 pr-4 text-zinc-400 tabular-nums">{op.id}</td>
                <td className="py-3 pr-4 text-white font-medium">{op.name}</td>
                <td className="py-3 pr-4 text-zinc-400">{op.category}</td>
                <td className="py-3 pr-4 text-zinc-300 tabular-nums">{op.qualityScore}</td>
                <td className="py-3 pr-4 text-zinc-300 tabular-nums">{op.totalInvocations}</td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 ${op.isActive ? "bg-white/[0.04] text-white/60" : "bg-red-500/10 text-red-400"}`}>
                    {op.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 ${op.isVerified ? "bg-blue-500/10 text-blue-400" : "bg-zinc-700/50 text-zinc-500"}`}>
                    {op.isVerified ? "Verified" : "Unverified"}
                  </span>
                </td>
                <td className="py-3 space-x-2">
                  {!op.isVerified && (
                    <button
                      onClick={() => verifyMutation.mutate({ operatorId: op.id })}
                      disabled={verifyMutation.isPending}
                      className="text-xs px-3 py-1 bg-white text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      Verify
                    </button>
                  )}
                  {op.isActive && (
                    <button
                      onClick={() => handleSuspend(op.id)}
                      disabled={suspendMutation.isPending}
                      className="text-xs px-3 py-1 bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {operators.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 text-sm">No operators found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-xs text-zinc-500">{total} operators total</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-30"
            >
              Prev
            </button>
            <span className="text-xs text-zinc-500 py-1">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Disputes Queue ────────────────────────────────────────────────────── */

function DisputesQueue() {
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.dispute.list.useQuery({
    status: "open",
    limit: 50,
  });

  const resolveMutation = trpc.dispute.resolve.useMutation({
    onSuccess: () => {
      toast.success("Dispute resolved");
      utils.dispute.list.invalidate();
      utils.admin.stats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleResolve(id: number, status: "resolved_for_challenger" | "resolved_for_operator" | "dismissed") {
    const notes = window.prompt("Resolution notes (optional):");
    resolveMutation.mutate({ id, status, resolutionNotes: notes || undefined });
  }

  if (isLoading) {
    return <div className="text-zinc-500 text-sm py-8 text-center">Loading disputes...</div>;
  }

  const disputes = data?.disputes ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-zinc-500">
            <th className="py-3 pr-4">ID</th>
            <th className="py-3 pr-4">Operator</th>
            <th className="py-3 pr-4">Reason</th>
            <th className="py-3 pr-4">Challenger</th>
            <th className="py-3 pr-4">Filed</th>
            <th className="py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((d) => (
            <tr key={d.id} className="border-b border-white/[0.06]/50 hover:bg-zinc-800/30 transition-colors">
              <td className="py-3 pr-4 text-zinc-400 tabular-nums">{d.id}</td>
              <td className="py-3 pr-4 text-zinc-300 tabular-nums">#{d.operatorId}</td>
              <td className="py-3 pr-4 text-white">{d.reason}</td>
              <td className="py-3 pr-4 text-zinc-400 font-mono text-xs">
                {d.challengerWallet.slice(0, 4)}...{d.challengerWallet.slice(-4)}
              </td>
              <td className="py-3 pr-4 text-zinc-500 text-xs">
                {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ". "}
              </td>
              <td className="py-3 space-x-2">
                <button
                  onClick={() => handleResolve(d.id, "resolved_for_challenger")}
                  disabled={resolveMutation.isPending}
                  className="text-xs px-3 py-1 bg-white text-zinc-900 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  For Challenger
                </button>
                <button
                  onClick={() => handleResolve(d.id, "resolved_for_operator")}
                  disabled={resolveMutation.isPending}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  For Operator
                </button>
                <button
                  onClick={() => handleResolve(d.id, "dismissed")}
                  disabled={resolveMutation.isPending}
                  className="text-xs px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors disabled:opacity-50"
                >
                  Dismiss
                </button>
              </td>
            </tr>
          ))}
          {disputes.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">No open disputes</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ── Audit Log ─────────────────────────────────────────────────────────── */

function AuditLog() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 30;

  const { data, isLoading } = trpc.admin.auditLog.useQuery({
    action: search || undefined,
    limit,
    offset: page * limit,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Filter by action (e.g. admin.verify_operator)..."
          className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] text-white text-sm px-3 py-2 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
        />
      </div>
      {isLoading ? (
        <div className="text-zinc-500 text-sm py-8 text-center">Loading audit log...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="py-3 pr-4">Time</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Action</th>
                  <th className="py-3 pr-4">Target</th>
                  <th className="py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/[0.06]/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 pr-4 text-zinc-500 text-xs whitespace-nowrap">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ". "}
                    </td>
                    <td className="py-3 pr-4 text-zinc-400 tabular-nums">{entry.userId ?? ". "}</td>
                    <td className="py-3 pr-4 text-white font-mono text-xs">{entry.action}</td>
                    <td className="py-3 pr-4 text-zinc-400 text-xs">
                      {entry.targetType ? `${entry.targetType}#${entry.targetId}` : ". "}
                    </td>
                    <td className="py-3 text-zinc-500 text-xs max-w-xs truncate">
                      {entry.details ? JSON.stringify(entry.details) : ". "}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm">No audit log entries</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-zinc-500">{total} entries total</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-xs text-zinc-500 py-1">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-xs px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Main Admin Page ───────────────────────────────────────────────────── */

type Tab = "operators" | "disputes" | "audit";

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("operators");

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="text-zinc-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center space-y-3">
            <div className="text-xl font-normal text-white">Access Denied</div>
            <div className="text-sm text-zinc-500">
              This page is restricted to admin accounts.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "operators", label: "Operators" },
    { key: "disputes", label: "Disputes" },
    { key: "audit", label: "Audit Log" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-[1520px] mx-auto px-12 pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Protocol management and oversight</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {statsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.06] p-5 animate-pulse">
                <div className="h-3 bg-zinc-800 rounded w-16 mb-3" />
                <div className="h-7 bg-zinc-800 rounded w-12" />
              </div>
            ))
          ) : stats ? (
            <>
              <StatCard label="Users" value={stats.users} />
              <StatCard label="Operators" value={stats.operators} />
              <StatCard label="Invocations 24h" value={stats.invocations24h} />
              <StatCard label="Revenue 24h" value={`$${parseFloat(stats.revenue24h).toFixed(2)}`} />
              <StatCard label="Open Disputes" value={stats.openDisputes} />
              <StatCard label="Validators" value={stats.validators} />
            </>
          ) : (
            <div className="col-span-full text-zinc-500 text-sm">Failed to load stats</div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm px-4 py-2.5 transition-colors ${
                activeTab === tab.key
                  ? "text-white border-b-2 border-white -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "operators" && <OperatorsTable />}
        {activeTab === "disputes" && <DisputesQueue />}
        {activeTab === "audit" && <AuditLog />}
      </div>
    </div>
  );
}
