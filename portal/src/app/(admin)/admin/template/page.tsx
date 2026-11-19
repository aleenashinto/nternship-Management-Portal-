import { requireExactRole } from "@/lib/rbac/guard";
import { getOrCreateTemplate } from "@/services/certificate";
import { TemplateEditorClient } from "./template-editor-client";

export const dynamic = "force-dynamic";

export default async function AdminTemplatePage() {
  await requireExactRole("ADMIN");
  const tpl = await getOrCreateTemplate();
  return <TemplateEditorClient initial={JSON.parse(JSON.stringify(tpl))} />;
}
