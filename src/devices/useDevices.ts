import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Device, DeviceDraft } from "../types";

function draftToRow(draft: DeviceDraft) {
  const trim = (s: string) => s.trim();
  return {
    name: trim(draft.name),
    manufacturer: trim(draft.manufacturer) || null,
    model: trim(draft.model) || null,
    manual_code: trim(draft.manual_code) || null,
    qr_payload: trim(draft.qr_payload) || null,
  };
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("manufacturer", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });
    if (error) {
      setError(error.message);
      setDevices([]);
      return;
    }
    setError(null);
    setDevices(data as Device[]);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { devices, error, reload };
}

export async function getDevice(id: string): Promise<Device | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Device | null) ?? null;
}

export async function createDevice(draft: DeviceDraft): Promise<Device> {
  const { data, error } = await supabase
    .from("devices")
    .insert(draftToRow(draft))
    .select("*")
    .single();
  if (error) throw error;
  return data as Device;
}

export async function updateDevice(
  id: string,
  draft: DeviceDraft,
): Promise<Device> {
  const { data, error } = await supabase
    .from("devices")
    .update(draftToRow(draft))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Device;
}

export async function deleteDevice(id: string): Promise<void> {
  const { error } = await supabase.from("devices").delete().eq("id", id);
  if (error) throw error;
}
