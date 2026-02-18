import { getPreferenceValues } from "@raycast/api";
import type { ExtensionPreferences } from "../types";

export function getPreferences(): ExtensionPreferences {
  return getPreferenceValues<ExtensionPreferences>();
}
