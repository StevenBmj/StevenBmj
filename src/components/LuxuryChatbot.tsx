import { Bot } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigation } from '../context/NavigationContext';
import AssistantPanel from './AssistantPanel';

export default function LuxuryChatbot() {
  const { language, user } = useApp();
  const { route } = useNavigation();
  const [open, setOpen] = useState(false);
  if (route.view === 'god' || route.panel === 'commande') return null;
  const label = language === 'FR' ? 'Conseiller StevenBmj' : 'StevenBmj advisor';
  return <div className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] right-3 sm:right-5 z-40 text-left" key={user?.id || 'visitor'}>
    {open ? <AssistantPanel onClose={() => setOpen(false)} />
      : <button id="btn-chatbot-launch" type="button" onClick={() => setOpen(true)} aria-label={label} title={label}
        className="h-14 w-14 rounded-full bg-amber-300 text-black shadow-xl flex items-center justify-center hover:bg-amber-200 transition-colors">
        <Bot className="h-6 w-6" />
      </button>}
  </div>;
}
