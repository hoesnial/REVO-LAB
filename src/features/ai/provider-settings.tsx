"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, Eye, EyeOff, Plug, Save, ShieldCheck } from "lucide-react";
import { api, useStudio } from "@/shared/client";
import { Badge, Button, Empty, Loading } from "@/shared/ui";
import { providerPresets, type AIProviderSummary, type TokenParameter } from "@/shared/ai-provider";

type Draft = Omit<AIProviderSummary, "source" | "hasApiKey"> & { apiKey: string };
function initialDraft(saved: AIProviderSummary | null): Draft {
  const value = saved?.source !== "none" && saved ? saved : providerPresets[0];
  return { name: value.name, baseURL: value.baseURL, model: value.model, keyless: value.keyless,
    tokenParameter: value.tokenParameter, embeddingModel: value.embeddingModel, transcriptionModel: value.transcriptionModel, apiKey: "" };
}

export function ProviderSettings() {
  const { state, setDialog } = useStudio();
  return <section className="panel provider-settings" id="ai-provider" aria-label="AI provider settings">
    <div className="panel-heading"><div><h2><Plug size={17}/> AI provider</h2><p>Choose the model that powers all four teammates.</p></div><Badge color={state.aiConfigured ? "green" : "neutral"}>{state.aiConfigured ? "Configured" : "Not configured"}</Badge></div>
    {state.user ? <ProviderForm key={state.user.id} saved={state.aiProvider}/> : <Empty compact title="Connect your AI team." description="Sign in to securely save your provider and model." action={state.setupRequired ? "Set up studio" : "Sign in"} onAction={()=>setDialog({type:"auth"})}/>}
  </section>;
}

