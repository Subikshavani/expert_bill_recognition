import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useApi } from "../hooks/useApi";

const quickCards = [
  { title: "Upload Bill", desc: "Submit a new reimbursement request", to: "/employee/upload-bill" },
  { title: "View My Bills", desc: "See all your submitted expenses", to: "/employee/my-bills" },
  { title: "Bill Status Tracking", desc: "Track bill progress through approval flow", to: "/employee/bill-status" },
];

export default function EmployeeHomePage({ user }) {
  const email = encodeURIComponent(user?.email || "");
  const { data } = useApi(`/employee/bills?email=${email}`);
  const bills = data ?? [];

  const pendingStatuses = ["Uploaded", "Under Accounts Review", "Manager Approval", "Finance Approval"];
  const pendingCount = bills.filter((bill) => pendingStatuses.includes(bill.status)).length;
  const approvedCount = bills.filter((bill) => bill.status === "Approved").length;
  const rejectedCount = bills.filter((bill) => bill.status === "Rejected").length;

  return (
    <section className="space-y-5">
      <div className="panel rounded-2xl p-6 shadow-panel">
        <h2 className="page-title text-2xl font-bold">Employee Dashboard</h2>
        <p className="mt-2 text-sm text-slate-400">
          Manage your expenses quickly, {user?.name || "Employee"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Submitted Bills" value={bills.length} delta="Total raised by you" />
        <StatCard title="Pending Bills" value={pendingCount} delta="Awaiting approvals" />
        <StatCard title="Approved Bills" value={approvedCount} delta="Ready for settlement" />
        <StatCard title="Rejected Bills" value={rejectedCount} delta="Need rework or correction" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {quickCards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            className="panel rounded-2xl border border-white/10 p-5 shadow-panel hover:border-cyan-300/30 hover:bg-cyan-400/5"
          >
            <h3 className="page-title text-lg font-semibold text-slate-100">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
