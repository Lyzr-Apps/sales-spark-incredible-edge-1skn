'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { FiSearch, FiCalendar, FiSend, FiEdit2, FiCheck, FiClock, FiTrendingUp, FiX, FiChevronLeft, FiChevronRight, FiBarChart2, FiTarget, FiStar, FiHash, FiAlertCircle, FiActivity, FiFileText, FiTwitter, FiRefreshCw, FiCopy, FiTrash2, FiExternalLink, FiPlus, FiAward, FiZap, FiFacebook, FiInstagram, FiVideo } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

// ─── Agent IDs ───────────────────────────────────────────────────────────────
const TOPIC_RESEARCH_AGENT_ID = '699810b41c7942f1496c5794'
const AD_COPY_AGENT_ID = '699810b4d3087087d129a27c'
const TWITTER_PUBLISHER_AGENT_ID = '699810c2d3087087d129a282'
const FACEBOOK_PUBLISHER_AGENT_ID = '6998142a549d879ea245fe1b'
const INSTAGRAM_PUBLISHER_AGENT_ID = '6998142be759fc2f0f4fe552'
const TIKTOK_PUBLISHER_AGENT_ID = '6998142c5c2b072508969246'

// ─── Platform Config ─────────────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { agentId: string; icon: React.ReactNode; label: string; color: string }> = {
  Twitter: { agentId: TWITTER_PUBLISHER_AGENT_ID, icon: <FiTwitter className="w-3.5 h-3.5" />, label: 'Twitter / X', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  Facebook: { agentId: FACEBOOK_PUBLISHER_AGENT_ID, icon: <FiFacebook className="w-3.5 h-3.5" />, label: 'Facebook', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  Instagram: { agentId: INSTAGRAM_PUBLISHER_AGENT_ID, icon: <FiInstagram className="w-3.5 h-3.5" />, label: 'Instagram', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  TikTok: { agentId: TIKTOK_PUBLISHER_AGENT_ID, icon: <FiVideo className="w-3.5 h-3.5" />, label: 'TikTok', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  LinkedIn: { agentId: '', icon: <FiExternalLink className="w-3.5 h-3.5" />, label: 'LinkedIn', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface TopicItem {
  title: string
  description: string
  relevance_score: number
  keywords: string[]
  content_angle: string
}

interface AdVariation {
  id: number
  copy_text: string
  approach: string
  seo_keywords: string[]
  character_count: number
  platform_optimized: string
}

interface ApprovedCopy {
  id: string
  copy_text: string
  platform: string
  approach: string
  seo_keywords: string[]
  character_count: number
  approved_at: string
  status: 'approved' | 'scheduled' | 'published'
  scheduled_for?: string
  published_at?: string
  post_url?: string
  published_platform?: string
}

interface ActivityItem {
  id: string
  type: 'generated' | 'approved' | 'published' | 'scheduled'
  description: string
  timestamp: string
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_TOPICS: TopicItem[] = [
  { title: 'AI-Powered Customer Service Trends', description: 'How AI chatbots are revolutionizing support with 24/7 availability and personalized responses.', relevance_score: 95, keywords: ['AI chatbots', 'customer service', 'automation', 'NLP'], content_angle: 'Case study approach showing ROI improvements' },
  { title: 'Sustainable Marketing Practices', description: 'Eco-conscious branding strategies that resonate with Gen Z and millennial audiences.', relevance_score: 88, keywords: ['sustainability', 'green marketing', 'eco-brand', 'Gen Z'], content_angle: 'Values-driven storytelling with data backing' },
  { title: 'Short-Form Video Dominance', description: 'TikTok and Reels continue to dominate engagement metrics across all demographics.', relevance_score: 92, keywords: ['short-form video', 'TikTok', 'Reels', 'engagement'], content_angle: 'Platform comparison with actionable tips' },
  { title: 'Privacy-First Advertising', description: 'Cookie deprecation drives new approaches to contextual and first-party data strategies.', relevance_score: 85, keywords: ['privacy', 'cookies', 'first-party data', 'GDPR'], content_angle: 'Technical guide with compliance checklist' },
  { title: 'Influencer Marketing Evolution', description: 'Micro and nano-influencers deliver higher engagement rates than celebrity endorsements.', relevance_score: 90, keywords: ['influencer', 'micro-influencer', 'UGC', 'ROI'], content_angle: 'Data comparison micro vs macro influencers' },
  { title: 'Voice Search Optimization', description: 'Smart speaker adoption drives need for conversational SEO strategies.', relevance_score: 82, keywords: ['voice search', 'smart speakers', 'conversational SEO'], content_angle: 'Step-by-step optimization playbook' },
]

const SAMPLE_VARIATIONS: AdVariation[] = [
  { id: 1, copy_text: 'Transform your customer experience with AI-powered support. 24/7 availability, instant responses, and personalized solutions that scale. Start your free trial today.', approach: 'benefit-driven', seo_keywords: ['AI customer service', 'chatbot solution', 'automated support'], character_count: 168, platform_optimized: 'Twitter' },
  { id: 2, copy_text: 'Still losing customers to slow response times? Our AI handles 10,000+ conversations simultaneously with 98% satisfaction rates. See the difference in 14 days.', approach: 'pain-point', seo_keywords: ['fast customer support', 'AI automation', 'customer satisfaction'], character_count: 172, platform_optimized: 'Twitter' },
  { id: 3, copy_text: 'Join 5,000+ brands using AI to deliver exceptional customer service. Reduce costs by 60% while boosting satisfaction scores. Book a demo.', approach: 'social-proof', seo_keywords: ['AI brands', 'cost reduction', 'customer service AI'], character_count: 145, platform_optimized: 'Twitter' },
]

const SAMPLE_APPROVED: ApprovedCopy[] = [
  { id: 'sample-1', copy_text: 'Transform your customer experience with AI-powered support. 24/7 availability, instant responses, and personalized solutions that scale. Start your free trial today.', platform: 'Twitter', approach: 'benefit-driven', seo_keywords: ['AI customer service', 'chatbot solution'], character_count: 168, approved_at: new Date(Date.now() - 86400000).toISOString(), status: 'approved' },
  { id: 'sample-2', copy_text: 'Join 5,000+ brands using AI to deliver exceptional customer service. Reduce costs by 60% while boosting satisfaction scores. Book a demo.', platform: 'Facebook', approach: 'social-proof', seo_keywords: ['AI brands', 'cost reduction'], character_count: 145, approved_at: new Date(Date.now() - 172800000).toISOString(), status: 'published', published_at: new Date(Date.now() - 100000000).toISOString(), post_url: 'https://facebook.com/example/posts/123', published_platform: 'Facebook' },
]

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  { id: 'act-1', type: 'generated', description: 'Generated 3 ad copy variations for Twitter', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'act-2', type: 'approved', description: 'Approved "Transform your customer experience..." for Twitter', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'act-3', type: 'published', description: 'Published social-proof copy to Twitter', timestamp: new Date(Date.now() - 100000000).toISOString() },
  { id: 'act-4', type: 'generated', description: 'Researched 6 trending topics in Digital Marketing', timestamp: new Date(Date.now() - 200000000).toISOString() },
]

// ─── Markdown Renderer ──────────────────────────────────────────────────────
function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ─── ErrorBoundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch { /* ignore */ }
  return fallback
}

function saveToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore */ }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── Inline Banner ──────────────────────────────────────────────────────────
function InlineBanner({ type, message, onDismiss }: { type: 'success' | 'error'; message: string; onDismiss: () => void }) {
  useEffect(() => {
    if (type === 'success') {
      const t = setTimeout(onDismiss, 5000)
      return () => clearTimeout(t)
    }
  }, [type, onDismiss])

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-[0.875rem] text-sm font-medium ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {type === 'success' ? <FiCheck className="w-4 h-4 flex-shrink-0" /> : <FiAlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="flex-shrink-0 hover:opacity-70 transition-opacity"><FiX className="w-4 h-4" /></button>
    </div>
  )
}

// ─── Glass Card ─────────────────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card/75 backdrop-blur-[16px] border border-white/[0.18] rounded-[0.875rem] shadow-md ${className}`}>
      {children}
    </div>
  )
}

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend?: string }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-[0.625rem] bg-primary/10 text-primary">{icon}</div>
        {trend && (
          <span className="text-xs font-medium text-green-600 flex items-center gap-1">
            <FiTrendingUp className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold tracking-[-0.01em] text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </GlassCard>
  )
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────
function DashboardTab({ approvedCopies, activities, onNavigate }: { approvedCopies: ApprovedCopy[]; activities: ActivityItem[]; onNavigate: (tab: string) => void }) {
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date())

  const published = approvedCopies.filter(c => c.status === 'published')
  const scheduled = approvedCopies.filter(c => c.status === 'scheduled')
  const totalApproved = approvedCopies.length

  const year = calendarDate.getFullYear()
  const month = calendarDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarDays.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d)

  const getStatusForDay = (day: number): string | null => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    for (const copy of approvedCopies) {
      if (copy.status === 'published' && copy.published_at?.startsWith(dateStr)) return 'published'
      if (copy.status === 'scheduled' && copy.scheduled_for?.startsWith(dateStr)) return 'scheduled'
    }
    return null
  }

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1))

  const isEmpty = approvedCopies.length === 0 && activities.length === 0

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FiCalendar className="w-5 h-5" />} label="Scheduled Posts" value={scheduled.length} trend={scheduled.length > 0 ? `${scheduled.length} pending` : undefined} />
        <MetricCard icon={<FiSend className="w-5 h-5" />} label="Published Posts" value={published.length} trend={published.length > 0 ? `+${published.length}` : undefined} />
        <MetricCard icon={<FiBarChart2 className="w-5 h-5" />} label="Total Approved" value={totalApproved} />
        <MetricCard icon={<FiAward className="w-5 h-5" />} label="Engagement Rate" value={published.length > 0 ? '4.2%' : '--'} trend={published.length > 0 ? '+0.8%' : undefined} />
      </div>

      {isEmpty ? (
        <GlassCard className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FiZap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to AdCopy Pro</h3>
            <p className="text-muted-foreground mb-6 leading-[1.55]">Start by researching trending topics in your industry, then generate compelling ad copy with AI assistance.</p>
            <Button onClick={() => onNavigate('research')} className="rounded-[0.875rem]">
              <FiSearch className="w-4 h-4 mr-2" />Start Researching Topics
            </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Content Calendar */}
          <GlassCard className="lg:col-span-3 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Content Calendar</h3>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors"><FiChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
                <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-muted transition-colors"><FiChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const status = day ? getStatusForDay(day) : null
                return (
                  <div key={`cal-${i}`} className={`relative py-2 text-sm rounded-md ${day ? 'hover:bg-muted/50 transition-colors' : ''}`}>
                    {day && (
                      <>
                        <span className="text-foreground/80">{day}</span>
                        {status && (
                          <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${status === 'published' ? 'bg-green-500' : 'bg-primary'}`} />
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-primary" />Scheduled</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><div className="w-2 h-2 rounded-full bg-green-500" />Published</div>
            </div>
          </GlassCard>

          {/* Activity Feed */}
          <GlassCard className="lg:col-span-2 p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Recent Activity</h3>
            <ScrollArea className="h-[320px]">
              <div className="space-y-3 pr-2">
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${act.type === 'published' ? 'bg-green-100 text-green-600' : act.type === 'approved' ? 'bg-blue-100 text-blue-600' : act.type === 'scheduled' ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                        {act.type === 'published' ? <FiSend className="w-3.5 h-3.5" /> : act.type === 'approved' ? <FiCheck className="w-3.5 h-3.5" /> : act.type === 'scheduled' ? <FiClock className="w-3.5 h-3.5" /> : <FiFileText className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug truncate">{act.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(act.timestamp)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </GlassCard>
        </div>
      )}
    </div>
  )
}

// ─── Topic Research Tab ─────────────────────────────────────────────────────
function TopicResearchTab({ onUseTopic, sampleMode, setActiveAgentId }: { onUseTopic: (topic: TopicItem) => void; sampleMode: boolean; setActiveAgentId: (id: string | null) => void }) {
  const [industry, setIndustry] = useState('')
  const [audience, setAudience] = useState('')
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [industrySummary, setIndustrySummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sampleMode) {
      setTopics(SAMPLE_TOPICS)
      setIndustrySummary('The digital marketing landscape is rapidly evolving with AI integration, privacy-first approaches, and short-form video dominating engagement metrics across platforms.')
      setIndustry('Digital Marketing')
      setAudience('Marketing managers and brand strategists')
    } else {
      setTopics([])
      setIndustrySummary('')
    }
  }, [sampleMode])

  const handleResearch = async () => {
    if (!industry.trim()) return
    setLoading(true)
    setError(null)
    setActiveAgentId(TOPIC_RESEARCH_AGENT_ID)

    try {
      const message = `Research trending topics for the ${industry.trim()} industry targeting ${audience.trim() || 'general audience'}. Find 6 trending topics with keywords and content angles.`
      const result = await callAIAgent(message, TOPIC_RESEARCH_AGENT_ID)

      if (result.success) {
        const rawResult = result?.response?.result
        let parsed = rawResult
        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult)
        }
        if (parsed && Array.isArray(parsed?.topics)) {
          setTopics(parsed.topics)
          setIndustrySummary(parsed?.industry_summary ?? '')
        } else {
          setError('Unexpected response format. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to research topics. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Panel */}
      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <FiSearch className="w-5 h-5 text-primary" />Discover Trending Topics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry" className="text-sm font-medium mb-1.5 block">Industry / Niche</Label>
            <Input id="industry" placeholder="e.g., SaaS, Healthcare, E-commerce" value={industry} onChange={(e) => setIndustry(e.target.value)} className="rounded-[0.625rem]" />
          </div>
          <div>
            <Label htmlFor="audience" className="text-sm font-medium mb-1.5 block">Target Audience Keywords</Label>
            <Input id="audience" placeholder="e.g., small business owners, developers" value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-[0.625rem]" />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleResearch} disabled={loading || !industry.trim()} className="rounded-[0.875rem]">
            {loading ? <><FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />Researching...</> : <><FiSearch className="w-4 h-4 mr-2" />Find Topics</>}
          </Button>
        </div>
      </GlassCard>

      {/* Error */}
      {error && <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {/* Industry Summary */}
      {industrySummary && !loading && (
        <GlassCard className="p-5">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><FiTarget className="w-4 h-4 text-primary" />Industry Summary</h4>
          <div className="text-sm text-muted-foreground leading-[1.55]">{renderMarkdown(industrySummary)}</div>
        </GlassCard>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <GlassCard key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-4" />
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded-[0.625rem]" />
            </GlassCard>
          ))}
        </div>
      )}

      {/* Topic Cards */}
      {!loading && topics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, idx) => (
            <GlassCard key={idx} className="p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground leading-snug flex-1 pr-2">{topic?.title ?? 'Untitled Topic'}</h4>
                <Badge variant="secondary" className="flex-shrink-0 text-xs font-medium bg-primary/10 text-primary border-0">
                  {typeof topic?.relevance_score === 'number' ? `${topic.relevance_score}%` : '--'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-[1.55] mb-3 flex-1">{topic?.description ?? ''}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {Array.isArray(topic?.keywords) && topic.keywords.map((kw, ki) => (
                  <Badge key={ki} variant="outline" className="text-xs font-normal py-0.5 px-2 rounded-full">
                    <FiHash className="w-2.5 h-2.5 mr-0.5" />{kw}
                  </Badge>
                ))}
              </div>
              {topic?.content_angle && (
                <p className="text-xs text-muted-foreground mb-3 italic">Angle: {topic.content_angle}</p>
              )}
              <Button variant="outline" size="sm" onClick={() => onUseTopic(topic)} className="w-full rounded-[0.625rem] mt-auto">
                <FiPlus className="w-3.5 h-3.5 mr-1.5" />Use This Topic
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && topics.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FiSearch className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Enter your industry and audience to discover trending topics</p>
        </div>
      )}
    </div>
  )
}

// ─── Create Ad Copy Tab ─────────────────────────────────────────────────────
function CreateAdCopyTab({ selectedTopic, approvedCopies, setApprovedCopies, activities, setActivities, sampleMode, setActiveAgentId }: {
  selectedTopic: TopicItem | null
  approvedCopies: ApprovedCopy[]
  setApprovedCopies: React.Dispatch<React.SetStateAction<ApprovedCopy[]>>
  activities: ActivityItem[]
  setActivities: React.Dispatch<React.SetStateAction<ActivityItem[]>>
  sampleMode: boolean
  setActiveAgentId: (id: string | null) => void
}) {
  const [platform, setPlatform] = useState('Twitter')
  const [tone, setTone] = useState('Professional')
  const [targetAudience, setTargetAudience] = useState('')
  const [cta, setCta] = useState('')
  const [topic, setTopic] = useState('')
  const [variations, setVariations] = useState<AdVariation[]>([])
  const [campaignSummary, setCampaignSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [approvedIds, setApprovedIds] = useState<Set<number>>(new Set())
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (selectedTopic) {
      setTopic(selectedTopic.title + (selectedTopic?.content_angle ? ' - ' + selectedTopic.content_angle : ''))
    }
  }, [selectedTopic])

  useEffect(() => {
    if (sampleMode) {
      setVariations(SAMPLE_VARIATIONS)
      setCampaignSummary('This campaign targets marketing professionals with three distinct approaches: benefit-driven, pain-point, and social-proof messaging. Each variation is optimized for Twitter character limits.')
      setTopic('AI-Powered Customer Service Trends')
      setTargetAudience('Marketing managers')
      setCta('Start your free trial')
    } else {
      setVariations([])
      setCampaignSummary('')
    }
  }, [sampleMode])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setApprovedIds(new Set())
    setActiveAgentId(AD_COPY_AGENT_ID)

    try {
      const message = `Generate 3 SEO-optimized ad copy variations for ${platform}. Tone: ${tone}. Target audience: ${targetAudience.trim() || 'general audience'}. CTA: ${cta.trim() || 'Learn more'}. Topic: ${topic.trim()}. Each variation should use a different approach.`
      const result = await callAIAgent(message, AD_COPY_AGENT_ID)

      if (result.success) {
        const rawResult = result?.response?.result
        let parsed = rawResult
        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult)
        }
        if (parsed && Array.isArray(parsed?.variations)) {
          setVariations(parsed.variations)
          setCampaignSummary(parsed?.campaign_summary ?? '')
          const newActivity: ActivityItem = {
            id: Date.now().toString(),
            type: 'generated',
            description: `Generated ${parsed.variations.length} ad copy variations for ${platform}`,
            timestamp: new Date().toISOString(),
          }
          setActivities(prev => [newActivity, ...prev])
        } else {
          setError('Unexpected response format. Please try again.')
        }
      } else {
        setError(result?.error ?? 'Failed to generate ad copy. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  const handleApprove = (variation: AdVariation) => {
    const alreadyApproved = approvedIds.has(variation.id)
    if (alreadyApproved) {
      setApprovedIds(prev => {
        const next = new Set(prev)
        next.delete(variation.id)
        return next
      })
      setApprovedCopies(prev => prev.filter(c => !c.id.startsWith(`var-${variation.id}-`)))
      return
    }

    setApprovedIds(prev => new Set(prev).add(variation.id))
    const approved: ApprovedCopy = {
      id: `var-${variation.id}-${Date.now()}`,
      copy_text: variation?.copy_text ?? '',
      platform: variation?.platform_optimized ?? platform,
      approach: variation?.approach ?? '',
      seo_keywords: Array.isArray(variation?.seo_keywords) ? variation.seo_keywords : [],
      character_count: variation?.character_count ?? (variation?.copy_text?.length ?? 0),
      approved_at: new Date().toISOString(),
      status: 'approved',
    }
    setApprovedCopies(prev => [...prev, approved])

    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'approved',
      description: `Approved "${(variation?.copy_text ?? '').slice(0, 40)}..." for ${platform}`,
      timestamp: new Date().toISOString(),
    }
    setActivities(prev => [newActivity, ...prev])
    setSuccessMsg('Copy approved and added to publish queue')
  }

  const startEdit = (variation: AdVariation) => {
    setEditingId(variation.id)
    setEditText(variation?.copy_text ?? '')
  }

  const saveEdit = (id: number) => {
    setVariations(prev => prev.map(v => v.id === id ? { ...v, copy_text: editText, character_count: editText.length } : v))
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      {successMsg && <InlineBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}
      {error && <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Panel */}
        <GlassCard className="lg:col-span-2 p-6 self-start">
          <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <FiEdit2 className="w-5 h-5 text-primary" />Campaign Setup
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Topic</Label>
              <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter topic or use one from research..." rows={2} className="rounded-[0.625rem] resize-none" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="rounded-[0.625rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Twitter">Twitter / X</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="rounded-[0.625rem]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Inspirational">Inspirational</SelectItem>
                  <SelectItem value="Humorous">Humorous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Target Audience</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., tech-savvy millennials" className="rounded-[0.625rem]" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Call to Action</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g., Start free trial, Book a demo" className="rounded-[0.625rem]" />
            </div>
            <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full rounded-[0.875rem]">
              {loading ? <><FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><FiZap className="w-4 h-4 mr-2" />Generate Ad Copy</>}
            </Button>
          </div>
        </GlassCard>

        {/* Variations Panel */}
        <div className="lg:col-span-3 space-y-4">
          {campaignSummary && !loading && (
            <GlassCard className="p-4">
              <div className="text-sm text-muted-foreground leading-[1.55]">{renderMarkdown(campaignSummary)}</div>
            </GlassCard>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <GlassCard key={i} className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-4/6 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {!loading && variations.length > 0 && variations.map((v) => {
            const isApproved = approvedIds.has(v.id)
            const isEditing = editingId === v.id
            return (
              <GlassCard key={v.id} className={`p-5 transition-all duration-200 ${isApproved ? 'ring-2 ring-green-400/50' : ''}`}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary" className="text-xs font-medium rounded-full">{v?.approach ?? 'Standard'}</Badge>
                  <Badge variant="outline" className="text-xs font-normal rounded-full">{v?.platform_optimized ?? platform}</Badge>
                  <Badge variant="outline" className="text-xs font-normal rounded-full">{v?.character_count ?? (v?.copy_text?.length ?? 0)} chars</Badge>
                  {isApproved && (
                    <Badge className="text-xs font-medium rounded-full bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                      <FiCheck className="w-3 h-3 mr-1" />Approved
                    </Badge>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 mb-3">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} className="rounded-[0.625rem] resize-none text-sm" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(v.id)} className="rounded-[0.625rem]"><FiCheck className="w-3.5 h-3.5 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="rounded-[0.625rem]">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-[1.55] mb-3">{v?.copy_text ?? ''}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Array.isArray(v?.seo_keywords) && v.seo_keywords.map((kw, ki) => (
                    <Badge key={ki} variant="outline" className="text-xs font-normal py-0.5 px-2 rounded-full bg-primary/5 text-primary border-primary/20">
                      <FiHash className="w-2.5 h-2.5 mr-0.5" />{kw}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button size="sm" variant="outline" onClick={() => startEdit(v)} className="rounded-[0.625rem]">
                      <FiEdit2 className="w-3.5 h-3.5 mr-1" />Edit
                    </Button>
                  )}
                  <Button size="sm" variant={isApproved ? 'outline' : 'default'} onClick={() => handleApprove(v)} className="rounded-[0.625rem]">
                    <FiCheck className="w-3.5 h-3.5 mr-1" />{isApproved ? 'Unapprove' : 'Approve'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (v?.copy_text) { try { navigator.clipboard.writeText(v.copy_text) } catch {} } }} className="rounded-[0.625rem]">
                    <FiCopy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassCard>
            )
          })}

          {!loading && variations.length === 0 && (
            <GlassCard className="p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FiFileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Fill in the campaign details and generate compelling ad copy variations</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Schedule & Publish Tab ─────────────────────────────────────────────────
function SchedulePublishTab({ approvedCopies, setApprovedCopies, setActivities, setActiveAgentId }: {
  approvedCopies: ApprovedCopy[]
  setApprovedCopies: React.Dispatch<React.SetStateAction<ApprovedCopy[]>>
  setActivities: React.Dispatch<React.SetStateAction<ActivityItem[]>>
  setActiveAgentId: (id: string | null) => void
}) {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [selectedCopy, setSelectedCopy] = useState<ApprovedCopy | null>(null)
  const [selectedPublishPlatform, setSelectedPublishPlatform] = useState<string>('')
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'scheduled' | 'published'>('all')
  const [scheduleInputs, setScheduleInputs] = useState<Record<string, string>>({})

  const filteredCopies = approvedCopies.filter(c => filter === 'all' || c.status === filter)

  const publishablePlatforms = ['Twitter', 'Facebook', 'Instagram', 'TikTok']

  const handlePublish = async () => {
    if (!selectedCopy || !selectedPublishPlatform) return
    const platformConf = PLATFORM_CONFIG[selectedPublishPlatform]
    if (!platformConf?.agentId) {
      setError(`Publishing to ${selectedPublishPlatform} is not supported yet.`)
      return
    }

    setPublishing(true)
    setError(null)
    setActiveAgentId(platformConf.agentId)

    try {
      const message = `Post this content to ${selectedPublishPlatform}: "${selectedCopy.copy_text}"`
      const result = await callAIAgent(message, platformConf.agentId)

      if (result.success) {
        const rawResult = result?.response?.result
        let parsed = rawResult
        if (typeof rawResult === 'string') {
          parsed = parseLLMJson(rawResult)
        }

        const postUrl = parsed?.post_url ?? parsed?.tweet_url ?? ''
        const responseMessage = parsed?.message ?? `Successfully published to ${selectedPublishPlatform}!`
        const publishedText = parsed?.published_text ?? selectedCopy.copy_text
        const postId = parsed?.post_id ?? parsed?.tweet_id ?? ''

        setApprovedCopies(prev => prev.map(c =>
          c.id === selectedCopy.id ? { ...c, status: 'published' as const, published_at: new Date().toISOString(), post_url: postUrl, published_platform: selectedPublishPlatform } : c
        ))

        const newActivity: ActivityItem = {
          id: Date.now().toString(),
          type: 'published',
          description: `Published "${(publishedText ?? '').slice(0, 40)}..." to ${selectedPublishPlatform}${postId ? ` (ID: ${postId})` : ''}`,
          timestamp: new Date().toISOString(),
        }
        setActivities(prev => [newActivity, ...prev])
        setSuccessMsg(responseMessage)
        setPublishDialogOpen(false)
      } else {
        setError(result?.error ?? `Failed to publish to ${selectedPublishPlatform}. Please try again.`)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPublishing(false)
      setActiveAgentId(null)
    }
  }

  const handleSchedule = (copy: ApprovedCopy) => {
    const dateVal = scheduleInputs[copy.id]
    if (!dateVal) return
    setApprovedCopies(prev => prev.map(c =>
      c.id === copy.id ? { ...c, status: 'scheduled' as const, scheduled_for: new Date(dateVal).toISOString() } : c
    ))
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type: 'scheduled',
      description: `Scheduled "${(copy?.copy_text ?? '').slice(0, 40)}..." for ${new Date(dateVal).toLocaleDateString()}`,
      timestamp: new Date().toISOString(),
    }
    setActivities(prev => [newActivity, ...prev])
    setSuccessMsg('Post scheduled successfully')
  }

  const handleDelete = (id: string) => {
    setApprovedCopies(prev => prev.filter(c => c.id !== id))
  }

  const openPublishDialog = (copy: ApprovedCopy, platform?: string) => {
    setSelectedCopy(copy)
    setSelectedPublishPlatform(platform ?? copy.platform)
    setPublishDialogOpen(true)
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'scheduled': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'published': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPlatformIcon = (platform: string) => {
    const conf = PLATFORM_CONFIG[platform]
    return conf?.icon ?? <FiSend className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-6">
      {successMsg && <InlineBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />}
      {error && <InlineBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {/* Filter Bar */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          {(['all', 'approved', 'scheduled', 'published'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="rounded-full capitalize text-xs">
              {f === 'all' ? 'All' : f}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">{filteredCopies.length} item{filteredCopies.length !== 1 ? 's' : ''}</span>
        </div>
      </GlassCard>

      {/* Content List */}
      {filteredCopies.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FiSend className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">No content yet</h3>
          <p className="text-sm text-muted-foreground">Approve ad copy variations from the Create tab to see them here</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredCopies.map(copy => (
            <GlassCard key={copy.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`text-xs font-medium rounded-full border ${statusColor(copy.status)} hover:opacity-90`}>
                      {copy.status === 'published' ? <FiCheck className="w-3 h-3 mr-1" /> : copy.status === 'scheduled' ? <FiClock className="w-3 h-3 mr-1" /> : <FiStar className="w-3 h-3 mr-1" />}
                      {copy.status}
                    </Badge>
                    <Badge variant="outline" className={`text-xs font-normal rounded-full border ${PLATFORM_CONFIG[copy.platform]?.color ?? ''}`}>
                      {getPlatformIcon(copy.platform)}
                      <span className="ml-1">{copy.platform}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal rounded-full">{copy.approach}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">{timeAgo(copy.approved_at)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-[1.55] mb-3">{copy?.copy_text ?? ''}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Array.isArray(copy?.seo_keywords) && copy.seo_keywords.map((kw, ki) => (
                      <Badge key={ki} variant="outline" className="text-xs font-normal py-0 px-2 rounded-full">{kw}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <FiHash className="w-3 h-3" />
                    <span>{copy?.character_count ?? 0} characters</span>
                  </div>

                  {/* Schedule Input for approved items */}
                  {copy.status === 'approved' && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Input type="datetime-local" value={scheduleInputs[copy.id] ?? ''} onChange={(e) => setScheduleInputs(prev => ({ ...prev, [copy.id]: e.target.value }))} className="w-auto text-xs rounded-[0.625rem] h-8" />
                      <Button size="sm" variant="outline" onClick={() => handleSchedule(copy)} disabled={!scheduleInputs[copy.id]} className="rounded-[0.625rem] h-8 text-xs">
                        <FiCalendar className="w-3 h-3 mr-1" />Schedule
                      </Button>
                    </div>
                  )}

                  {/* Scheduled date info */}
                  {copy.status === 'scheduled' && copy.scheduled_for && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />Scheduled for: {new Date(copy.scheduled_for).toLocaleString()}
                    </p>
                  )}

                  {/* Published info */}
                  {copy.status === 'published' && copy.post_url && (
                    <a href={copy.post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline">
                      <FiExternalLink className="w-3 h-3" />View on {copy.published_platform ?? copy.platform}
                    </a>
                  )}
                  {copy.status === 'published' && copy.published_at && (
                    <p className="text-xs text-muted-foreground mt-1">Published {copy.published_platform ? `to ${copy.published_platform}` : ''}: {new Date(copy.published_at).toLocaleString()}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {copy.status !== 'published' && (
                    <div className="flex flex-col gap-1.5">
                      {publishablePlatforms.map(plat => {
                        const conf = PLATFORM_CONFIG[plat]
                        if (!conf?.agentId) return null
                        return (
                          <Button key={plat} size="sm" variant={plat === copy.platform ? 'default' : 'outline'} onClick={() => openPublishDialog(copy, plat)} className="rounded-[0.625rem] text-xs justify-start">
                            {conf.icon}<span className="ml-1.5">{plat}</span>
                          </Button>
                        )
                      })}
                    </div>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(copy.id)} className="rounded-[0.625rem] text-xs text-destructive hover:text-destructive">
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="rounded-[0.875rem]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {PLATFORM_CONFIG[selectedPublishPlatform]?.icon ?? <FiSend className="w-5 h-5" />}
              <span>Publish to {selectedPublishPlatform}</span>
            </DialogTitle>
            <DialogDescription>This will post the following content directly to {selectedPublishPlatform}. This action cannot be undone.</DialogDescription>
          </DialogHeader>

          {/* Platform Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Publish to:</span>
            {publishablePlatforms.map(plat => {
              const conf = PLATFORM_CONFIG[plat]
              if (!conf?.agentId) return null
              return (
                <Button key={plat} size="sm" variant={selectedPublishPlatform === plat ? 'default' : 'outline'} onClick={() => setSelectedPublishPlatform(plat)} className={`rounded-full text-xs ${selectedPublishPlatform === plat ? '' : conf.color}`}>
                  {conf.icon}<span className="ml-1">{plat}</span>
                </Button>
              )
            })}
          </div>

          <div className="bg-muted/50 rounded-[0.625rem] p-4 my-2">
            <p className="text-sm text-foreground leading-[1.55]">{selectedCopy?.copy_text ?? ''}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)} disabled={publishing} className="rounded-[0.625rem]">Cancel</Button>
            <Button onClick={handlePublish} disabled={publishing || !selectedPublishPlatform} className="rounded-[0.875rem]">
              {publishing ? <><FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />Publishing...</> : <><FiSend className="w-4 h-4 mr-2" />Publish to {selectedPublishPlatform}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Agent Status Panel ─────────────────────────────────────────────────────
function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: TOPIC_RESEARCH_AGENT_ID, name: 'Topic Research', purpose: 'Discovers trending topics', icon: <FiSearch className="w-3 h-3" /> },
    { id: AD_COPY_AGENT_ID, name: 'Ad Copy Generator', purpose: 'Creates SEO-optimized copy', icon: <FiEdit2 className="w-3 h-3" /> },
    { id: TWITTER_PUBLISHER_AGENT_ID, name: 'Twitter Publisher', purpose: 'Posts to Twitter / X', icon: <FiTwitter className="w-3 h-3" /> },
    { id: FACEBOOK_PUBLISHER_AGENT_ID, name: 'Facebook Publisher', purpose: 'Posts to Facebook', icon: <FiFacebook className="w-3 h-3" /> },
    { id: INSTAGRAM_PUBLISHER_AGENT_ID, name: 'Instagram Publisher', purpose: 'Posts to Instagram', icon: <FiInstagram className="w-3 h-3" /> },
    { id: TIKTOK_PUBLISHER_AGENT_ID, name: 'TikTok Publisher', purpose: 'Posts to TikTok', icon: <FiVideo className="w-3 h-3" /> },
  ]

  return (
    <GlassCard className="p-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">AI Agents</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {agents.map(agent => {
          const isActive = activeAgentId === agent.id
          return (
            <div key={agent.id} className={`flex items-center gap-2.5 p-2.5 rounded-[0.625rem] transition-colors ${isActive ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-transparent'}`}>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {agent.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{isActive ? 'Processing...' : agent.purpose}</p>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0 ml-auto" />}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Page() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null)
  const [mounted, setMounted] = useState(false)

  const [approvedCopies, setApprovedCopies] = useState<ApprovedCopy[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    setApprovedCopies(loadFromStorage<ApprovedCopy[]>('adcopy_approved', []))
    setActivities(loadFromStorage<ActivityItem[]>('adcopy_activities', []))
    setMounted(true)
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    if (mounted && !sampleMode) saveToStorage('adcopy_approved', approvedCopies)
  }, [approvedCopies, mounted, sampleMode])

  useEffect(() => {
    if (mounted && !sampleMode) saveToStorage('adcopy_activities', activities)
  }, [activities, mounted, sampleMode])

  // Sample mode
  useEffect(() => {
    if (sampleMode) {
      setApprovedCopies(SAMPLE_APPROVED)
      setActivities(SAMPLE_ACTIVITIES)
    } else if (mounted) {
      setApprovedCopies(loadFromStorage<ApprovedCopy[]>('adcopy_approved', []))
      setActivities(loadFromStorage<ActivityItem[]>('adcopy_activities', []))
    }
  }, [sampleMode, mounted])

  const handleUseTopic = useCallback((topic: TopicItem) => {
    setSelectedTopic(topic)
    setActiveTab('create')
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <FiBarChart2 className="w-4 h-4" /> },
    { id: 'research', label: 'Topic Research', icon: <FiSearch className="w-4 h-4" /> },
    { id: 'create', label: 'Create Ad Copy', icon: <FiEdit2 className="w-4 h-4" /> },
    { id: 'publish', label: 'Schedule & Publish', icon: <FiSend className="w-4 h-4" /> },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(30,50%,97%)] via-[hsl(20,45%,95%)] to-[hsl(40,40%,96%)] text-foreground font-sans">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-[16px] border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-8 h-8 rounded-[0.5rem] bg-primary flex items-center justify-center">
                  <FiZap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-base font-semibold tracking-[-0.01em] text-foreground hidden sm:inline">AdCopy Pro</span>
              </div>

              {/* Tab Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[0.625rem] text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                    {tab.icon}<span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Sample Data Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground hidden sm:inline">Sample Data</Label>
                <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
              </div>
            </div>

            {/* Mobile tabs */}
            <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[0.625rem] text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  {tab.icon}<span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              approvedCopies={sampleMode ? SAMPLE_APPROVED : approvedCopies}
              activities={sampleMode ? SAMPLE_ACTIVITIES : activities}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'research' && (
            <TopicResearchTab
              onUseTopic={handleUseTopic}
              sampleMode={sampleMode}
              setActiveAgentId={setActiveAgentId}
            />
          )}
          {activeTab === 'create' && (
            <CreateAdCopyTab
              selectedTopic={selectedTopic}
              approvedCopies={approvedCopies}
              setApprovedCopies={setApprovedCopies}
              activities={activities}
              setActivities={setActivities}
              sampleMode={sampleMode}
              setActiveAgentId={setActiveAgentId}
            />
          )}
          {activeTab === 'publish' && (
            <SchedulePublishTab
              approvedCopies={approvedCopies}
              setApprovedCopies={setApprovedCopies}
              setActivities={setActivities}
              setActiveAgentId={setActiveAgentId}
            />
          )}

          {/* Agent Status */}
          <div className="mt-8">
            <AgentStatusPanel activeAgentId={activeAgentId} />
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
