import { useState } from 'react';
import { Ambient } from '@/components/layout/Ambient';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { TextField, TextArea } from '@/components/ui/TextField';
import { Icon } from '@/components/Icon';
import { useToast } from '@/components/ui/Toast';
import { delay } from '@/lib/utils';

const FAQS = [
  {
    q: 'How do AI interviews work?',
    a: 'Our AI analyzes your spoken responses in real time using advanced language models to evaluate your communication clarity, structural methodology (like STAR), and topic relevance.',
  },
  {
    q: 'Can I practice with my own resume?',
    a: 'Yes. Go to Practice, upload your PDF, and the AI extracts your skills to generate personalized interview questions.',
  },
  {
    q: 'Are my recordings saved?',
    a: 'Audio is processed securely and is never stored permanently. Transcripts and session analytics are kept for your review.',
  },
  {
    q: 'How is my score calculated?',
    a: 'Your score aggregates several factors: relevance, speaking pace, filler-word usage, and how well you answer the specific prompt.',
  },
];

export function HelpSupportScreen() {
  const toast = useToast();
  const [open, setOpen] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    await delay(1000);
    setSending(false);
    setSubject('');
    setMessage('');
    toast.success('Message sent. Support will contact you soon.');
  };

  return (
    <>
      <Ambient />
      <TopBar title="Help & Support" showBack titleAlign="left" />
      <div className="page page-narrow" style={{ paddingTop: 'var(--sp-5)' }}>
        <h2 className="headline" style={{ marginBottom: 'var(--sp-4)' }}>Frequently asked questions</h2>
        <div className="stack gap-3" style={{ marginBottom: 'var(--sp-8)' }}>
          {FAQS.map((faq, i) => {
            const expanded = open === i;
            return (
              <GlassCard key={i} pad="none">
                <button
                  className="row between"
                  style={{ width: '100%', padding: 'var(--sp-4)', textAlign: 'left', gap: 'var(--sp-3)' }}
                  onClick={() => setOpen(expanded ? null : i)}
                  aria-expanded={expanded}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{faq.q}</span>
                  <Icon
                    name="chevron-down"
                    size={18}
                    color="var(--primary)"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur)' }}
                  />
                </button>
                {expanded && (
                  <p className="body" style={{ padding: '0 var(--sp-4) var(--sp-4)', lineHeight: 1.55 }}>
                    {faq.a}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>

        <h2 className="headline">Contact us</h2>
        <p className="body" style={{ margin: 'var(--sp-1) 0 var(--sp-4)' }}>
          Can’t find what you’re looking for? Send us a message.
        </p>
        <GlassCard pad="lg">
          <div className="stack gap-4">
            <TextField
              label="Subject"
              placeholder="What’s this about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <TextArea
              label="How can we help you?"
              placeholder="Tell us what’s going on…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <Button block loading={sending} onClick={send} leading={<Icon name="send" size={18} />}>
              Send message
            </Button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
