import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL hash
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          console.error("No session_id found in URL");
          navigate('/login');
          return;
        }

        const sessionId = sessionIdMatch[1];

        // Exchange session_id for session_token
        const response = await fetch(`${API}/api/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          throw new Error('Session exchange failed');
        }

        const user = await response.json();

        // Update user with consent data from localStorage
        const consentData = localStorage.getItem('wladhub_consent');
        if (consentData) {
          const consent = JSON.parse(consentData);
          await fetch(`${API}/api/auth/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              consent_privacy: consent.privacy,
              consent_marketing: consent.marketing
            })
          });
          localStorage.removeItem('wladhub_consent');
        }

        // Store user in localStorage for quick access
        localStorage.setItem('wladhub_user', JSON.stringify(user));

        // Navigate to diagnose page with user data
        navigate('/diagnose', { state: { user } });

      } catch (error) {
        console.error("Auth callback error:", error);
        navigate('/login');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center" data-testid="auth-callback">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-manrope font-extrabold text-xl text-white">W</span>
          </div>
        </div>
        <p className="font-inter text-slate-500">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  );
}
