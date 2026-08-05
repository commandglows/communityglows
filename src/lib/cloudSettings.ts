import { enqueueSettingsPatch, flushCloudSyncQueue } from "@/lib/cloudSyncQueue";
import type { AppShortcut } from "@/stores/shortcuts";
import type { ThemeMode } from "@/utils/themeAuto";

export interface CloudSettingsPatch {
  theme?: ThemeMode;
  language?: string;
  sidebarVisible?: boolean;
  grayscaleEnabled?: boolean;
  textZoom?: number;
  hapticEnabled?: boolean;
  tapSoundEnabled?: boolean;
  tapSoundVariant?: "classic" | "soft" | "pop";
  keyboardShortcuts?: AppShortcut[];
  activeProfileId?: string;
  onboardingCompleted?: boolean;
  friendsFilterEnabled?: boolean;
}

export async function syncSettingsPatch(patch: CloudSettingsPatch) {
  enqueueSettingsPatch(patch);
  await flushCloudSyncQueue();
}
