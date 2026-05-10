import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  { icon: '🎯', title: 'AI-Powered Learning', desc: 'Personalized recommendations based on your weak areas and performance patterns' },
  { icon: '📝', title: 'CAT-Style Mocks', desc: 'Full-length mocks with section timing, virtual calculator, and detailed analytics' },
  { icon: '⚔️', title: 'Battle Arena', desc: 'Real-time 1v1 battles to challenge friends and climb the leaderboard' },
  { icon: '📊', title: 'Advanced Analytics', desc: 'Track your progress with radar charts, heatmaps, and percentile trends' },
  { icon: '🍅', title: 'Focus Mode', desc: 'Pomodoro timer with session tracking to maximize your productivity' },
  { icon: '🏆', title: 'Rewards System', desc: 'Earn XP, badges, and achievements as you progress in your preparation' },
];

const testimonials = [
  { name: 'Priya S.', role: 'IIM Ahmedabad', quote: 'TechScholars helped me identify my weak areas in LRDI. The AI recommendations were spot on!' },
  { name: 'Rahul M.', role: 'IIM Bangalore', quote: 'The mock tests feel exactly like the real CAT. Best practice platform out there.' },
  { name: 'Ananya K.', role: 'XLRI Jamshedpur', quote: 'Battle mode made studying fun. I competed with friends and improved my speed significantly.' },
];

const stats = [
  { value: '50,000+', label: 'Active Students' },
  { value: '10M+', label: 'Questions Solved' },
  { value: '95%', label: 'Success Rate' },
  { value: '4.9/5', label: 'Student Rating' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="font-bold text-xl">TechScholars</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm hover:text-primary">Features</Link>
            <Link href="#testimonials" className="text-sm hover:text-primary">Testimonials</Link>
            <Link href="#pricing" className="text-sm hover:text-primary">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login"><Button variant="ghost">Sign In</Button></Link>
            <Link href="/auth/register"><Button>Get Started Free</Button></Link>
          </div>
        </div>
      </header>

      <section className="py-20 md:py-32 text-center">
        <div className="container">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Now with AI-Powered Recommendations
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Crack CAT with<br />
            <span className="text-primary">AI-Powered Prep</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Personalized practice, AI insights, real-time battles, and comprehensive analytics.
            The most intelligent CAT preparation platform built by IIM students.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register"><Button size="lg" className="px-8">Start Free Trial</Button></Link>
            <Link href="/auth/login"><Button size="lg" variant="outline">Watch Demo</Button></Link>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Crack CAT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="p-6">
                <CardContent className="p-0">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">AI That Knows Your Weak Spots</h2>
              <p className="text-muted-foreground mb-6">
                Our AI analyzes your performance patterns, accuracy trends, and time management to generate
                personalized recommendations. It identifies topics that need attention and creates a smart
                revision plan just for you.
              </p>
              <ul className="space-y-3">
                {['Topic-wise weakness detection', 'Speed vs accuracy analysis', 'Smart revision scheduling', 'Daily practice recommendations'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <p className="font-semibold">AI Analysis</p>
                <p className="text-sm text-muted-foreground">Analyzing your performance...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by CAT Aspirants</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="p-6">
                <CardContent className="p-0">
                  <div className="text-primary text-4xl mb-4">"</div>
                  <p className="text-muted-foreground mb-4">{t.quote}</p>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Start free, upgrade when you're ready</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <Card className="p-8">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-6">₹0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['500 practice questions/month', '2 mock tests', 'Basic analytics', 'Community leaderboard', '5 battles/day'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register"><Button variant="outline" className="w-full">Get Started</Button></Link>
            </Card>
            <Card className="p-8 border-primary">
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-6">₹499<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <ul className="space-y-3 mb-8">
                {['Unlimited practice', '20 mock tests/month', 'AI recommendations', 'Advanced analytics', 'Unlimited battles', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register"><Button className="w-full">Start Free Trial</Button></Link>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <span className="font-bold">TechScholars</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 TechScholars. Built for CAT aspirants by IIM students.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
