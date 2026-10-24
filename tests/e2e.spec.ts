import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
test("Founder can plan, capture, learn, and use the real office across routes",async({page})=>{
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/");await expect(page.getByRole("heading",{name:/Good .*Founder/})).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  const unauthorized=await page.request.post("/api/records",{data:{kind:"task",title:"Should not save",status:"Planned",data:{}}});expect(unauthorized.status()).toBe(401);
  await page.getByRole("button",{name:"Set up my studio"}).click();await page.getByLabel("Your name").fill("Test Founder");await page.getByLabel("Email",{exact:true}).fill("e2e@test.invalid");await page.getByLabel("Password",{exact:true}).fill("private-test-password");await page.getByRole("button",{name:"Create my studio"}).click();await expect(page.getByRole("dialog")).toHaveCount(0);await expect(page.getByRole("heading",{name:/Good .*Test/})).toBeVisible();
  const crossOrigin=await page.request.post("/api/records",{headers:{origin:"https://untrusted.invalid"},data:{kind:"task",title:"No",status:"Planned",data:{}}});expect(crossOrigin.status()).toBe(403);
  await page.goto("/goals");await page.getByRole("button",{name:"New goal"}).click();await page.getByLabel("Title",{exact:true}).fill("Ship one useful product");await page.getByLabel("Category",{exact:true}).selectOption("Product");await page.getByRole("button",{name:"Save goal"}).click();await expect(page.getByRole("heading",{name:"Ship one useful product"})).toBeVisible();
  await page.goto("/projects");await page.getByRole("button",{name:"New project"}).click();await page.getByLabel("Title",{exact:true}).fill("Test app");await page.getByLabel("Status",{exact:true}).selectOption("Building");await page.getByLabel("Linked goal").selectOption({label:"Ship one useful product"});await page.getByLabel("Tech stack").fill("Next.js, TypeScript");await page.getByRole("button",{name:"Save project"}).click();await page.getByRole("link").filter({has:page.getByRole("heading",{name:"Test app",exact:true})}).click();await expect(page).toHaveURL(/\/projects\/[^/]+$/);await expect(page.getByRole("heading",{name:"Test app",exact:true,level:1})).toBeVisible();
  const detail=page.url();await page.reload();await expect(page.getByRole("heading",{name:"Test app",exact:true,level:1})).toBeVisible();await page.goBack();await expect(page).toHaveURL(/\/projects$/);await page.goForward();await expect(page).toHaveURL(detail);await expect(page.getByRole("heading",{name:"Test app",exact:true,level:1})).toBeVisible();
  await page.getByRole("button",{name:"Add linked task"}).click();await page.getByLabel("Title",{exact:true}).fill("Define the first milestone");await page.getByLabel("Priority",{exact:true}).selectOption("P0");await page.getByRole("button",{name:"Save task"}).click();await page.getByRole("button",{name:"Tasks",exact:true}).click();await expect(page.getByText("Define the first milestone",{exact:true})).toBeVisible();
  await page.goto("/today");await expect(page.getByText("Define the first milestone",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Complete Define the first milestone",exact:true}).click();await expect(page.getByText("Define the first milestone",{exact:true})).toHaveCount(0);await page.goto(detail);await expect(page.getByRole("heading",{name:"Test app",exact:true})).toBeVisible();
  await page.keyboard.press("Meta+k");await expect(page.getByRole("dialog")).toBeVisible();await page.getByPlaceholder("What’s on your mind?").fill("Belajar MCP besok malam");await page.getByRole("button",{name:"Continue to task"}).click();await expect(page.getByLabel("Title",{exact:true})).toHaveValue("Belajar MCP besok malam");await page.getByRole("button",{name:"Save task"}).click();
  await page.goto("/learning");await page.getByRole("button",{name:"New skill"}).click();await page.getByLabel("Title",{exact:true}).fill("Retrieval augmented generation");await page.getByLabel("Status",{exact:true}).selectOption("Learning");await page.getByLabel("Domain",{exact:true}).selectOption("AI Engineering");await page.getByRole("button",{name:"Save skill"}).click();await page.goto("/learning/sessions");await page.getByRole("button",{name:"Log a session"}).click();await page.getByLabel("Title",{exact:true}).fill("RAG reading");await page.getByLabel("Skill record ID").selectOption({label:"Retrieval augmented generation"});await page.getByLabel("Topic",{exact:true}).fill("Retrieval evaluation");await page.getByLabel("Study date").fill("2026-10-06");await page.getByLabel("Duration in minutes").fill("45");await page.getByRole("button",{name:"Save study session"}).click();await expect(page.getByText("45 minutes · Retrieval evaluation")).toBeVisible();
  await page.goto("/finance");await page.getByRole("button",{name:"New transaction"}).click();await page.getByLabel("Title",{exact:true}).fill("Test income");await page.getByLabel("Amount · Rp").fill("50000");await page.getByLabel("Category",{exact:true}).fill("Freelance");await page.getByLabel("Account",{exact:true}).fill("Bank");await page.getByLabel("Transaction date").fill("2026-10-06");await page.getByRole("button",{name:"Save transaction"}).click();await expect(page.getByText("Rp 50.000",{exact:false}).first()).toBeVisible();
  await page.goto("/");await page.getByRole("button",{name:"Chief of Staff Available workspace"}).click();await expect(page.getByRole("dialog",{name:"Chief of Staff"})).toBeVisible();await expect(page.getByText("Provider not configured",{exact:true})).toBeVisible();await page.getByRole("link",{name:"Chat",exact:true}).click();await expect(page).toHaveURL(/\/ai\/chief/);await expect(page.getByRole("button",{name:"Send",exact:true})).toBeDisabled();
  const offline=await page.request.post("/api/ai",{data:{action:"run",agent:"chief",text:"What should I do today?",mode:"ASK"}});expect(offline.status()).toBe(503);
  for(const route of ["/today","/tasks","/goals","/calendar","/learning","/learning/roadmap","/learning/skills","/learning/sessions","/academic","/academic/courses","/academic/assignments","/thesis","/thesis/papers","/thesis/datasets","/thesis/experiments","/projects","/products","/ideas","/career","/career/applications","/career/portfolio","/content","/content/calendar","/knowledge","/finance","/finance/transactions","/finance/budget","/finance/goals","/ai","/ai/chief","/ai/engineer","/ai/research","/ai/growth","/reviews","/reviews/weekly","/reviews/monthly","/settings","/habits"]){await page.goto(route);await expect(page.locator("main h1")).toBeVisible();expect(page.url()).toContain(route);}
  await page.goto("/");await page.getByRole("button",{name:"Switch to dark mode"}).click();await expect(page.getByText("Night mode",{exact:true})).toBeVisible();await page.reload();await expect(page.getByText("Night mode",{exact:true})).toBeVisible();await page.getByRole("button",{name:"Switch to light mode"}).click();
  await page.getByRole("button",{name:"Switch to 2D office map"}).click();await expect(page.locator(".office-map")).toBeVisible();await page.getByRole("button",{name:"AI Engineer Not connected"}).click();await expect(page.getByRole("dialog",{name:"AI Engineer"})).toBeVisible();await page.getByRole("button",{name:"Close dialog"}).click();
  await page.setViewportSize({width:390,height:844});await page.reload();await expect(page.locator(".office-map")).toBeVisible();expect(await page.evaluate(()=>document.body.scrollWidth<=innerWidth)).toBe(true);await page.getByRole("button",{name:"Open sidebar"}).click();await expect(page.getByRole("link",{name:"Thesis Lab",exact:true})).toBeVisible();await page.getByRole("link",{name:"Thesis Lab",exact:true}).click();await expect(page.getByRole("heading",{name:"Thesis Lab.",exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

test("Founder can configure a custom provider, select models, test, and run a real agent task",async({page})=>{
  const requests:{model:string;max_tokens?:number;max_completion_tokens?:number}[]=[];
  const model="vendor/my-custom-model:latest";
  const server=createServer(async(req,res)=>{
    res.setHeader("Content-Type","application/json");
    if(req.headers.authorization !== "Bearer fake-e2e-private-key"){res.writeHead(401);res.end(JSON.stringify({error:"invalid test key"}));return;}
    if(req.url === "/v1/models"){res.end(JSON.stringify({data:[{id:model},{id:"vendor/another-model"}]}));return;}
    if(req.url !== "/v1/chat/completions"){res.writeHead(404);res.end("{}");return;}
    let raw="";for await(const chunk of req)raw+=chunk;
    const body=JSON.parse(raw);requests.push(body);
    const tool=(name:string,args:unknown)=>({content:null,tool_calls:[{id:"test_call",type:"function",function:{name,arguments:JSON.stringify(args)}}]});
    const checking=body.tools?.some((t:{function:{name:string}})=>t.function.name === "studio_connection_check");
    const action=body.tools?.some((t:{function:{name:string}})=>t.function.name === "createTask");
    const finished=body.messages.some((m:{role:string})=>m.role === "tool");
    const message=checking ? tool("studio_connection_check",{}) : action && !finished ? tool("createTask",{title:"Task from custom model",status:"Planned",data:{}}) : {content:action ? "Task from custom model was saved." : "Reply from your custom model."};
    res.end(JSON.stringify({choices:[{message}]}));
  });
  await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  const address=server.address();if(!address || typeof address === "string")throw new Error("Mock server unavailable");
  try {
    const forbidden=await page.request.get("/api/ai/provider");expect(forbidden.status()).toBe(401);
    const initial=await (await page.request.get("/api/state")).json();
    if(initial.setupRequired){const setup=await page.request.post("/api/auth",{data:{action:"setup",name:"Test Founder",email:"e2e@test.invalid",password:"private-test-password"}});expect(setup.ok()).toBe(true);}
    const login=await page.request.post("/api/auth",{data:{action:"login",email:"e2e@test.invalid",password:"private-test-password"}});expect(login.ok()).toBe(true);
    await page.goto("/ai/chief");await page.getByRole("link",{name:"Configure AI provider",exact:true}).click();
    await expect(page).toHaveURL(/\/settings#ai-provider$/);
    const panel=page.getByRole("region",{name:"AI provider settings"});
    await panel.getByLabel("Provider preset").selectOption("Custom");await panel.getByLabel("Provider name").fill("My test provider");await panel.getByLabel("API base URL").fill(`http://127.0.0.1:${address.port}/v1`);
    await panel.getByLabel("API key",{exact:true}).fill("incorrect-test-key");await panel.getByRole("button",{name:"Load models"}).click();await expect(panel.getByRole("alert")).toContainText("Check your API key");
    await panel.getByLabel("API key",{exact:true}).fill("fake-e2e-private-key");await panel.getByRole("button",{name:"Load models"}).click();await panel.getByLabel("Available models").selectOption(model);await expect(panel.getByLabel("Model ID")).toHaveValue(model);
    await panel.getByRole("button",{name:"Test connection"}).click();await expect(panel.getByRole("status")).toContainText("function calling verified");
    expect((await (await page.request.get("/api/state")).json()).aiConfigured).toBe(false);
    await panel.getByRole("button",{name:"Save provider"}).click();await expect(panel.getByRole("status")).toContainText("Provider saved");await expect(panel.getByText(`My test provider · ${model}`,{exact:true})).toBeVisible();
    const state=await (await page.request.get("/api/state")).json();expect(state.aiConfigured).toBe(true);expect(state.aiProvider.model).toBe(model);expect(JSON.stringify(state)).not.toContain("fake-e2e-private-key");
    const safeSettings=await (await page.request.get("/api/ai/provider")).json();expect(safeSettings).not.toHaveProperty("apiKey");expect(safeSettings).not.toHaveProperty("encryptedApiKey");
    await page.reload();await expect(panel.getByLabel("API key",{exact:true})).toHaveValue("");await expect(panel.getByLabel("Model ID")).toHaveValue(model);await panel.screenshot({path:".data/ai-provider-settings-desktop.png"});
    await panel.getByRole("link",{name:"Give your team a task"}).click();await page.getByLabel("Message your agent").fill("What should I focus on?");await page.getByRole("button",{name:"Send",exact:true}).click();await expect(page.getByText("Reply from your custom model.",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Action",exact:true}).click();await page.getByLabel("Message your agent").fill("Create a task called Task from custom model.");page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Send & allow changes"}).click();await expect(page.getByText("Task from custom model was saved.",{exact:true})).toBeVisible();
    await page.goto("/tasks");await expect(page.getByText("Task from custom model",{exact:true})).toBeVisible();expect(requests.every(request=>request.model === model)).toBe(true);expect(requests.at(-1)?.max_tokens).toBe(2500);expect(requests.at(-1)?.max_completion_tokens).toBeUndefined();
    await page.goto("/settings#ai-provider");await panel.getByLabel("Model ID").fill("vendor/another-model");await panel.getByRole("button",{name:"Save provider"}).click();await expect(panel.getByRole("status")).toContainText("Provider saved");
    const crossOrigin=await page.request.post("/api/ai/provider",{headers:{origin:"https://untrusted.invalid"},data:{action:"remove"}});expect(crossOrigin.status()).toBe(403);
    await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.body.scrollWidth<=innerWidth)).toBe(true);
    page.once("dialog",dialog=>dialog.accept());await panel.getByRole("button",{name:"Remove saved provider"}).click();await expect(panel.getByText("Not configured",{exact:true})).toBeVisible();
    await page.goto("/ai/chief");await expect(page.getByRole("main").getByText("Add an AI provider and model to send your first task.")).toBeVisible();await expect(page.getByRole("main").getByRole("button",{name:"Send",exact:true})).toBeDisabled();
  } finally { await new Promise<void>((resolve,reject)=>server.close(error=>error ? reject(error) : resolve())); }
});
