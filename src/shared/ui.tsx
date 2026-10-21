"use client";
import { X, ArrowUpRight, Plus, Inbox, Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
export function Button({children,variant="primary",className="",...props}:ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"primary"|"secondary"|"ghost"}) {return <button className={`button ${variant} ${className}`} {...props}>{children}</button>;}
export function Modal({title,subtitle,children,onClose,wide=false}:{title:string;subtitle?:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=> {
    const previous = document.activeElement as HTMLElement;
    const element = ref.current;
    const focusable = () => Array.from(element?.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex="0"]') || []).filter(el=>!el.hasAttribute("disabled"));
    const initial = element?.querySelector<HTMLElement>('input:not([disabled]):not([type="hidden"]):not([type="file"]), textarea:not([disabled]), select:not([disabled])');
    (initial || focusable()[0])?.focus();
    const handle = (e:KeyboardEvent) => {if(e.key === "Escape") onClose();if(e.key === "Tab") {const list=focusable();const first=list[0];const last=list[list.length-1];if(e.shiftKey && document.activeElement === first){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement === last){e.preventDefault();first?.focus();}}};
    document.addEventListener("keydown",handle);const original=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.removeEventListener("keydown",handle);document.body.style.overflow=original;previous?.focus();};
  },[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget) onClose();}}><div className={`modal ${wide ? "wide" : ""}`} ref={ref} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19}/></button></div>{children}</div></div>;
}
export function Empty({title,description,action,onAction,compact=false}:{title:string;description:string;action?:string;onAction?:()=>void;compact?:boolean}) {return <div className={`empty ${compact ? "compact" : ""}`}><div className="empty-icon"><Inbox size={21} strokeWidth={1.5}/></div><h3>{title}</h3><p>{description}</p>{action && <Button variant="secondary" onClick={onAction}><Plus size={15}/>{action}</Button>}</div>;}
export function PanelHeading({title,subtitle,href,action,onAction}:{title:string;subtitle?:string;href?:string;action?:string;onAction?:()=>void}) {return <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{href ? <Link className="text-link" href={href}>{action || "View all"}<ArrowUpRight size={14}/></Link> : onAction ? <button className="text-link" onClick={onAction}>{action || "Add"}<Plus size={14}/></button> : null}</div>;}
export function Badge({children,color="neutral"}:{children:ReactNode;color?:string}) {return <span className={`badge ${color}`}>{children}</span>;}
export function Progress({value}:{value:number}) {return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${value}%`}}/></div>;}
export function Loading(){return <LoaderCircle className="spin" size={16}/>;}
export function Checkbox({checked,onClick,label}:{checked:boolean;onClick:()=>void;label:string}) {return <button className={`task-check ${checked ? "checked" : ""}`} onClick={onClick} aria-label={label} aria-pressed={checked}>{checked && <Check size={13}/>}</button>;}
export function Select({value,onChange,options,label}:{value:string;onChange:(value:string)=>void;options:string[];label:string}) {return <div className="select-wrap"><select value={value} onChange={e=>onChange(e.target.value)} aria-label={label}>{options.map(option=><option key={option}>{option}</option>)}</select><ChevronDown size={14}/></div>;}
