import { useEffect, useState } from "react";
import { MessageSquare, Trash2, Send } from "lucide-react";
import Button from "./Button";
import { createComment, getBillComments, deleteComment } from "../api/features";

export default function BillCommentsSection({ billId, user, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComments();
  }, [billId]);

  const fetchComments = async () => {
    try {
      const data = await getBillComments(billId);
      setComments(data || []);
    } catch {
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createComment({
        billId,
        authorEmail: user.email,
        authorName: user.name,
        comment: newComment,
        commentType,
      });
      setNewComment("");
      setCommentType("comment");
      fetchComments();
      onCommentAdded?.();
    } catch (err) {
      setError(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      setError(err.message || "Failed to delete comment");
    }
  };

  const getCommentTypeColor = (type) => {
    switch (type) {
      case "rejection_reason":
        return "bg-rose-100/20 border-rose-200/30 dark:bg-rose-900/20 dark:border-rose-800/30 text-rose-600 dark:text-rose-400";
      case "approval_note":
        return "bg-emerald-100/20 border-emerald-200/30 dark:bg-emerald-900/20 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400";
      default:
        return "bg-cyan-100/20 border-cyan-200/30 dark:bg-cyan-900/20 dark:border-cyan-800/30 text-cyan-600 dark:text-cyan-400";
    }
  };

  return (
    <div className="panel rounded-2xl border border-slate-200 p-6 shadow-panel dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare size={20} className="text-cyan-500" />
        Comments & Notes
      </h3>

      {/* Comments List */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400">No comments yet. Be the first to add one!</p>
        ) : (
          comments.map((cmt) => (
            <div
              key={cmt.commentId}
              className={`rounded-lg border p-3 ${getCommentTypeColor(cmt.commentType)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{cmt.authorName}</p>
                  <p className="text-xs opacity-70">
                    {cmt.commentType === "rejection_reason" && "Rejection Reason"}
                    {cmt.commentType === "approval_note" && "Approval Note"}
                    {cmt.commentType === "comment" && "Comment"}
                    {" • "}
                    {new Date(cmt.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {cmt.authorEmail === user?.email && (
                  <button
                    onClick={() => handleDeleteComment(cmt.commentId)}
                    className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="text-sm">{cmt.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <form onSubmit={handleAddComment} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Comment Type
            </label>
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="comment">General Comment</option>
              <option value="approval_note">Approval Note</option>
              <option value="rejection_reason">Rejection Reason</option>
            </select>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Write your comment..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <Button type="submit" disabled={submitting} className="flex items-center gap-2 w-full justify-center">
            <Send size={16} />
            {submitting ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
