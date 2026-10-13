import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeBuoy, Plus, Send, MessageSquare, Clock, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Input, Textarea, Field, Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Avatar } from '@/components/ui/avatar';
import { formatDateTime, timeAgo, titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATEGORIES = ['ORDER', 'PAYMENT', 'DELIVERY', 'RETURN', 'PRODUCT', 'ACCOUNT', 'DISPUTE', 'OTHER'];

export default function CustomerSupportPage() {
  const qc = useQueryClient();
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('ORDER');
  const [priority, setPriority] = useState('MEDIUM');
  const [message, setMessage] = useState('');

  // Reply message
  const [replyText, setReplyText] = useState('');

  // Fetch tickets list
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => get('/support/tickets/my'),
  });

  // Fetch active ticket detail
  const { data: activeTicket, isLoading: loadingDetail } = useQuery({
    queryKey: ['my-ticket', activeTicketId],
    queryFn: () => get(`/support/tickets/my/${activeTicketId}`).then((d) => d.ticket),
    enabled: Boolean(activeTicketId),
  });

  const createTicket = useMutation({
    mutationFn: () =>
      post('/support/tickets', {
        subject,
        category,
        priority,
        message,
      }),
    onSuccess: (res) => {
      toast.success('Ticket submitted successfully');
      setCreateOpen(false);
      setSubject('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['my-tickets'] });
      setActiveTicketId(res.data.ticket._id);
    },
    onError: (e) => toast.error(e.message),
  });

  const sendReply = useMutation({
    mutationFn: () => post(`/support/tickets/my/${activeTicketId}/messages`, { message: replyText }),
    onSuccess: () => {
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['my-ticket', activeTicketId] });
      qc.invalidateQueries({ queryKey: ['my-tickets'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const tickets = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="mt-1 text-sm text-ink-muted">Open a dispute or reach out to our dedicated support agents.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" /> Open Support Ticket
        </Button>
      </div>

      {activeTicketId && activeTicket ? (
        <div className="space-y-4">
          <button
            onClick={() => setActiveTicketId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to tickets list
          </button>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink-muted">#{activeTicket.ticketNumber}</span>
                  <StatusBadge status={activeTicket.status} />
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {titleCase(activeTicket.category)}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-ink">{activeTicket.subject}</h2>
              </div>
              <p className="text-xs text-ink-muted">Started {timeAgo(activeTicket.createdAt)}</p>
            </div>

            {/* Conversation Messages */}
            <div className="max-h-[460px] space-y-4 overflow-y-auto p-5">
              {activeTicket.messages?.map((m, idx) => {
                const isCustomer = m.senderRole === 'CUSTOMER';
                return (
                  <div key={idx} className={cn('flex gap-3', isCustomer ? 'justify-end' : 'justify-start')}>
                    {!isCustomer && <Avatar name="Support Agent" className="size-8 shrink-0 bg-brand-600 text-white" />}
                    <div
                      className={cn(
                        'max-w-lg rounded-2xl p-4 text-sm leading-relaxed',
                        isCustomer
                          ? 'rounded-tr-none bg-brand-600 text-white shadow-sm'
                          : 'rounded-tl-none border border-slate-200 bg-slate-50 text-ink',
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-4 text-[11px] opacity-80">
                        <span className="font-semibold">{isCustomer ? 'You' : 'ShopSphere Support'}</span>
                        <span>{formatDateTime(m.at)}</span>
                      </div>
                      <p className="whitespace-pre-line">{m.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            {activeTicket.status !== 'CLOSED' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (replyText.trim()) sendReply.mutate();
                }}
                className="border-t border-slate-100 bg-white p-4"
              >
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message to support..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" loading={sendReply.isPending} disabled={!replyText.trim()}>
                    <Send className="size-4" /> Reply
                  </Button>
                </div>
              </form>
            ) : (
              <div className="border-t border-slate-100 bg-slate-50 p-4 text-center text-xs text-ink-muted">
                This ticket is marked as resolved and closed.
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
          {!tickets.length ? (
            <Card>
              <EmptyState
                icon={LifeBuoy}
                title="No support tickets"
                description="Have an inquiry about an order or a dispute? We're here to help."
                action={
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="size-4" /> Open Your First Ticket
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card className="divide-y divide-slate-100 overflow-hidden">
              {tickets.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setActiveTicketId(t._id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50/70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-muted">#{t.ticketNumber}</span>
                      <StatusBadge status={t.status} />
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {titleCase(t.category)}
                      </span>
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-ink">{t.subject}</h3>
                    {t.lastMessage && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                        {t.lastMessage.senderRole === 'CUSTOMER' ? 'You: ' : 'Support: '}
                        {t.lastMessage.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span>{timeAgo(t.updatedAt)}</span>
                    <ChevronRight className="size-4 text-slate-300" />
                  </div>
                </button>
              ))}
            </Card>
          )}
        </>
      )}

      {/* Create Ticket Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Open Support Ticket"
        description="Describe your question or issue, and our customer support team will reply promptly."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button loading={createTicket.isPending} onClick={() => createTicket.mutate()} disabled={!subject || !message}>
              Submit Ticket
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Category" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" hint="Brief summary of your inquiry" required>
            <Input
              placeholder="e.g. Issue with delivery timeline for order"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Message" hint="Provide as much context as possible" required>
            <Textarea
              rows={4}
              placeholder="Describe your issue or dispute in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

