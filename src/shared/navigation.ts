import { LayoutDashboard, Sun, CheckSquare, Target, CalendarDays, FolderKanban, Boxes, Lightbulb, GraduationCap, BookOpen, Landmark, FlaskConical, BriefcaseBusiness, Send, PanelsTopLeft, Clapperboard, Wallet, Sparkles, Code2, Telescope, TrendingUp, NotebookPen, Repeat2 } from "lucide-react";
export const navGroups = [
  {title:"STUDIO",items:[{label:"Dashboard",href:"/",icon:LayoutDashboard},{label:"Today",href:"/today",icon:Sun}]},
  {title:"EXECUTION",items:[{label:"Tasks",href:"/tasks",icon:CheckSquare},{label:"Goals",href:"/goals",icon:Target},{label:"Calendar",href:"/calendar",icon:CalendarDays}]},
  {title:"BUILD",items:[{label:"Projects",href:"/projects",icon:FolderKanban},{label:"Product Lab",href:"/products",icon:Boxes},{label:"Idea Vault",href:"/ideas",icon:Lightbulb}]},
  {title:"LEARN",items:[{label:"Learning",href:"/learning",icon:GraduationCap},{label:"Knowledge",href:"/knowledge",icon:BookOpen}]},
  {title:"ACADEMIC",items:[{label:"College",href:"/academic",icon:Landmark},{label:"Thesis Lab",href:"/thesis",icon:FlaskConical}]},
  {title:"CAREER",items:[{label:"Career",href:"/career",icon:BriefcaseBusiness},{label:"Applications",href:"/career/applications",icon:Send},{label:"Portfolio",href:"/career/portfolio",icon:PanelsTopLeft}]},
  {title:"CREATE & GROW",items:[{label:"Content Studio",href:"/content",icon:Clapperboard},{label:"Finance",href:"/finance",icon:Wallet},{label:"Habits",href:"/habits",icon:Repeat2}]},
  {title:"AI TEAM",items:[{label:"Chief of Staff",href:"/ai/chief",icon:Sparkles},{label:"Engineer",href:"/ai/engineer",icon:Code2},{label:"Research & Learning",href:"/ai/research",icon:Telescope},{label:"Growth & Business",href:"/ai/growth",icon:TrendingUp}]},
  {title:"REFLECT",items:[{label:"Weekly Review",href:"/reviews/weekly",icon:NotebookPen},{label:"Monthly Review",href:"/reviews/monthly",icon:NotebookPen}]},
];
