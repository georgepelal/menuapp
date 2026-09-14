import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppState } from '../../types';
import {
  fetchPublicMenuBundle,
  recordMenuView,
  recordItemClick,
  submitLead,
  submitServiceRequest,
  submitFeedback,
  businessToProfile,
} from '../../services/supabaseData';
import PublicMenu from './PublicMenu';

// Route element for /m/:slug — the only entry point that matters for a
// scanned QR code, so it must work for a fully anonymous, logged-out visitor
// on a fresh page load (the old app's `#public` hash never actually did).
const PublicMenuPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [state, setState] = useState<'loading' | 'not-found' | 'ready'>('loading');
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [data, setData] = useState<AppState | null>(null);
  const hasViewedRef = useRef(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    fetchPublicMenuBundle(slug)
      .then(bundle => {
        if (!mounted) return;
        if (!bundle) {
          setState('not-found');
          return;
        }
        setBusinessId(bundle.business.id);
        setData({
          profile: businessToProfile(bundle.business),
          categories: bundle.categories,
          items: bundle.items,
          stats: { totalViews: 0, itemClicks: {}, lastReset: 0 },
          leads: [],
          serviceRequests: [],
          feedback: [],
        });
        setState('ready');
      })
      .catch(() => {
        if (mounted) setState('not-found');
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const handleInteraction = (type: string, payload?: any) => {
    if (!businessId) return;
    switch (type) {
      case 'view':
        if (!hasViewedRef.current) {
          hasViewedRef.current = true;
          recordMenuView(businessId).catch(() => {});
        }
        break;
      case 'click_item':
        recordItemClick(businessId, payload as string).catch(() => {});
        break;
      case 'lead_submit':
        submitLead(businessId, payload.email, payload.name).catch(() => {});
        break;
      case 'service_request':
        submitServiceRequest(businessId, payload.type, payload.table).catch(() => {});
        break;
      case 'feedback_submit':
        submitFeedback(businessId, payload.rating, payload.comment).catch(() => {});
        break;
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  if (state === 'not-found' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Menu not found</h1>
          <p className="text-slate-500">This link may be outdated, or the venue is no longer published.</p>
        </div>
      </div>
    );
  }

  return <PublicMenu data={data} onBack={() => window.history.back()} onInteraction={handleInteraction} />;
};

export default PublicMenuPage;
