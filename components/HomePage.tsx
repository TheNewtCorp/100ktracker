import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { BarChart3, UsersRound, SearchCode, Target, BookUser, Watch as WatchIcon, CreditCard, Bell } from 'lucide-react';
import AppIcon from './AppIcon';
import FullScreenApp from './FullScreenApp';
import { Tool, AppTool, Lead, Alert } from '../types';

import MetricsPage from './pages/MetricsPage';
import LeadsPage from './pages/LeadsPage';
import LDFPage from './pages/LDFPage';
import TPEPage from './pages/TPEPage';
import ContactsPage from './pages/ContactsPage';
import InventoryPage from './pages/InventoryPage';
import PaymentsPage from './pages/PaymentsPage';

const tools: AppTool[] = [
  { id: Tool.Metrics, title: 'Metrics', description: 'Analyze your performance.' },
  { id: Tool.Leads, title: 'Leads', description: 'Manage potential deals.' },
  { id: Tool.LDF, title: 'LDF', description: 'Find luxury deals.' },
  { id: Tool.TPE, title: 'TPE', description: 'Evaluate target prices.' },
  { id: Tool.Contacts, title: 'Contacts', description: 'Manage your contacts.' },
  { id: Tool.Inventory, title: 'Inventory', description: 'Track your watch inventory.' },
  { id: Tool.Payments, title: 'Payments', description: 'Create and manage invoices.' },
];

const icons: { [key in Tool]: React.ReactNode } = {
  [Tool.Metrics]: <BarChart3 className="w-12 h-12" />,
  [Tool.Leads]: <UsersRound className="w-12 h-12" />,
  [Tool.LDF]: <SearchCode className="w-12 h-12" />,
  [Tool.TPE]: <Target className="w-12 h-12" />,
  [Tool.Contacts]: <BookUser className="w-12 h-12" />,
  [Tool.Inventory]: <WatchIcon className="w-12 h-12" />,
  [Tool.Payments]: <CreditCard className="w-12 h-12" />,
};

const pages: { [key in Tool]: React.ComponentType<any> } = {
    [Tool.Metrics]: MetricsPage,
    [Tool.Leads]: LeadsPage,
    [Tool.LDF]: LDFPage,
    [Tool.TPE]: TPEPage,
    [Tool.Contacts]: ContactsPage,
    [Tool.Inventory]: InventoryPage,
    [Tool.Payments]: PaymentsPage,
};


const HomePage: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<AppTool | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleLeadsUpdate = (leads: Lead[]) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      const upcomingAlerts: Alert[] = leads
          .filter(lead => {
              if (!lead.reminderDate) return false;
              // Ensure date is parsed correctly, assuming YYYY-MM-DD
              const [year, month, day] = lead.reminderDate.split('-').map(Number);
              const reminderDate = new Date(year, month - 1, day);
              return reminderDate >= now;
          })
          .map(lead => ({
              id: lead.id,
              leadTitle: lead.title,
              message: `Follow up required for "${lead.title}".`,
              dueDate: lead.reminderDate!,
          }))
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      setAlerts(upcomingAlerts);
  };
  
  const pageElement = useMemo(() => {
    if (!selectedApp) return null;
    const PageComponent = pages[selectedApp.id];
    if (selectedApp.id === Tool.Leads) {
        return <PageComponent onLeadsUpdate={handleLeadsUpdate} />;
    }
    return <PageComponent />;
  }, [selectedApp]);

  return (
    <LayoutGroup>
      <div className="p-4 sm:p-8 min-h-screen">
        <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-champagne-gold tracking-wider">
                100KTracker
            </h1>
            <p className="mt-2 text-platinum-silver/70 text-lg">Dashboard</p>
        </header>

        <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1
                    }
                }
            }}
            initial="hidden"
            animate="show"
        >
            {tools.map((tool) => (
                <AppIcon 
                    key={tool.id}
                    tool={tool}
                    icon={icons[tool.id]}
                    onClick={() => setSelectedApp(tool)}
                />
            ))}
        </motion.div>

        <div className="max-w-7xl mx-auto mt-16">
            <AnimatePresence>
                {alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <h2 className="text-2xl font-semibold text-platinum-silver mb-4">Alerts & Reminders</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alerts.slice(0, 3).map(alert => ( // Show max 3 alerts on dashboard
                                <motion.div 
                                    key={alert.id}
                                    className="bg-charcoal-slate p-4 rounded-xl border border-champagne-gold/20 flex items-start gap-4"
                                    layout
                                >
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-champagne-gold/10 text-champagne-gold rounded-full mt-1">
                                      <Bell size={18} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-platinum-silver">{alert.leadTitle}</p>
                                      <p className="text-sm text-platinum-silver/80 mt-1">{alert.message}</p>
                                      <p className="text-xs text-platinum-silver/60 mt-2 font-mono">Due: {new Date(alert.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedApp && (
            <FullScreenApp 
              tool={selectedApp} 
              onClose={() => setSelectedApp(null)}
            >
               {pageElement}
            </FullScreenApp>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
};

export default HomePage;