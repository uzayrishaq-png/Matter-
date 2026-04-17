import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./auth/LoginPage";
import { AuthCallback } from "./auth/AuthCallback";
import { Protected } from "./components/Protected";
import { DeviceListPage } from "./devices/DeviceListPage";
import { DeviceFormPage } from "./devices/DeviceFormPage";
import { DeviceDetailPage } from "./devices/DeviceDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <Protected>
            <DeviceListPage />
          </Protected>
        }
      />
      <Route
        path="/device/new"
        element={
          <Protected>
            <DeviceFormPage />
          </Protected>
        }
      />
      <Route
        path="/device/:id"
        element={
          <Protected>
            <DeviceDetailPage />
          </Protected>
        }
      />
      <Route
        path="/device/:id/edit"
        element={
          <Protected>
            <DeviceFormPage />
          </Protected>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center text-slate-400">
      Page not found.
    </div>
  );
}
