import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LedgerLeaf Invoice Workspace" },
      {
        name: "description",
        content:
          "Sign in to LedgerLeaf to create GST invoices and quotations, save them to the cloud and download PDFs.",
      },
      { property: "og:title", content: "Sign in — LedgerLeaf Invoice Workspace" },
      {
        property: "og:description",
        content: "Access your saved invoices, quotations and team from any device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setMsg("Account ban gaya. Agar email confirmation on hai to inbox check karein.");
        const { data } = await supabase.auth.getSession();
        if (data.session) navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMsg(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setMsg(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <Link to="/" className="brand">
          LedgerLeaf
        </Link>
        <h1 className="mt-4 text-xl font-semibold">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invoices, quotations aur team — sab ek hi jagah, cloud me saved.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <div className="space-y-1">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={google} disabled={busy}>
          Continue with Google
        </Button>

        {msg && <p className="mt-3 text-sm text-destructive">{msg}</p>}

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-primary"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "Naya account banayein"
            : "Pehle se account hai? Sign in karein"}
        </button>
      </div>
    </main>
  );
}