function ProviderForm({ saved }: { saved: AIProviderSummary | null }) {
  const { refresh, toast } = useStudio();
  const [draft, setDraft] = useState<Draft>(()=>initialDraft(saved));
  const [preset, setPreset] = useState(()=>providerPresets.find(p=>p.baseURL === draft.baseURL)?.name || "Custom");
  const [busy, setBusy] = useState<"save" | "test" | "models" | "remove" | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [visibleKey, setVisibleKey] = useState(false);
  const [notice, setNotice] = useState<{message:string;kind:"success"|"warning"|"error"}|null>(null);
  const [dirty, setDirty] = useState(false);
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(prev=>({...prev,[key]:value})); setNotice(null); setDirty(true);
    if (key === "baseURL" || key === "apiKey" || key === "keyless") setModels([]);
  }
  async function action(kind: "save" | "test" | "models") {
    setBusy(kind); setNotice(null);
    try {
      if (kind === "models") {
        const result = await api<{models:string[]}>("/api/ai/provider",{action:kind,config:draft});
        setModels(result.models);
        setNotice({kind:result.models.length ? "success" : "warning",message:result.models.length ? `${result.models.length} models loaded. Choose one below or enter any model ID manually.` : "The provider returned no models. Enter a model ID manually; local models must be installed on your server first."});
      } else if (kind === "test") {
        const result = await api<{supportsTools:boolean;message:string}>("/api/ai/provider",{action:kind,config:draft});
        setNotice({kind:result.supportsTools ? "success" : "warning",message:result.message});
      } else {
        await api<AIProviderSummary>("/api/ai/provider",{action:kind,config:draft});
        setDraft(prev=>({...prev,apiKey:""})); setVisibleKey(false); setDirty(false);
        await refresh();
        setNotice({kind:"success",message:"Provider saved. All four agents will use this model for their next request."});
        toast("AI provider saved. Your team is ready.");
      }
    } catch (error) { setNotice({kind:"error",message:(error as Error).message}); }
    finally { setBusy(null); }
  }
  const reusableKey = !!saved?.hasApiKey && saved.baseURL.replace(/\/+$/, "") === draft.baseURL.replace(/\/+$/, "");
  return <form className="form provider-form" onSubmit={e=>{e.preventDefault();void action("save");}}>
    <p className="form-note">Supports OpenAI-compatible Chat Completions APIs. Studio tasks need a model with function calling. Model IDs are editable; you can also load them from your provider.</p>
    {saved?.source !== "none" && saved && <div className="provider-current"><Check size={14}/><span>Active: <strong>{saved.name} · {saved.model}</strong><small>{saved.source === "environment" ? "Using server environment; saving here overrides it." : "Saved in your studio. New requests use this configuration."}</small></span></div>}
    <fieldset disabled={!!busy}>
      <label>Provider preset<select value={preset} onChange={e=>{const selected=providerPresets.find(p=>p.name === e.target.value)!;setPreset(selected.name);setDraft({...selected,apiKey:""});setModels([]);setNotice(null);setDirty(true);}}>{providerPresets.map(p=><option key={p.name}>{p.name}</option>)}</select></label>
      <label>Provider name<input value={draft.name} maxLength={80} required onChange={e=>change("name",e.target.value)} placeholder="My AI provider"/></label>
      <label>API base URL<input type="url" value={draft.baseURL} required maxLength={2000} onChange={e=>change("baseURL",e.target.value)} placeholder="https://your-provider.com/v1"/><small>Use the base URL, without /chat/completions. Local URLs are reached from the Studio server.</small></label>
      <label className="provider-checkbox"><input type="checkbox" checked={draft.keyless} onChange={e=>{change("keyless",e.target.checked);setDraft(prev=>({...prev,apiKey:""}));}}/>No API key (local or unauthenticated server)</label>
      {!draft.keyless && <label>API key<div className="provider-key-input"><input aria-label="API key" type={visibleKey ? "text" : "password"} value={draft.apiKey} autoComplete="new-password" spellCheck={false} maxLength={4096} onChange={e=>change("apiKey",e.target.value)} placeholder={reusableKey ? "Saved key · leave blank to keep it" : "Paste your provider API key"}/><button type="button" className="icon-button" aria-label={visibleKey ? "Hide API key" : "Show API key"} onClick={()=>setVisibleKey(!visibleKey)}>{visibleKey ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div><small>{reusableKey ? "Your saved key is never sent back to the browser. Enter a new key to replace it." : "Stored encrypted on the server. A different base URL needs its own key."}</small></label>}
      <div className="provider-model-label"><label>Model ID<input value={draft.model} required maxLength={256} list="provider-models" onChange={e=>change("model",e.target.value)} placeholder="Exact model ID from your provider"/><small>Use the exact ID, including any organisation prefix or version tag.</small></label><Button type="button" variant="secondary" onClick={()=>void action("models")}>{busy === "models" ? <Loading/> : <Download size={14}/>}Load models</Button></div>
      <datalist id="provider-models">{models.map(model=><option value={model} key={model}/>)}</datalist>
      {models.length > 0 && <label>Available models<select aria-label="Available models" value="" onChange={e=>change("model",e.target.value)}><option value="" disabled>Select a model…</option>{models.map(model=><option key={model}>{model}</option>)}</select></label>}
      <details className="provider-advanced"><summary>Advanced · tokens, embeddings & voice</summary><div className="form">
        <label>Token limit parameter<select value={draft.tokenParameter} onChange={e=>change("tokenParameter",e.target.value as TokenParameter)}><option value="max_tokens">max_tokens · most compatible providers</option><option value="max_completion_tokens">max_completion_tokens · recent OpenAI models</option></select></label>
        <label>Embedding model (optional)<input value={draft.embeddingModel} maxLength={256} onChange={e=>change("embeddingModel",e.target.value)} placeholder="Leave blank for keyword knowledge search"/></label>
        <label>Transcription model (optional)<input value={draft.transcriptionModel} maxLength={256} onChange={e=>change("transcriptionModel",e.target.value)} placeholder="Leave blank to disable voice transcription"/></label>
        <p className="form-note">These models use the same provider URL and key. Image/PDF input and voice depend on provider support.</p>
      </div></details>
      <p className="provider-security"><ShieldCheck size={14}/>API keys are excluded from studio exports.</p>
      <div className="form-actions"><Button type="button" variant="secondary" onClick={()=>void action("test")}>{busy === "test" ? <Loading/> : <Plug size={15}/>}Test connection</Button><Button type="submit">{busy === "save" ? <Loading/> : <Save size={15}/>}Save provider</Button></div>
      <p className="form-note">Test sends one small model request and may use provider credits. Loading or testing a model does not save settings or create a task.{dirty ? " You have unsaved changes." : ""}</p>
    </fieldset>
    {notice && <div role={notice.kind === "error" ? "alert" : "status"} className={`provider-notice ${notice.kind}`}>{notice.message}</div>}
    {saved?.source !== "none" && saved && <Link className="text-link provider-chat-link" href="/ai/chief">Give your team a task<ArrowRight size={14}/></Link>}
    {saved?.source === "settings" && <Button type="button" variant="ghost" disabled={!!busy} onClick={async()=>{
      if(!window.confirm("Remove this saved provider and API key? Studio will use server environment credentials if configured."))return;
      setBusy("remove");setNotice(null);
      try {const result=await api<AIProviderSummary>("/api/ai/provider",{action:"remove"});setDraft(initialDraft(result));setPreset(providerPresets.find(p=>p.baseURL === result.baseURL)?.name || "Custom");setModels([]);setDirty(false);await refresh();toast("Saved provider removed.");}
      catch(error){setNotice({kind:"error",message:(error as Error).message});}finally{setBusy(null);}
    }}>Remove saved provider</Button>}
  </form>;
}
