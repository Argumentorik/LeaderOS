import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Building, Plus } from 'lucide-react';
import { WladBotAvatar } from '../brand/WladBotAvatar';
const ContextPanel = ({ userContext, setUserContext, de }) => (
  <div className="flex gap-2 pb-3 animate-fade-in" data-testid="context-panel">
    <Input value={userContext.role} onChange={e => setUserContext(p => ({ ...p, role: e.target.value }))}
      placeholder={de ? 'Deine Rolle (z.B. Team Lead)' : 'Your Role'} className="h-8 text-xs bg-gray-50 dark:bg-muted/30" data-testid="context-role" />
    <Input value={userContext.company} onChange={e => setUserContext(p => ({ ...p, company: e.target.value }))}
      placeholder={de ? 'Unternehmen' : 'Company'} className="h-8 text-xs bg-gray-50 dark:bg-muted/30" data-testid="context-company" />
    <Input value={userContext.industry} onChange={e => setUserContext(p => ({ ...p, industry: e.target.value }))}
      placeholder={de ? 'Branche' : 'Industry'} className="h-8 text-xs bg-gray-50 dark:bg-muted/30" data-testid="context-industry" />
  </div>
);

export const ChatRolesHeader = ({
  showContext, setShowContext, userContext, setUserContext,
  onNewSession, lang, de,
}) => {
  // lang is kept in the signature for future i18n hooks but not consumed here.
  void lang;
  return (
    <div className="border-b border-black/[0.06] dark:border-white/[0.06] bg-white/80 dark:bg-card/80 backdrop-blur-xl">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WladBotAvatar size={38} live />
            <div>
              <h2 className="text-lg font-black">WladBot</h2>
              <p className="text-[11px] text-muted-foreground font-medium">{de ? 'Dein KI Leadership Coach' : 'Your AI Leadership Coach'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowContext(!showContext)}
              className={`text-xs font-semibold h-8 border-black/10 dark:border-white/10 ${showContext ? 'bg-[#BFFF00]/[0.06] dark:bg-[#BFFF00]/10 border-[#BFFF00]/30' : ''}`}
              data-testid="context-toggle-btn">
              <Building size={12} className="mr-1" /> {de ? 'Kontext' : 'Context'}
            </Button>
            <Button variant="outline" size="sm" onClick={onNewSession} className="text-xs font-semibold h-8 border-black/10 dark:border-white/10" data-testid="new-chat-session-btn">
              <Plus size={12} className="mr-1" /> {de ? 'Neuer Chat' : 'New Chat'}
            </Button>
          </div>
        </div>

        {showContext && <ContextPanel userContext={userContext} setUserContext={setUserContext} de={de} />}
      </div>
    </div>
  );
};
