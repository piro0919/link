"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updateLinkIdSchema, updateProfileSchema } from "./schema";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const t = await getTranslations("Profile");
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      error: t("validationCheck"),
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.sub);

  if (error) {
    return { error: t("profileUpdateFailed") };
  }

  revalidatePath("/profile");
  return { success: true };
}

export type LinkIdState = {
  error?: string;
  success?: boolean;
};

export async function updateLinkId(
  _prevState: LinkIdState,
  formData: FormData,
): Promise<LinkIdState> {
  const supabase = await createClient();
  const t = await getTranslations("Profile");
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const parsed = updateLinkIdSchema.safeParse({
    linkId: formData.get("linkId"),
  });

  if (!parsed.success) {
    return {
      error: t("validationCheck"),
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ link_id: parsed.data.linkId })
    .eq("id", user.sub);

  if (error) {
    if (error.code === "23505") {
      return { error: t("linkIdTaken") };
    }
    return { error: t("linkIdUpdateFailed") };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
