import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLogin() {
  const { loginAdmin } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate("/admin/merchants", { replace: true });
    } catch (error: any) {
      showError(error.message || "Unable to sign in to the admin portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pos-bg flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-pos-card border border-pos-border rounded-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <ShieldCheck className="mx-auto text-blue-400" size={34} />
          <h1 className="text-xl font-bold text-pos-text">Platform Admin</h1>
          <p className="text-sm text-pos-muted">Secure merchant management access</p>
        </div>
        <Input label="Admin email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Button type="submit" className="w-full" loading={loading}>Sign in securely</Button>
      </form>
    </main>
  );
}
