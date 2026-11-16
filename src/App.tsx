import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type Post = { id: string; content: string; x_post_id: string | null; posted_at: string };
type Profile = { id?: string; name?: string; username?: string; profile_image_url?: string };
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<"overview" | "publish" | "history">("overview");
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || !supabase) { setPosts([]); setProfile(null); return; }
    supabase.from("x_posts").select("id,content,x_post_id,posted_at").order("posted_at", { ascending: false }).limit(30)
      .then(({ data, error }) => { if (error) setMessage(error.message); else setPosts(data ?? []); });
  }, [session]);
  async function signIn(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) setMessage(error.message);
  }
  async function checkX() {
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.functions.invoke("x-api", { body: { action: "me" } });
    setBusy(false);
    if (error) { setMessage(await functionError(error)); return; }
    if (data?.error) { setMessage(String(data.error)); return; }
    setProfile(data?.data ?? data?.user ?? data);
    setMessage("Conexión con X comprobada.");
  }
  async function publish() {
    if (!supabase || !draft.trim()) return;
    if (!window.confirm("¿Publicar este texto ahora en X? Esta acción es pública y no se puede deshacer desde JadrDevX.")) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.functions.invoke("x-api", { body: { action: "publish", text: draft.trim(), content: draft.trim() } });
    setBusy(false);
    if (error) { setMessage(await functionError(error)); return; }
    if (data?.error) { setMessage(String(data.error)); return; }
    setMessage("Solicitud de publicación completada. Comprueba el resultado en X.");
    setDraft("");
    const { data: recent } = await supabase.from("x_posts").select("id,content,x_post_id,posted_at").order("posted_at", { ascending: false }).limit(30);
    setPosts(recent ?? []);
  }
  if (!supabase) return <main className="auth"><div className="panel"><h1>JadrDevX</h1><p>Falta configurar Supabase.</p><p>Copia <code>.env.example</code> a <code>.env</code> y añade tu clave pública.</p></div></main>;
  if (!session) return <main className="auth"><form className="panel login" onSubmit={signIn}><span className="eyebrow">JADRDEV · SOCIAL STUDIO</span><h1>JadrDevX</h1><p>Accede con tu usuario de Supabase Auth.</p><label>Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label><label>Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label><button disabled={busy}>{busy ? "Entrando..." : "Entrar al panel"}</button>{message && <p className="notice" role="alert">{message}</p>}</form></main>;
  return <div className="shell"><aside className="sidebar"><div className="brand"><span className="brand-icon">X</span><div><strong>JadrDevX</strong><small>Social Studio</small></div></div><nav><button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>◈ &nbsp; Resumen</button><button className={tab === "publish" ? "active" : ""} onClick={() => setTab("publish")}>✎ &nbsp; Publicar</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>▤ &nbsp; Historial</button></nav><div className="sidebar-bottom"><span>{session.user.email}</span><button onClick={() => supabase.auth.signOut()}>Cerrar sesión ↗</button></div></aside><main className="main"><header><div><span className="eyebrow">PANEL DE CONTROL</span><h1>{tab === "overview" ? "Tu espacio en X" : tab === "publish" ? "Nueva publicación" : "Publicaciones realizadas"}</h1><p>Gestiona tu presencia en X desde un solo lugar.</p></div><span className="pill">● &nbsp; JadrDevX</span></header>{message && <div className="notice" role="status">{message}<button className="close" onClick={() => setMessage("")}>×</button></div>}{tab === "overview" && <><section className="stats"><article className="panel stat"><span>Publicaciones registradas</span><strong>{posts.length}</strong><small>Últimas 30 publicaciones</small></article><article className="panel stat"><span>Cuenta X</span><strong>{profile?.username ? "@" + profile.username : "Sin verificar"}</strong><small>Consulta la conexión para comprobarla</small></article></section><section className="panel feature"><div><span className="eyebrow">INTEGRACIÓN CON X</span><h2>{profile?.name ?? "Conecta con tu cuenta"}</h2><p>Verifica las credenciales configuradas en Supabase sin exponer tus secretos.</p><button disabled={busy} onClick={checkX}>{busy ? "Comprobando..." : "Comprobar conexión con X"}</button></div><div className="feature-art">𝕏</div></section><section className="panel"><div className="section-head"><h2>Actividad reciente</h2><button className="link-button" onClick={() => setTab("history")}>Ver historial →</button></div>{posts.length ? posts.slice(0, 3).map(post => <article className="post" key={post.id}><p>{post.content}</p><small>{new Date(post.posted_at).toLocaleString("es-ES")}</small></article>) : <p className="muted">Todavía no hay publicaciones registradas.</p>}</section></>}{tab === "publish" && <section className="panel composer"><span className="eyebrow">COMPOSITOR</span><h2>¿Qué quieres compartir?</h2><textarea maxLength={280} placeholder="Escribe tu publicación..." value={draft} onChange={e => setDraft(e.target.value)} /><div className="compose-bottom"><span>{draft.length}/280 caracteres</span><button disabled={busy || !draft.trim()} onClick={publish}>{busy ? "Publicando..." : "Publicar en X"}</button></div><p className="muted">No se publicará nada sin tu confirmación.</p></section>}{tab === "history" && <section className="panel"><h2>Historial</h2>{posts.length ? posts.map(post => <article className="post" key={post.id}><p>{post.content}</p><small>{new Date(post.posted_at).toLocaleString("es-ES")}{post.x_post_id ? " · ID: " + post.x_post_id : ""}</small></article>) : <p className="muted">No hay publicaciones registradas todavía.</p>}</section>}</main></div>;
}
async function functionError(error: { message: string; context?: Response }): Promise<string> {
  try { const data = await error.context?.clone().json(); return data?.error ?? data?.message ?? error.message; } catch { return error.message; }
}
