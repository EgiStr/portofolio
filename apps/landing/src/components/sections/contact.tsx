import { getSettings } from "@ecosystem/config";
import { ContactClient } from "./contact.client";

export async function Contact() {
  const settings = await getSettings();
  return <ContactClient email={settings.email} />;
}
