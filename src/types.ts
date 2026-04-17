export type Device = {
  id: string;
  user_id: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  manual_code: string | null;
  qr_payload: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceDraft = {
  name: string;
  manufacturer: string;
  model: string;
  manual_code: string;
  qr_payload: string;
};
