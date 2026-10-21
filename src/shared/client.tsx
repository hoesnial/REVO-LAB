"use client";
import { createContext, useContext, useState, type ReactNode, useCallback } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { emptyState, type StudioState, type StudioRecord, type Kind, type AgentId } from "./domain";
export async function api<T = unknown>(url:string, body?:unknown, method="POST"):Promise<T> {
  const response = await fetch(url,{method:body === undefined ? "GET" : method,headers:body === undefined ? {} : {"Content-Type":"application/json"},body:body === undefined ? undefined : JSON.stringify(body)});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data;
}
type Dialog = {type:"record";kind:Kind;record?:StudioRecord;projectId?:string;goalId?:string;parentId?:string;initialTitle?:string;initialData?:Record<string,string>} | {type:"capture"} | {type:"auth"} | {type:"agent";agent:AgentId} | null;
type ContextValue = {state:StudioState;loading:boolean;error:string|null;refresh:()=>Promise<void>;dialog:Dialog;setDialog:(dialog:Dialog)=>void;toast:(message:string)=>void;requireAuth:()=>boolean;dark:boolean;setDark:(value:boolean)=>void};
const StudioContext = createContext<ContextValue | null>(null);
export function useStudio() { const context = useContext(StudioContext); if (!context) throw new Error("StudioProvider missing"); return context; }
function DataProvider({children}:{children:ReactNode}) {
  const query = useQuery({queryKey:["studio"],queryFn:()=>api<StudioState>("/api/state"),refetchInterval:5000,refetchOnWindowFocus:true,retry:1});
  const client = useQueryClient();
  const [dialog,setDialog] = useState<Dialog>(null);
  const [message,setMessage] = useState("");
  const [dark,setDarkState] = useState(false);
  const state = query.data || emptyState;
  const refresh = useCallback(async () => {await client.invalidateQueries({queryKey:["studio"]});},[client]);
  const toast = useCallback((text:string) => {setMessage(text);setTimeout(()=>setMessage(""),4500);},[]);
  const setDark = (value:boolean) => {setDarkState(value);document.documentElement.dataset.theme = value ? "dark" : "light";localStorage.setItem("studio-theme",value ? "dark" : "light");};
  return <StudioContext.Provider value={{state,loading:query.isLoading,error:query.error?.message || null,refresh,dialog,setDialog,toast,requireAuth:()=>{if (state.user) return true;setDialog({type:"auth"});return false;},dark,setDark}}>{children}{message && <div className="toast" role="status">{message}</div>}</StudioContext.Provider>;
}
export function StudioProvider({children}:{children:ReactNode}) {const [client] = useState(()=>new QueryClient());return <QueryClientProvider client={client}><DataProvider>{children}</DataProvider></QueryClientProvider>;}
