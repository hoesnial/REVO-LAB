import { StudioApp } from "@/shared/studio-app";
export default async function Page({params}:{params:Promise<{path?:string[]}>}) {const {path=[]} = await params;return <StudioApp path={path}/>;}
